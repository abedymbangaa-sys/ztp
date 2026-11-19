// Zanzibar Expert Assistant - website endpoint.
//
// POST /api/agent
// body: { messages: [{ role: "user" | "assistant", content: "..." }, ...], lang: "en" | "sw" }
// returns: { reply, handoff: null | { url, summary }, cards: [...] }
//
// The "brain" lives in api/_lib/agent-core.js (shared with the WhatsApp
// webhook). This file only does the web-specific parts: request validation,
// abuse protection and error codes.
//
// Required Vercel environment variable:  ANTHROPIC_API_KEY
// Optional:                              ZPT_AGENT_MODEL (default in agent-core.js)

import { DEFAULT_MODEL, errorCode, runAgent } from "./_lib/agent-core.js";

const MAX_MESSAGES = 16; // keep only the latest turns
const MAX_CHARS = 1000; // per message
const RATE_LIMIT = 25; // requests per IP...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes (best effort)

// ---------------------------------------------------------------------------
// Basic abuse protection (best effort - memory is per serverless instance)
// ---------------------------------------------------------------------------
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Trim stray spaces/newlines/quotes that often sneak in when pasting a key.
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    res.status(500).json({ error: "Assistant is not configured yet." });
    return;
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "Too many messages. Please try again in a few minutes." });
    return;
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const messages = cleanMessages(body?.messages);
  if (!messages) {
    res.status(400).json({ error: "Invalid messages." });
    return;
  }
  const lang = body?.lang === "sw" ? "sw" : "en";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const { reply, handoff, cards, emptyInfo } = await runAgent({
      apiKey,
      model: process.env.ZPT_AGENT_MODEL || DEFAULT_MODEL,
      messages,
      lang,
      channel: "web",
      signal: controller.signal,
    });

    let text = reply;
    if (!text) {
      console.error("empty reply", emptyInfo);
      text =
        lang === "sw"
          ? "Samahani, nimeshindwa kujibu sasa hivi. Tafadhali jaribu tena."
          : "Sorry, I couldn't answer just now. Please try again.";
    }
    res.status(200).json({ reply: text, handoff, cards });
  } catch (err) {
    console.error("agent error", err);
    res.status(502).json({
      error: "The assistant is unavailable right now. Please try again.",
      code: errorCode(err),
    });
  } finally {
    clearTimeout(timer);
  }
}
