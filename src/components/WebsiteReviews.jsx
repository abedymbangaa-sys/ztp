import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../lib/supabase";

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

  if (loading || reviews.length === 0) return null; // hide section until there's real content

  const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section id="traveler-reviews" className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Traveler Reviews</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What Visitors Say About Us</h2>
        </div>
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3">
          <span className="text-3xl font-extrabold text-teal-800">{avg}</span>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">{reviews.length} reviews</p>
          </div>
        </div>
      </div>

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
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
