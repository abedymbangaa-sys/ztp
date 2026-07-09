import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import StarRating from "./StarRating";

export default function ReviewsSection({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.reviewer_name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      listing_id: listingId,
      reviewer_name: form.reviewer_name,
      rating: form.rating,
      comment: form.comment,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      setForm({ reviewer_name: "", rating: 5, comment: "" });
    }
  }

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Guest Reviews</h2>
        {avgRating && (
          <span className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">
            <StarRating rating={Math.round(avgRating)} size="w-3.5 h-3.5" />
            {avgRating} ({reviews.length})
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 text-sm mb-8">No reviews yet - be the first to leave one!</p>
      ) : (
        <div className="space-y-4 mb-10">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-900">{r.reviewer_name}</p>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="text-slate-600 text-sm mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Leave Your Review</h3>
        {submitted ? (
          <p className="text-teal-700 font-medium">
            Thank you! Your review has been submitted - it will appear once approved.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              placeholder="Your name"
              value={form.reviewer_name}
              onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rating</label>
              <StarRating
                rating={form.rating}
                interactive
                size="w-6 h-6"
                onChange={(n) => setForm({ ...form, rating: n })}
              />
            </div>
            <textarea
              rows={3}
              placeholder="Your comment (optional)"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
