import { useParams, Link } from "react-router-dom";
import { useListings, useCategories } from "../data/hooks";
import { LOCATION_OPTIONS, locationMatches } from "../lib/locations";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { SectionIcon } from "../lib/icons";
import { MapPin, RefreshCw } from "lucide-react";

// Priority 1 - "Best hotels in Nungwi", "Best things to do in Paje", etc.
// Rather than hand-building a page per combination, this reads BOTH params
// from the URL (/best/:categoryKey/:locationKey) and reuses the exact same
// useListings + locationMatches filtering SectionListing already uses - so
// every category x village combination works without new pages being
// built or maintained one at a time.
export default function BestInArea() {
  const { categoryKey, locationKey } = useParams();
  const { categories } = useCategories();
  const { listings, loading, error, retry } = useListings(categoryKey);

  const config = categories.find((c) => c.key === categoryKey);
  const locationConfig = LOCATION_OPTIONS.find((l) => l.key === locationKey);

  const filtered = listings.filter((item) => locationMatches(item.location, locationKey));

  const categoryLabel = config?.title || categoryKey;
  const locationLabel = locationConfig?.label || locationKey;

  useSEO({
    title: locationConfig
      ? `Best ${categoryLabel} in ${locationLabel}, Zanzibar | Zanzibar Paradise Tours`
      : "Not found | Zanzibar Paradise Tours",
    description: `Hand-picked ${categoryLabel?.toLowerCase()} in ${locationLabel}, Zanzibar - real listings with direct contact details, no booking fees.`,
    canonical: locationConfig ? `https://visitzanzibarparadise.com/best/${categoryKey}/${locationKey}` : undefined,
  });

  if (!locationConfig) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Area not found</h1>
        <Link to="/collections" className="text-teal-700 font-semibold hover:underline">← Browse Collections</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-1.5">
          {config && <SectionIcon sectionKey={categoryKey} className="w-4 h-4" />} {locationLabel}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Best {categoryLabel} in {locationLabel}
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl">
          Real, contactable {categoryLabel?.toLowerCase()} in and around {locationLabel} - reach out directly, no
          booking fees added.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="w-full h-40 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2.5 rounded-full"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">
            No {categoryLabel?.toLowerCase()} listed in {locationLabel} yet.
          </p>
          <p className="text-slate-500 text-sm mb-4">More businesses are joining regularly - check back soon.</p>
          <Link
            to={`/${categoryKey}`}
            className="inline-block bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
          >
            Browse all {categoryLabel}
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={categoryKey} />
          ))}
        </div>
      )}
    </div>
  );
}
