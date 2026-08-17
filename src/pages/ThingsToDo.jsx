import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import GenericCard from "../components/GenericCard";
import FilterBar from "../components/FilterBar";
import { Compass } from "lucide-react";

// Categories that count as an "activity" rather than a place to stay/eat.
// Hotels and restaurants are deliberately excluded — this page is about
// what to actually go out and do in Zanzibar.
const ACTIVITY_CATEGORIES = ["tours", "attractions", "experiences", "heritage", "caves", "nature", "beaches"];

function ActivityCardSkeleton() {
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

function ActivityCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ActivityCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ErrorState({ message, onAction }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-500 mb-4">{message}</p>
      <button
        onClick={onAction}
        className="bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
      >
        Try again
      </button>
    </div>
  );
}

export default function ThingsToDo() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [extraFilters, setExtraFilters] = useState({ locationSearch: "", selectedTags: [] });

  useEffect(() => {
    document.title = "Things to Do in Zanzibar | Zanzibar Paradise Tours";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "The best things to do in Zanzibar — tours, attractions, heritage sites, caves, nature spots and unique experiences, curated by locals."
      );
    }
  }, []);

  // Data fetch — now with proper error handling so `isLoading` always
  // resolves to false, a hard timeout so a hung request can't leave the
  // page stuck forever, and a `mounted` guard so a slow response can't
  // update state after the user has already navigated away.
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    const TIMEOUT_MS = 15000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
    );

    async function loadListings() {
      try {
        const result = await Promise.race([
          supabase
            .from("listings")
            .select("*")
            .eq("status", "approved")
            .in("category_key", ACTIVITY_CATEGORIES)
            .order("created_at", { ascending: false }),
          timeoutPromise,
        ]);

        if (result.error) throw result.error;

        if (mounted) {
          setListings(result.data || []);
          setIsLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("ThingsToDo: failed to load listings", err);
        }
        if (mounted) {
          setError("Unable to load activities right now.");
          setListings([]);
          setIsLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      mounted = false;
    };
  }, [retryKey]);

  // Step 1: filter by category button (Tours, Attractions, etc.)
  const byCategory =
    activeFilter === "all" ? listings : listings.filter((l) => l.category_key === activeFilter);

  // Step 2: filter by location search text (matches anywhere in the location field)
  const byLocation = extraFilters.locationSearch
    ? byCategory.filter((l) =>
        (l.location || "").toLowerCase().includes(extraFilters.locationSearch.toLowerCase())
      )
    : byCategory;

  // Step 3: filter by selected tags (listing must have ALL selected tags)
  const filtered =
    extraFilters.selectedTags.length > 0
      ? byLocation.filter((l) =>
          extraFilters.selectedTags.every((tag) => (l.tags || []).includes(tag))
        )
      : byLocation;

  const filterLabels = {
    all: "All",
    tours: "Tours",
    attractions: "Attractions",
    experiences: "Experiences",
    heritage: "Heritage",
    caves: "Caves",
    nature: "Nature",
    beaches: "Beaches",
  };

  const availableFilters = ["all", ...ACTIVITY_CATEGORIES.filter((c) => listings.some((l) => l.category_key === c))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Plan your visit</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Compass className="w-8 h-8 text-teal-700" />
          Things to Do in Zanzibar
        </h1>
        <p className="text-slate-600 max-w-2xl">
          From spice tours and dolphin encounters to Stone Town heritage walks and hidden caves —
          here's a curated list of activities across the island, all in one place.
        </p>
      </div>

      {!isLoading && !error && (
        <div className="flex flex-wrap gap-2 mb-6">
          {availableFilters.map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={
                "text-sm font-semibold px-4 py-1.5 rounded-full border transition " +
                (activeFilter === key
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-slate-600 border-slate-300 hover:border-teal-400")
              }
            >
              {filterLabels[key] || key}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !error && <FilterBar listings={listings} onFilterChange={setExtraFilters} />}

      {isLoading && <ActivityCardSkeletonGrid count={6} />}

      {!isLoading && error && (
        <ErrorState message={error} onAction={() => setRetryKey((k) => k + 1)} />
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-slate-500 text-center py-16">No activities found for this filter.</p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
          ))}
        </div>
      )}
    </div>
  );
}
