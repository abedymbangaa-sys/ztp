import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import StarRating from "./StarRating";

// A small rotating set of pleasant colors so avatars don't all look the same
const AVATAR_COLORS = [
  "bg-teal-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-emerald-600",
];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

export default function WebsiteReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("site_reviews")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(9);
      setReviews(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;

  const avg = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  // Same distribution-bar summary as the per-listing reviews (ReviewsSection.jsx),
  // so the site-wide reviews match that pattern instead of the older
  // average-only card.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));
  const STAR_LABELS = { 5: "Excellent", 4: "Good", 3: "Average", 2: "Poor", 1: "Terrible" };
  const STAR_BAR_COLOR = {
    5: "bg-teal-600",
    4: "bg-teal-400",
    3: "bg-amber-400",
    2: "bg-orange-400",
    1: "bg-red-400",
  };
  function ratingWord(avgValue) {
    if (avgValue >= 4.5) return "Excellent";
    if (avgValue >= 4) return "Very Good";
    if (avgValue >= 3) return "Average";
    if (avgValue >= 2) return "Poor";
    return "Terrible";
  }

  async function submitSiteReview() {
    setSubmitting(true);
    const { error } = await supabase.from("site_reviews").insert({
      name: form.name.trim() || "Anonymous",
      rating: form.rating,
      comment: form.comment.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      setForm({ name: "", rating: 5, comment: "" });
    }
  }

  return (
    <section id="traveler-reviews" className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Traveler Reviews</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What Visitors Say About Us</h2>
        </div>
        {!formOpen && (
          <button
            onClick={() => {
              setFormOpen(true);
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-5 py-2.5 rounded-full transition shrink-0"
          >
            <Star className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      {formOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 max-w-md">
          {submitted ? (
            <p className="text-sm font-semibold text-teal-700 py-2">
              Thanks for your feedback! Your review will appear here once it's checked.
            </p>
          ) : (
            <>
              <p className="font-bold text-slate-900 mb-3">Rate your experience with our site</p>
              <div className="mb-3">
                <StarRating
                  rating={form.rating}
                  interactive
                  size="w-7 h-7"
                  onChange={(n) => setForm({ ...form, rating: n })}
                />
              </div>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 mb-2"
              />
              <textarea
                placeholder="What did you think? (optional)"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 mb-3 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitSiteReview}
                  disabled={submitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 py-2 rounded-full transition disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Submit Review"}
                </button>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-slate-500 text-sm font-semibold px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {avg && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 max-w-md">
          <div className="flex items-baseline gap-4 mb-5">
            <span className="text-4xl font-extrabold text-teal-700 leading-none">{avg}</span>
            <div>
              <p className="font-semibold text-slate-900">{ratingWord(parseFloat(avg))}</p>
              <p className="text-xs text-slate-500">
                from {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {distribution.map(({ star, count }) => (
              <div key={star} className="grid grid-cols-[90px_1fr_28px] items-center gap-3">
                <span className="text-xs text-slate-600">{STAR_LABELS[star]}</span>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STAR_BAR_COLOR[star]}`}
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!avg && !formOpen && (
        <p className="text-slate-500 text-sm mb-8">Be the first to share what you think of the site.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(
                  r.name
                )}`}
              >
                {initials(r.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                <StarRating rating={r.rating} size="w-3.5 h-3.5" />
              </div>
            </div>
            {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
