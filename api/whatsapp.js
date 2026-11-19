// WhatsApp Cloud API webhook for the Zanzibar Expert Assistant.
//
// Meta calls this URL:   https://visitzanzibarparadise.com/api/whatsapp
//   GET  -> one-time webhook verification (hub.challenge)
//   POST -> incoming messages from travelers
//
// It uses the SAME brain as the website chat (api/_lib/agent-core.js):
// real listings only, same safety rules. Differences on WhatsApp:
//   - conversation history is kept in the private `whatsapp_messages` table
//   - replies are short WhatsApp-style text with full links (no cards)
//   - when a traveler wants prices/availability, the request is saved to the
//     `inquiries` table (visible in the Admin panel) and the traveler also gets
//     a link to message the local expert directly.
//
// Required Vercel environment variables:
//   ANTHROPIC_API_KEY            (already set for the website chat)
//   WHATSAPP_VERIFY_TOKEN        any secret text you choose; paste the same in Meta
//   WHATSAPP_ACCESS_TOKEN        permanent token from a Meta "system user"
//   WHATSAPP_PHONE_NUMBER_ID     the phone number ID shown in Meta WhatsApp > API Setup
//   META_APP_SECRET              Meta app > Settings > Basic > App secret
//   SUPABASE_SERVICE_ROLE_KEY    Supabase > Project Settings > API (server only!)
// Optional: WHATSAPP_GRAPH_VERSION (default v23.0), ZPT_AGENT_MODEL

import crypto from "node:crypto";
import {
  DEFAULT_MODEL,
  SITE_CONTACT_NUMBER,
  SUPABASE_URL,
  clip,
  errorCode,
  expertLink,
  runAgent,
} from "./_lib/agent-core.js";

// We need the raw bytes to verify Meta's signature.
export const config = { api: { bodyParser: false }, maxDuration: 30 };

const HISTORY_LIMIT = 14; // messages sent to the model
const RATE_LIMIT_PER_HOUR = 40; // per traveler
const MAX_USER_CHARS = 1500;
const WA_CHUNK = 3800; // WhatsApp text limit is 4096

const env = (name) => (process.env[name] || "").trim().replace(/^["']|["']$/g, "");

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------
async function readRaw(req) {
  if (Buffer.isBuffer(req.body)) return { raw: req.body, parsed: null };
  if (typeof req.body === "string") return { raw: Buffer.from(req.body), parsed: null };
  // If a body parser already ran, the stream is consumed and req.body is an object.
  if (req.body && typeof req.body === "object") return { raw: null, parsed: req.body };
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return { raw: Buffer.concat(chunks), parsed: null };
}

function sameHex(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function verifySignature(secret, header, raw, parsed) {
  if (!secret || !header || !String(header).startsWith("sha256=")) return false;
  const given = String(header).slice(7);
  const candidates = [];
  if (raw && raw.length) {
    candidates.push(raw);
  } else if (parsed) {
    // Fallback if the platform already parsed the JSON: Meta signs the payload
    // with non-ASCII characters escaped as \uXXXX.
    const s = JSON.stringify(parsed);
    candidates.push(Buffer.from(s));
    candidates.push(
      Buffer.from(s.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`))
    );
  }
  return candidates.some((c) => sameHex(crypto.createHmac("sha256", secret).update(c).digest("hex"), given));
}

// ---------------------------------------------------------------------------
// Supabase (service role: server only, bypasses RLS)
// ---------------------------------------------------------------------------
function sb(path, { method = "GET", body, prefer } = {}) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Returns true if stored, false if it was a duplicate (Meta retries webhooks).
async function saveMessage(waId, role, content, waMessageId) {
  const res = await sb(waMessageId ? "whatsapp_messages?on_conflict=wa_message_id" : "whatsapp_messages", {
    method: "POST",
    prefer: waMessageId ? "resolution=ignore-duplicates,return=representation" : "return=minimal",
    body: { wa_id: waId, role, content: content.slice(0, 8000), wa_message_id: waMessageId || null },
  });
  if (!res.ok) throw new Error(`saveMessage ${res.status}: ${(await res.text()).slice(0, 200)}`);
  if (!waMessageId) return true;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

async function loadHistory(waId) {
  const res = await sb(
    `whatsapp_messages?wa_id=eq.${encodeURIComponent(waId)}&select=role,content&order=created_at.desc&limit=${HISTORY_LIMIT}`
  );
  if (!res.ok) throw new Error(`loadHistory ${res.status}`);
  const rows = (await res.json()).reverse();
  while (rows.length && rows[0].role !== "user") rows.shift();
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

async function recentUserCount(waId) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const res = await sb(
    `whatsapp_messages?wa_id=eq.${encodeURIComponent(waId)}&role=eq.user&created_at=gte.${encodeURIComponent(since)}&select=id&limit=${RATE_LIMIT_PER_HOUR + 1}`
  );
  if (!res.ok) return 0;
  return (await res.json()).length;
}

// Saves the lead where the admin already looks: the `inquiries` table.
async function recordFollowup(waId, profileName, input) {
  const notes = [
    "Source: WhatsApp AI assistant",
    input.travelers ? `Travelers: ${clip(input.travelers, 80)}` : null,
    input.area ? `Area: ${clip(input.area, 80)}` : null,
    input.interests ? `Interests: ${clip(input.interests, 160)}` : null,
    Array.isArray(input.listing_titles) && input.listing_titles.length
      ? `Interested in: ${input.listing_titles.slice(0, 6).map((t) => clip(t, 80)).join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await sb("inquiries", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      traveler_name: profileName || "WhatsApp traveler",
      visitor_name: profileName || "WhatsApp traveler",
      traveler_phone: waId,
      visitor_phone: waId,
      message: clip(input.summary, 500),
      budget: input.budget ? clip(input.budget, 80) : null,
      travel_dates: input.dates ? clip(input.dates, 80) : null,
      notes,
      used_fallback_number: true,
      status: "new",
    },
  });
  if (!res.ok) throw new Error(`recordFollowup ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const link = expertLink(input, "Hello! I was chatting with your WhatsApp assistant.");
  return (
    "The request was saved for our local expert. Tell the traveler, in their language, that you passed their request " +
    "to our local expert, and that for the fastest reply they can also message the expert directly with this link: " +
    `${link}\nDo not promise a response time.`
  );
}

// ---------------------------------------------------------------------------
// WhatsApp Cloud API
// ---------------------------------------------------------------------------
function graphUrl(phoneId) {
  return `https://graph.facebook.com/${env("WHATSAPP_GRAPH_VERSION") || "v23.0"}/${phoneId}/messages`;
}

async function graphPost(phoneId, payload) {
  const res = await fetch(graphUrl(phoneId), {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_ACCESS_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Graph API ${res.status}: ${detail.slice(0, 300)}`);
  }
}

function chunkText(text) {
  const out = [];
  let rest = text.trim();
  while (rest.length > WA_CHUNK) {
    let cut = rest.lastIndexOf("\n", WA_CHUNK);
    if (cut < WA_CHUNK / 2) cut = rest.lastIndexOf(" ", WA_CHUNK);
    if (cut < WA_CHUNK / 2) cut = WA_CHUNK;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

async function sendText(phoneId, to, body) {
  for (const part of chunkText(body)) {
    await graphPost(phoneId, { to, type: "text", text: { body: part, preview_url: true } });
  }
}

// Marks the message as read and shows "typing..." (best effort).
async function markReadTyping(phoneId, messageId) {
  try {
    await graphPost(phoneId, { status: "read", message_id: messageId, typing_indicator: { type: "text" } });
  } catch (e) {
    console.error("typing indicator", String(e.message || e).slice(0, 150));
  }
}

// ---------------------------------------------------------------------------
// One incoming message
// ---------------------------------------------------------------------------
async function handleMessage({ msg, profileName, phoneId }) {
  const waId = String(msg.from || "");
  if (!waId) return;

  if (msg.type !== "text" || !msg.text?.body) {
    await sendText(
      phoneId,
      waId,
      "Samahani, kwa sasa naweza kusoma ujumbe wa maandishi tu. Tafadhali andika swali lako.\n\nSorry, I can only read text messages for now. Please type your question."
    );
    return;
  }

  const text = String(msg.text.body).trim().slice(0, MAX_USER_CHARS);
  if (!text) return;

  const isNew = await saveMessage(waId, "user", text, msg.id);
  if (!isNew) return; // duplicate delivery from Meta

  if ((await recentUserCount(waId)) > RATE_LIMIT_PER_HOUR) {
    const link = expertLink({ summary: "" }, "Hello! I was chatting with your WhatsApp assistant.");
    await sendText(
      phoneId,
      waId,
      `Umetuma ujumbe mwingi kwa muda mfupi. Tafadhali jaribu tena baadaye, au wasiliana na mtaalamu wetu moja kwa moja: ${link}\n\nYou've sent many messages in a short time. Please try again later, or contact our local expert directly: ${link}`
    );
    return;
  }

  await markReadTyping(phoneId, msg.id);

  const history = await loadHistory(waId);
  if (!history.length || history[history.length - 1].role !== "user") return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  let reply = "";
  try {
    const out = await runAgent({
      apiKey: env("ANTHROPIC_API_KEY"),
      model: env("ZPT_AGENT_MODEL") || DEFAULT_MODEL,
      messages: history,
      channel: "whatsapp",
      signal: controller.signal,
      onFollowup: (input) => recordFollowup(waId, profileName, input),
    });
    reply = out.reply;
    if (!reply) console.error("empty reply", out.emptyInfo);
  } catch (err) {
    console.error("agent error", errorCode(err), err?.message?.slice?.(0, 200));
  } finally {
    clearTimeout(timer);
  }

  if (!reply) {
    reply = `Samahani, nimeshindwa kujibu sasa hivi. Tafadhali jaribu tena baadaye, au wasiliana na mtaalamu wetu: https://wa.me/${SITE_CONTACT_NUMBER}\n\nSorry, I couldn't answer just now. Please try again later, or contact our local expert: https://wa.me/${SITE_CONTACT_NUMBER}`;
  } else {
    await saveMessage(waId, "assistant", reply, null).catch((e) => console.error("save reply", e.message));
  }
  await sendText(phoneId, waId, reply);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // 1) Verification handshake from Meta
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];
    const expected = env("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && expected && token && sameHex(token, expected)) {
      res.status(200).send(String(challenge ?? ""));
    } else {
      res.status(403).send("Forbidden");
    }
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).end();
    return;
  }

  const missing = [
    "ANTHROPIC_API_KEY",
    "WHATSAPP_ACCESS_TOKEN",
    "META_APP_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((n) => !env(n));
  if (missing.length) {
    console.error("whatsapp not configured, missing:", missing.join(", "));
    res.status(500).json({ error: "Not configured" });
    return;
  }

  // 2) Only accept requests really signed by Meta
  const { raw, parsed } = await readRaw(req);
  if (!verifySignature(env("META_APP_SECRET"), req.headers["x-hub-signature-256"], raw, parsed)) {
    res.status(401).json({ error: "Bad signature" });
    return;
  }

  let body = parsed;
  if (!body) {
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Bad JSON" });
      return;
    }
  }

  // 3) Handle messages (ignore delivery/read status updates)
  try {
    if (body?.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change?.value || {};
          const phoneId = env("WHATSAPP_PHONE_NUMBER_ID") || value.metadata?.phone_number_id;
          if (!phoneId) continue;
          for (const msg of value.messages || []) {
            const profileName = (value.contacts || []).find((c) => c.wa_id === msg.from)?.profile?.name || "";
            try {
              await handleMessage({ msg, profileName: clip(profileName, 60), phoneId });
            } catch (e) {
              console.error("handleMessage failed", String(e?.message || e).slice(0, 300));
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("webhook error", String(e?.message || e).slice(0, 300));
  }

  // Always 200 once the signature is valid, so Meta does not retry endlessly.
  res.status(200).json({ ok: true });
}
