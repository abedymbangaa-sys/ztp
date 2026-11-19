import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Compass, MessageCircle, RotateCcw, SendHorizontal, X } from "lucide-react";

// Floating "Ask Expert" chat. Talks to /api/agent (api/agent.js).
// Starts in English; the visitor can switch to Kiswahili with the EN | SW
// toggle (or just by asking). When the traveler is ready for prices or
// availability, the agent returns a `handoff` link shown as a WhatsApp
// button with a pre-filled message to the Zanzibar Expert line.

const STORAGE_KEY = "zpt_agent_chat_v2";
const LANG_KEY = "zpt_agent_lang";

const TEXT = {
  en: {
    open: "Ask Expert",
    openLabel: "Open Zanzibar Expert chat",
    title: "Zanzibar Expert",
    subtitle: "Travel assistant",
    greeting:
      "Hello, and welcome to Zanzibar. Ask me about hotels, tours, beaches or planning your trip.",
    quick: [
      "Help me plan my trip",
      "Good hotels in Nungwi",
      "Best beaches in Zanzibar",
      "Budget-friendly tours",
    ],
    placeholder: "Type your question...",
    send: "Send",
    newChat: "New chat",
    close: "Close chat",
    whatsapp: "Continue on WhatsApp",
    note: "AI assistant. Always confirm prices and availability with the business on WhatsApp.",
    genericError: "Something went wrong. Please try again.",
  },
  sw: {
    open: "Uliza Mtaalamu",
    openLabel: "Fungua mazungumzo na Zanzibar Expert",
    title: "Zanzibar Expert",
    subtitle: "Msaidizi wa safari",
    greeting:
      "Karibu Zanzibar. Niulize kuhusu hoteli, tours, fukwe au mpango wa safari yako.",
    quick: [
      "Nisaidie kupanga safari",
      "Hoteli nzuri Nungwi",
      "Fukwe bora Zanzibar",
      "Tours za bei nafuu",
    ],
    placeholder: "Andika swali lako...",
    send: "Tuma",
    newChat: "Mazungumzo mapya",
    close: "Funga",
    whatsapp: "Endelea kwenye WhatsApp",
    note: "Msaidizi wa AI. Thibitisha bei na upatikanaji na biashara husika kupitia WhatsApp.",
    genericError: "Kuna tatizo. Tafadhali jaribu tena.",
  },
};

// Hidden on admin / partner screens.
const HIDDEN_PREFIXES = ["/admin", "/partner"];

function loadMessages() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* storage may be blocked - ignore */
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
function renderInline(text, navigate, keyPrefix) {
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
                    navigate(href);
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

function MessageText({ text, navigate }) {
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
            <span>{renderInline(content, navigate, `l${idx}`)}</span>
          </div>
        ) : (
          <p key={idx}>{renderInline(content, navigate, `l${idx}`)}</p>
        );
      })}
    </div>
  );
}

export default function ChatAgent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(loadLang);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const t = TEXT[lang];

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

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  async function send(textRaw) {
    const text = String(textRaw || "").trim().slice(0, 1000);
    if (!text || loading) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`${data.error || t.genericError}${data.code ? ` (${data.code})` : ""}`);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, handoff: data.handoff || null },
      ]);
    } catch (e) {
      setError(e.message || t.genericError);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setError("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const showQuick = messages.length === 0 && !loading;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.openLabel}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span>{t.open}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[600px] sm:max-h-[calc(100vh-2rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl"
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

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
                <p>{t.greeting}</p>
              </div>
            </div>

            {showQuick && (
              <div className="flex flex-wrap gap-2 pt-1">
                {t.quick.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%]">
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-teal-700 px-3 py-2 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                    }
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <MessageText text={m.content} navigate={navigate} />
                    )}
                  </div>
                  {m.handoff?.url && (
                    <a
                      href={m.handoff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {t.whatsapp}
                    </a>
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
            <p className="mt-2 text-[11px] leading-snug text-slate-500">{t.note}</p>
          </form>
        </div>
      )}
    </>
  );
}
