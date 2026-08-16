import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    <section className="max-w-6xl mx-auto px-4 py-16">
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
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </div>
            {r.comment && <p className="text-sm text-slate-600 mb-3">{r.comment}</p>}
            <p className="text-xs font-semibold text-slate-800">— {r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
