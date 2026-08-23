import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useListings, useCategories } from "../data/hooks";
import GenericCard from "../components/GenericCard";
import ListingsMap from "../components/ListingsMap";
import { SectionIcon } from "../lib/icons";
import { TAG_OPTIONS } from "../lib/tags";
import { LOCATION_OPTIONS, locationMatches } from "../lib/locations";
import { Map, List, RefreshCw } from "lucide-react";
import TideWidget from "../components/TideWidget";

// Skeleton card matching GenericCard's layout, so the grid doesn't jump
// around once real content arrives and there's no bare "Loading..." flash.
function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full h-44 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-full" />
      </div>
    </div>
  );
}

function ListingCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ListingErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-500 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}

export default function SectionListing() {
  const { sectionKey } = useParams();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTags, setActiveTags] = useState([]);
  const [activeLocation, setActiveLocation] = useState("");
  const [view, setView] = useState("list"); // "list" | "map"
  const { categories } = useCategories();
  const { listings, loading, error, retry } = useListings(sectionKey);
  const config = categories.find((c) => c.key === sectionKey);

  function toggleTag(key) {
    setActiveTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  const filtered = listings.filter(
    (i) =>
      (i.title.toLowerCase().includes(query.toLowerCase()) ||
        (i.location || "").toLowerCase().includes(query.toLowerCase())) &&
      (activeTags.length === 0 || activeTags.every((t) => (i.tags || []).includes(t))) &&
      (!activeLocation || locationMatches(i.location, activeLocation))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">{config?.tag || ""}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <SectionIcon sectionKey={sectionKey} className="w-8 h-8 text-teal-700" />
          {config?.title || sectionKey}
        </h1>
        {/* Visible result count - flagged in the re-audit: a directory
            listing page should tell a visitor how many results they're
            looking at, not just show cards with no count anywhere. */}
        {!loading && !error && (
          <p className="text-slate-500 text-sm">
            {filtered.length === listings.length
              ? `${listings.length} ${config?.title || sectionKey} in Zanzibar`
              : `${filtered.length} of ${listings.length} ${config?.title || sectionKey}`}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-96 border border-slate-300 rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />

        <select
          value={activeLocation}
          onChange={(e) => setActiveLocation(e.target.value)}
          className="w-full sm:w-56 border border-slate-300 rounded-full px-5 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
        >
          <option value="">All Locations</option>
          {LOCATION_OPTIONS.map((loc) => (
            <option key={loc.key} value={loc.key}>
              {loc.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 border border-slate-300 rounded-full p-1 w-fit">
          <button
            type="button"
            onClick={() => setView("list")}
            className={
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition " +
              (view === "list" ? "bg-teal-700 text-white" : "text-slate-600")
            }
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition " +
              (view === "map" ? "bg-teal-700 text-white" : "text-slate-600")
            }
          >
            <Map className="w-4 h-4" /> Map
          </button>
        </div>
      </div>

      {sectionKey === "beaches" && <TideWidget />}

      <div className="flex flex-wrap gap-2 mb-8">
        {TAG_OPTIONS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => toggleTag(t.key)}
            className={
              "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
              (activeTags.includes(t.key)
                ? "bg-teal-700 border-teal-700 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
            }
          >
            <t.icon className="w-3.5 h-3.5" strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListingCardSkeletonGrid count={6} />
      ) : error ? (
        <ListingErrorState message={error} onRetry={retry} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          {listings.length === 0 ? (
            // Category genuinely has no approved listings yet - a
            // different situation from "your search/filters matched
            // nothing", so it gets its own honest message rather than
            // reusing "Nothing found" for both.
            <p className="text-slate-500">No {config?.title || sectionKey} listed yet - check back soon.</p>
          ) : (
            <>
              <p className="text-slate-500 mb-3">Nothing matches your search or filters.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTags([]);
                  setActiveLocation("");
                }}
                className="text-teal-700 font-semibold text-sm hover:underline"
              >
                Clear search and filters
              </button>
            </>
          )}
        </div>
      ) : view === "map" ? (
        <ListingsMap listings={filtered} sectionKey={sectionKey} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={sectionKey} />
          ))}
        </div>
      )}
    </div>
  );
}
