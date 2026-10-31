import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Star } from "lucide-react";
import { supabase } from "../lib/supabase";

// Small, non-blocking "rate our website" card. It slides in 10 seconds after
// a visitor lands on a public page, asks one thing (tap a star), and only then
// shows an optional name/comment box. Reviews are saved as "pending" and
// appear on the site after the admin approves them.

const SHOW_AFTER_MS = 10000;
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // after closing, wait 3 days
const DONE_KEY = "zpt_site_review_done"; // already reviewed -> never ask again
const DISMISSED_KEY = "zpt_site_review_dismissed_at";
const SESSION_KEY = "zpt_site_review_shown"; // once per visit

const HIDDEN_ON = ["/admin", "/partner", "/review", "/privacy", "/terms"];

function safeGet(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(store, key, value) {
  try {
    store.setItem(key, value);
  } catch {
    // storage unavailable (private mode) - the prompt just may show again later
  }
}

function alreadyHandled() {
  if (safeGet(localStorage, DONE_KEY)) return true;
  if (safeGet(sessionStorage, SESSION_KEY)) return true;
  const dismissedAt = Number(safeGet(localStorage, DISMISSED_KEY) || 0);
  return dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export default function SiteReviewPrompt() {
  const { pathname } = useLocation();
  const blocked = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: real people leave it empty
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Start the 10s countdown once; if the visitor wanders to an excluded page
  // (e.g. admin) the card simply doesn't show there.
  useEffect(() => {
    if (alreadyHandled()) return;
    const timer = setTimeout(() => {
      if (alreadyHandled()) return;
      safeSet(sessionStorage, SESSION_KEY, "1");
      setVisible(true);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    if (!submitted) safeSet(localStorage, DISMISSED_KEY, String(Date.now()));
  }

  async function submit() {
    if (!rating || submitting) return;
    if (website) {
      // bot filled the hidden field: pretend success, save nothing
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("site_reviews").insert({
      name: name.trim() || "Anonymous",
      rating,
      comment: comment.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (err) {
      setError("Sorry, we couldn't send that. Please try again.");
      return;
    }
    safeSet(localStorage, DONE_KEY, "1");
    setSubmitted(true);
    setTimeout(() => setVisible(false), 3500);
  }

  if (!visible || blocked) return null;

  const shown = hover || rating;

  return (
    <div
      className="fixed z-40 bottom-20 sm:bottom-5 right-3 sm:right-5 w-[300px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4"
      role="dialog"
      aria-label="Rate our website"
    >
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {submitted ? (
        <p className="text-sm font-semibold text-teal-700 py-3 text-center pr-3">
          Thank you! Your review will appear once it has been approved.
        </p>
      ) : (
        <>
          <p className="font-bold text-slate-900 text-sm mb-0.5 pr-6">How are we doing so far?</p>
          <p className="text-xs text-slate-500 mb-2.5">Tap a star to rate Zanzibar Paradise Tours.</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-0.5"
              >
                <Star
                  className={`w-7 h-7 transition ${n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2"
              />
              <textarea
                placeholder="Say a few words (optional)"
                value={comment}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 resize-none"
              />
              {/* honeypot - hidden from people */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="absolute left-[-9999px] w-px h-px opacity-0"
              />
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full bg-teal-700 text-white text-sm font-bold py-2 rounded-full hover:bg-teal-800 transition disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send review"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
