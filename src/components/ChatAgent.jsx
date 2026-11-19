import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Compass,
  Headset,
  MapPin,
  MessageCircle,
  RotateCcw,
  SendHorizontal,
  Star,
  X,
} from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";
import { useSavedList } from "../lib/SavedListContext";
import { SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";

// "Zanzibar AI" - floating planner chat. Talks to /api/agent (api/agent.js).
//  - Starts in English; EN | SW toggle in the header (or just ask in Swahili).
//  - Recommendations come back as cards built from our own listings data.
//  - When the traveler is ready for prices/availability, the agent returns a
//    `handoff` link, shown as a WhatsApp button with a pre-filled message.
//  - Any page can open it: window.dispatchEvent(new CustomEvent("zpt:open-agent",
//    { detail: { prompt: "optional first message", source: "hero_chip" } }))
//  - Usage events go to the assistant_events table (see logEvent below).

const STORAGE_KEY = "zpt_agent_chat_v2";
const LANG_KEY = "zpt_agent_lang";
const TIP_KEY = "zpt_agent_tip_seen";
const SID_KEY = "zpt_agent_sid";

const SUPABASE_URL = "https://phctpwswosfwjmxhidyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HEy4rqVBXuH_qRBHEwYSdg_wW-677OT";

const TEXT = {
  en: {
    open: "Plan with Zanzibar AI",
    openShort: "Plan with AI",
    openLabel: "Open Zanzibar AI trip planner",
    tip: "Need help choosing? I can build your Zanzibar plan.",
    tipClose: "Dismiss",
    title: "Zanzibar AI",
    subtitle: "Your local trip planner",
    greeting: "Tell me your days, budget and travel style. I'll narrow Zanzibar down for you.",
    quick: [
      "I have 3 days",
      "Where should I stay?",
      "Best beach for swimming",
      "Find a tour under my budget",
      "Build a family itinerary",
    ],
    placeholder: "Type your question...",
    send: "Send",
    newChat: "New chat",
    close: "Close chat",
    whatsapp: "Continue on WhatsApp",
    human: "Want a real local to check this? Chat with our expert",
    humanMsg: "Hello! I'd like to talk to a local Zanzibar expert about my trip.",
    note: "AI suggestions are a starting point. Confirm current prices, tides, opening hours and availability with the provider. Please don't share passport or card details here.",
    noteShort: "AI assistant. Confirm prices and availability with the provider.",
    genericError: "Something went wrong. Please try again.",
    viewDetails: "View details",
    askWhatsapp: "Ask on WhatsApp",
    save: "Save",
    saved: "Saved",
    askPrice: "Ask for current price",
    verified: "Verified",
    helpful: "Was this useful?",
    yes: "Yes",
    notQuite: "Not quite",
    thanks: "Thanks for the feedback",
    categories: {
      hotels: "Hotel",
      lodges: "Lodge",
      tours: "Tour",
      beaches: "Beach",
      attractions: "Attraction",
      caves: "Cave",
      nature: "Nature",
      heritage: "Heritage",
      restaurants: "Restaurant",
      experiences: "Experience",
      sports: "Activity",
    },
    areas: {
      "stone-town": "Stone Town",
      north: "North Coast",
      east: "East Coast",
      south: "South Coast",
      central: "Central Zanzibar",
      pemba: "Pemba Island",
    },
  },
  sw: {
    open: "Panga na Zanzibar AI",
    openShort: "Panga na AI",
    openLabel: "Fungua mpangaji wa safari wa Zanzibar AI",
    tip: "Unahitaji msaada wa kuchagua? Naweza kukuandalia mpango wako wa Zanzibar.",
    tipClose: "Funga",
    title: "Zanzibar AI",
    subtitle: "Mpangaji wako wa safari",
    greeting:
      "Niambie siku ulizonazo, bajeti na mtindo wa safari. Nitakusaidia kuchagua sehemu zinazokufaa Zanzibar.",
    quick: [
      "Nina siku 3",
      "Nikae wapi?",
      "Ufukwe bora wa kuogelea",
      "Tafuta tour kulingana na bajeti",
      "Panga safari ya familia",
    ],
    placeholder: "Andika swali lako...",
    send: "Tuma",
    newChat: "Mazungumzo mapya",
    close: "Funga",
    whatsapp: "Endelea kwenye WhatsApp",
    human: "Unataka mtu halisi akague? Ongea na mtaalamu wetu",
    humanMsg: "Habari! Ningependa kuzungumza na mtaalamu wa Zanzibar kuhusu safari yangu.",
    note: "Mapendekezo ya AI ni mwanzo tu. Thibitisha bei, mawimbi, saa za kufungua na upatikanaji na mtoa huduma. Tafadhali usitume taarifa za pasipoti au kadi hapa.",
    noteShort: "Msaidizi wa AI. Thibitisha bei na upatikanaji na mtoa huduma.",
    genericError: "Kuna tatizo. Tafadhali jaribu tena.",
    viewDetails: "Angalia",
    askWhatsapp: "Uliza WhatsApp",
    save: "Hifadhi",
    saved: "Imehifadhiwa",
    askPrice: "Uliza bei ya sasa",
    verified: "Imethibitishwa",
    helpful: "Je, ilikusaidia?",
    yes: "Ndiyo",
    notQuite: "Si sana",
    thanks: "Asante kwa maoni",
    categories: {
      hotels: "Hoteli",
      lodges: "Lodge",
      tours: "Ziara",
      beaches: "Ufukwe",
      attractions: "Kivutio",
      caves: "Pango",
      nature: "Asili",
      heritage: "Urithi",
      restaurants: "Mgahawa",
      experiences: "Uzoefu",
      sports: "Michezo",
    },
    areas: {
      "stone-town": "Stone Town",
      north: "Pwani ya Kaskazini",
      east: "Pwani ya Mashariki",
      south: "Pwani ya Kusini",
      central: "Zanzibar ya Kati",
      pemba: "Kisiwa cha Pemba",
    },
  },
};

// Hidden on admin / partner screens.
const HIDDEN_PREFIXES = ["/admin", "/partner"];

// ---------------------------------------------------------------------------
// Storage helpers (all wrapped: storage can be blocked)
// ---------------------------------------------------------------------------
function loadMessages() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return [];
}

function loadLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "sw" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

function getSessionId() {
  try {
    let s = sessionStorage.getItem(SID_KEY);
    if (!s) {
      s =
        (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
        `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Usage events -> assistant_events table (separate from lead_events so the
// Admin "leads" numbers are not polluted). Never stores what the traveler
// typed, except the single last question when they press "Not quite", so
// weak answers can be improved. Fire-and-forget, never throws.
// ---------------------------------------------------------------------------
function logEvent(type, { detail = null, listingId = null, lang = "en" } = {}) {
  try {
    trackEvent(`assistant_${type}`, { detail: detail ? String(detail).slice(0, 100) : undefined });
    fetch(`${SUPABASE_URL}/rest/v1/assistant_events`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        session_id: getSessionId(),
        event_type: type,
        detail: detail ? String(detail).slice(0, 300) : null,
        listing_id: listingId,
        page: typeof window !== "undefined" ? window.location.pathname.slice(0, 200) : null,
        lang,
      }),
    }).catch(() => {});
  } catch {
    /* tracking must never break the chat */
  }
}

// ---------------------------------------------------------------------------
// Message rendering
// ---------------------------------------------------------------------------
// Only allow safe link targets: internal paths, our own domain, WhatsApp.
function isSafeHref(href) {
  return (
    /^\/(?!\/)/.test(href) ||
    /^https:\/\/(www\.)?visitzanzibarparadise\.com(\/|$)/.test(href) ||
    href.startsWith("https://wa.me/")
  );
}

// Tiny renderer: **bold**, [text](link) and "- " bullet lines. Nothing else,
// and never raw HTML, so model output can't inject markup.
function renderInline(text, go, keyPrefix) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      if (isSafeHref(href)) {
        const internal = href.startsWith("/");
        out.push(
          <a
            key={`${keyPrefix}-${i++}`}
            href={href}
            className="font-semibold text-teal-700 underline underline-offset-2"
            {...(internal
              ? {
                  onClick: (e) => {
                    e.preventDefault();
                    go(href);
                  },
                }
              : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {m[1]}
          </a>
        );
      } else {
        out.push(m[1]);
      }
    } else {
      out.push(<strong key={`${keyPrefix}-${i++}`}>{m[3]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function MessageText({ text, go }) {
  const lines = String(text).split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        if (!line.trim()) return null;
        const bullet = /^\s*[-•*]\s+/.test(line);
        const content = bullet ? line.replace(/^\s*[-•*]\s+/, "") : line;
        return bullet ? (
          <div key={idx} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-600"
            />
            <span>{renderInline(content, go, `l${idx}`)}</span>
          </div>
        ) : (
          <p key={idx}>{renderInline(content, go, `l${idx}`)}</p>
        );
      })}
    </div>
  );
}

function formatVerified(iso, lang) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", { month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

// One recommendation card, built from our own listing data on the server.
function PlaceCard({ card, t, lang, onView, onWhatsApp }) {
  const { isSaved, toggleSaved } = useSavedList();
  const saved = isSaved(card.id);
  const category = t.categories[card.category] || "";
  const area = card.area ? t.areas[card.area] || "" : "";
  const meta = [category, area].filter(Boolean).join(" · ");
  const verified = card.verifiedAt ? formatVerified(card.verifiedAt, lang) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <ImageWithFallback
          src={card.image}
          alt={card.title}
          loading="lazy"
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{card.title}</div>
          {meta && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{meta}</span>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className={card.price ? "font-semibold text-teal-800" : "text-slate-500"}>
              {card.price || t.askPrice}
            </span>
            {card.stars ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                {card.stars}
              </span>
            ) : null}
          </div>
          {verified && (
            <div className="mt-0.5 text-[11px] text-slate-400">
              {t.verified} {verified}
            </div>
          )}
        </div>
      </div>
      {card.why && <p className="px-3 pb-2 text-xs leading-snug text-slate-600">{card.why}</p>}
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
        <button
          type="button"
          onClick={() => onView(card)}
          className="flex-1 rounded-lg bg-teal-700 px-2 py-2 text-xs font-semibold text-white hover:bg-teal-800"
        >
          {t.viewDetails}
        </button>
        <a
          href={card.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onWhatsApp(card)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-green-600 px-2 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{t.askWhatsapp}</span>
        </a>
        <button
          type="button"
          onClick={() => {
            toggleSaved(card.id);
            if (!saved) logEvent("card_save", { listingId: card.id, detail: card.title, lang });
          }}
          aria-pressed={saved}
          aria-label={saved ? t.saved : t.save}
          title={saved ? t.saved : t.save}
          className={
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border " +
            (saved
              ? "border-teal-700 bg-teal-50 text-teal-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100")
          }
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ChatAgent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(loadLang);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const sendRef = useRef(null);
  const t = TEXT[lang];
  const humanHref = `https://wa.me/${SITE_CONTACT_NUMBER}?text=${encodeURIComponent(t.humanMsg)}`;

  function openChat(source) {
    setShowTip(false);
    setOpen((was) => {
      if (!was) logEvent("open", { detail: source || "launcher", lang });
      return true;
    });
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // One-time tooltip, a few seconds after the page loads (never again once
  // dismissed, opened or shown once).
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(TIP_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return undefined;
    const show = setTimeout(() => {
      setShowTip(true);
      try {
        localStorage.setItem(TIP_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 6000);
    const hide = setTimeout(() => setShowTip(false), 15000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // Other parts of the site can open the chat (optionally with a first message).
  useEffect(() => {
    function onOpen(e) {
      const detail = e.detail || {};
      openChat(detail.source || "site");
      if (detail.prompt) setPendingPrompt(String(detail.prompt));
    }
    window.addEventListener("zpt:open-agent", onOpen);
    return () => window.removeEventListener("zpt:open-agent", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open && pendingPrompt && !loading) {
      const p = pendingPrompt;
      setPendingPrompt(null);
      sendRef.current?.(p);
    }
  }, [open, pendingPrompt, loading]);

  // Mobile keyboard handling: keep the panel exactly as tall as the area the
  // visitor can actually see, so the header never scrolls off-screen when the
  // keyboard opens (a common problem in in-app browsers such as LinkedIn or
  // Instagram), and stop the page behind the chat from scrolling.
  // 100dvh alone is not enough: it ignores the on-screen keyboard.
  useEffect(() => {
    if (!open) return undefined;
    const el = panelRef.current;
    const vv = window.visualViewport;
    const isMobile = () => window.innerWidth < 640;
    const baseHeight = window.innerHeight;
    const prevOverflow = document.body.style.overflow;
    if (isMobile()) document.body.style.overflow = "hidden";

    function sync() {
      if (!el) return;
      if (vv && isMobile()) {
        el.style.top = `${vv.offsetTop}px`;
        el.style.height = `${vv.height}px`;
        el.style.bottom = "auto";
        setKeyboardOpen(vv.height < baseHeight * 0.75);
      } else {
        el.style.top = "";
        el.style.height = "";
        el.style.bottom = "";
        setKeyboardOpen(false);
      }
      endRef.current?.scrollIntoView({ block: "end" });
    }

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  // Go to a page from inside the chat. On phones the chat covers the whole
  // screen, so close it (the conversation is kept for when it is reopened).
  function go(path) {
    if (window.innerWidth < 640) setOpen(false);
    navigate(path);
  }

  async function send(textRaw, source) {
    const text = String(textRaw || "").trim().slice(0, 1000);
    if (!text || loading) return;
    if (source === "chip") logEvent("chip", { detail: text, lang });
    logEvent("message", { lang });
    setError("");
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      // Tell the model which cards were already shown (it cannot see them).
      const payload = next.map((m) => ({
        role: m.role,
        content:
          m.role === "assistant" && m.cards?.length
            ? `${m.content}\n\n[Cards shown: ${m.cards.map((c) => c.title).join("; ")}]`
            : m.content,
      }));
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, messages: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`${data.error || t.genericError}${data.code ? ` (${data.code})` : ""}`);
      }
      if (Array.isArray(data.cards) && data.cards.length) {
        logEvent("cards_shown", { detail: String(data.cards.length), lang });
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          handoff: data.handoff || null,
          cards: Array.isArray(data.cards) ? data.cards : [],
        },
      ]);
    } catch (e) {
      setError(e.message || t.genericError);
    } finally {
      setLoading(false);
    }
  }
  sendRef.current = send;

  function reset() {
    setMessages([]);
    setError("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function giveFeedback(index, value) {
    // "Not quite" also keeps the traveler's last question (max 200 chars),
    // so weak answers can be found and improved. "Yes" stores nothing else.
    let detail = null;
    if (value === "no") {
      for (let i = index - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          detail = messages[i].content.slice(0, 200);
          break;
        }
      }
    }
    logEvent(value === "yes" ? "feedback_yes" : "feedback_no", { detail, lang });
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, feedback: value } : m)));
  }

  function viewCard(card) {
    logEvent("card_view", { listingId: card.id, detail: card.title, lang });
    go(card.path);
  }

  function cardWhatsApp(card) {
    // Counts as a real lead for that listing (shows in the Admin Leads tab
    // and in the partner's own dashboard), same as the listing page button.
    trackEvent("click_send_enquiry", {
      listing_id: card.id,
      listing_name: card.title,
      listing_category: card.category,
    });
    logEvent("card_whatsapp", { listingId: card.id, detail: card.title, lang });
  }

  const showQuick = messages.length === 0 && !loading;
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  return (
    <>
      {!open && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
          {showTip && (
            <div
              role="status"
              className="relative max-w-[240px] rounded-2xl rounded-br-sm border border-slate-200 bg-white px-3 py-2.5 pr-8 text-xs leading-snug text-slate-700 shadow-lg"
            >
              {t.tip}
              <button
                type="button"
                onClick={() => setShowTip(false)}
                aria-label={t.tipClose}
                className="absolute right-1.5 top-1.5 rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => openChat("launcher")}
            aria-label={t.openLabel}
            className="flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            <Compass className="h-5 w-5" aria-hidden="true" />
            <span className="sm:hidden">{t.openShort}</span>
            <span className="hidden sm:inline">{t.open}</span>
          </button>
        </div>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t.title}
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[620px] sm:max-h-[calc(100vh-2rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-teal-700 px-4 py-3 text-white sm:rounded-t-2xl">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-tight">{t.title}</div>
              <div className="truncate text-xs text-teal-100">{t.subtitle}</div>
            </div>

            <div
              className="flex overflow-hidden rounded-md border border-white/30 text-xs font-semibold"
              role="group"
              aria-label="Language"
            >
              {["en", "sw"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={
                    lang === code
                      ? "bg-white px-2 py-1 text-teal-800"
                      : "px-2 py-1 text-teal-50 hover:bg-white/10"
                  }
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={reset}
              aria-label={t.newChat}
              title={t.newChat}
              className="rounded-md p-1.5 text-teal-50 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="rounded-md p-1.5 text-teal-50 hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Talk to a person - hidden while the keyboard is open to save space */}
          {!keyboardOpen && (
            <a
              href={humanHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logEvent("human_click", { lang })}
              className="flex items-center justify-center gap-2 border-b border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100"
            >
              <Headset className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{t.human}</span>
            </a>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
                <p>{t.greeting}</p>
              </div>
            </div>

            {showQuick && (
              <div className="flex flex-wrap gap-2 pt-1">
                {t.quick.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q, "chip")}
                    className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user" ? "max-w-[85%]" : "w-full max-w-[94%]"}>
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-teal-700 px-3 py-2 text-sm text-white"
                        : "inline-block max-w-full rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                    }
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <MessageText text={m.content} go={go} />
                    )}
                  </div>

                  {m.cards?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.cards.map((c) => (
                        <PlaceCard
                          key={c.id}
                          card={c}
                          t={t}
                          lang={lang}
                          onView={viewCard}
                          onWhatsApp={cardWhatsApp}
                        />
                      ))}
                    </div>
                  )}

                  {m.handoff?.url && (
                    <a
                      href={m.handoff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logEvent("handoff_click", { lang })}
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {t.whatsapp}
                    </a>
                  )}

                  {m.role === "assistant" && idx === lastAssistantIndex && !loading && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {m.feedback ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                          {t.thanks}
                        </span>
                      ) : (
                        <>
                          <span>{t.helpful}</span>
                          <button
                            type="button"
                            onClick={() => giveFeedback(idx, "yes")}
                            className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {t.yes}
                          </button>
                          <button
                            type="button"
                            onClick={() => giveFeedback(idx, "no")}
                            className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {t.notQuite}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-3 shadow-sm">
                  <span className="inline-flex gap-1" role="status" aria-label="Typing">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-slate-200 bg-white p-3 sm:rounded-b-2xl"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                placeholder={t.placeholder}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label={t.send}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
              >
                <SendHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              {keyboardOpen ? t.noteShort : t.note}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
