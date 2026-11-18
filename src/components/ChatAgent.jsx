import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Floating "Ask the Zanzibar Expert" AI chat. Talks to /api/agent
// (api/agent.js). When the traveler is ready for prices/availability the
// agent returns a `handoff` link, shown as a WhatsApp button that opens a
// pre-filled message to the Zanzibar Expert line.

const STORAGE_KEY = "zpt_agent_chat_v1";

const GREETING = {
  role: "assistant",
  content:
    "Habari! 👋 Hello! I'm the Zanzibar Expert assistant. Ask me anything about Zanzibar - Uliza chochote kuhusu Zanzibar.",
};

const QUICK_STARTS = [
  "Help me plan my trip",
  "Hoteli nzuri Nungwi",
  "Best beaches in Zanzibar",
  "Tours za bei nafuu",
];

// Hidden on admin / partner screens.
const HIDDEN_PREFIXES = ["/admin", "/partner"];

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* storage may be blocked - ignore */
  }
  return [GREETING];
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
        const bullet = /^\s*[-•]\s+/.test(line);
        const content = bullet ? line.replace(/^\s*[-•]\s+/, "") : line;
        return bullet ? (
          <div key={idx} className="flex gap-2">
            <span aria-hidden="true">•</span>
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
  const [messages, setMessages] = useState(loadSaved);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

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
      // Send only real conversation turns (skip the local greeting).
      const payload = next
        .filter((m) => m !== GREETING && m.content !== GREETING.content)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, handoff: data.handoff || null },
      ]);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([GREETING]);
    setError("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const showQuick = messages.length <= 1 && !loading;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Zanzibar Expert chat"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <span aria-hidden="true">💬</span>
          <span>Ask Expert</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Zanzibar Expert assistant"
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[600px] sm:max-h-[calc(100vh-2rem)] sm:w-[380px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-teal-700 px-4 py-3 text-white sm:rounded-t-2xl">
            <div>
              <div className="text-sm font-bold">Zanzibar Expert</div>
              <div className="text-xs text-teal-100">AI assistant · Kiswahili / English</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="rounded-md px-2 py-1 text-xs text-teal-100 hover:bg-teal-600"
              >
                New chat
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md px-2 py-1 text-lg leading-none hover:bg-teal-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%]">
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-teal-700 px-3 py-2 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-800 shadow-sm border border-slate-200"
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
                      <span aria-hidden="true">💬</span>
                      Continue on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}

            {showQuick && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_STARTS.map((q) => (
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

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <span className="inline-flex gap-1" aria-label="Typing">
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
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                placeholder="Andika hapa... / Type here..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              AI assistant - always confirm prices and availability with the business on WhatsApp.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
