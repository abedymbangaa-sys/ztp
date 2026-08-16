import { useState, useEffect } from "react";

// Location is free-text in the database (e.g. "Nungwi, North Zanzibar"),
// so we do a simple substring search rather than a fixed dropdown.
// Tags come from the `tags` text[] column on listings.

export default function FilterBar({ listings, onFilterChange }) {
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Build the tag list dynamically from whatever tags actually exist in the data
  const allTags = Array.from(
    new Set((listings || []).flatMap((l) => l.tags || []))
  ).sort();

  useEffect(() => {
    onFilterChange({ locationSearch, selectedTags });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, selectedTags]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setLocationSearch("");
    setSelectedTags([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-6">
      {/* Location search */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-gray-500">Location</label>
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="e.g. Stone Town, Nungwi..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48"
        />
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-500">Tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={
                  "text-xs font-semibold px-3 py-1 rounded-full border transition " +
                  (selectedTags.includes(tag)
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-white text-slate-600 border-slate-300 hover:border-teal-400")
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {(locationSearch || selectedTags.length > 0) && (
        <button
          onClick={clearFilters}
          className="ml-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
