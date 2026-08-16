import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import GenericCard from "../components/GenericCard";
import FilterBar from "../components/FilterBar";
import { Compass } from "lucide-react";

// Categories that count as an "activity" rather than a place to stay/eat.
// Hotels and restaurants are deliberately excluded — this page is about
// what to actually go out and do in Zanzibar.
const ACTIVITY_CATEGORIES = ["tours", "attractions", "experiences", "heritage", "caves", "nature", "beaches"];

export default function ThingsToDo() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .in("category_key", ACTIVITY_CATEGORIES)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (mounted) {
          setListings(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

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

      <FilterBar listings={listings} onFilterChange={setExtraFilters} />

      {loading ? (
        <p className="text-slate-500 text-center py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-16">Nothing found in this category yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
          ))}
        </div>
      )}
    </div>
  );
}
