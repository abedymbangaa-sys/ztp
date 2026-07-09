import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, ArrowRight } from "lucide-react";
import { useRelatedListings } from "../data/hooks";

// "Explore Nearby" - a horizontally-scrolling strip of other listings in the
// same category, shown at the bottom of a detail page. Compact cards keep
// this section light instead of repeating the big grid cards used on
// category pages, so the page doesn't feel like it's stacking huge blocks
// on top of each other.
export default function RelatedListings({ categoryKey, excludeId, title = "Explore Nearby" }) {
  const { related, loading } = useRelatedListings(categoryKey, excludeId, 8);

  if (loading || related.length === 0) return null;

  return (
    <div className="mt-14 pt-10 border-t border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <Link
          to={`/${categoryKey}`}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin">
        {related.map((item) => (
          <Link
            key={item.id}
            to={`/${categoryKey}/${item.id}`}
            className="group shrink-0 w-56 snap-start bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-100"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {item.is_verified && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 text-teal-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="p-3">
              {item.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{item.location}</span>
                </div>
              )}
              <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}