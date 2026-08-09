import { Link } from "react-router-dom";
import { useDeals } from "../data/hooks";
import { Tag } from "lucide-react";

// "Special Deals" strip for the homepage. Shows nothing at all if no
// listing is currently marked is_deal = true, so it never displays an
// empty/broken-looking section.
export default function DealsSection() {
  const { deals, loading } = useDeals(6);

  if (loading || deals.length === 0) return null;

  return (
    <section className="bg-amber-50 border-y border-amber-100">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
          <p className="text-amber-700 font-semibold text-sm uppercase tracking-wide">Limited Time</p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Special Deals</h2>

        <div className="flex gap-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((item) => (
            <Link
              key={item.id}
              to={`/ad/${item.id}`}
              className="relative flex-shrink-0 w-72 sm:w-auto bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-44">
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {item.deal_label && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {item.deal_label}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">{item.location}</p>
                <h3 className="font-bold text-slate-900 leading-snug">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
