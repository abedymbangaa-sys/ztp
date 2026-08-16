import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import { supabase } from "../lib/supabase";

const SESSION_KEY = "zpt_site_review_prompted";
const SHOW_AFTER_MS = 45000; // 45 seconds of browsing

export default function SiteReviewPrompt() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false); // opens the small form after they tap a star
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Don't show again this session if already prompted, dismissed, or submitted
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function pickStar(value) {
    setRating(value);
    setExpanded(true);
  }

  async function submitReview() {
    if (!rating) return;
    setSubmitting(true);
    const { error } = await supabase.from("site_reviews").insert({
      name: name.trim() || "Anonymous",
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      sessionStorage.setItem(SESSION_KEY, "1");
      setTimeout(() => setVisible(false), 2500);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in slide-in-from-bottom-4"
      role="dialog"
      aria-label="Website review prompt"
    >
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {submitted ? (
        <p className="text-sm font-semibold text-teal-700 py-3 text-center">
          Asante kwa maoni yako! 🙏
        </p>
      ) : !expanded ? (
        <>
          <p className="font-bold text-slate-900 text-sm mb-1">Enjoying Zanzibar Paradise Tours?</p>
          <p className="text-xs text-slate-500 mb-3">Tap a star to leave a quick review of our site.</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => pickStar(n)} aria-label={`${n} star`}>
                <Star className="w-6 h-6 text-amber-400 hover:fill-amber-400 transition" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="font-bold text-slate-900 text-sm mb-2">Thanks! Add a quick note?</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                onClick={() => setRating(n)}
                className={`w-5 h-5 cursor-pointer ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
              />
            ))}
          </div>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2"
          />
          <textarea
            placeholder="Your comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3 resize-none"
          />
          <button
            onClick={submitReview}
            disabled={submitting}
            className="w-full bg-teal-700 text-white text-sm font-bold py-2 rounded-full hover:bg-teal-800 transition disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Submit Review"}
          </button>
        </>
      )}
    </div>
  );
}
