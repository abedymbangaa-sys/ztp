import { useState, useEffect } from "react";
import { useT } from "../lib/i18n";

export default function FilterBar({ listings, onFilterChange }) {
  const t = useT();
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

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
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-gray-500">{t("Location")}</label>
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder={t("e.g. Stone Town, Nungwi...")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-500">{t("Tags")}</label>
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
          {t("Clear filters")}
        </button>
      )}
    </div>
  );
}
