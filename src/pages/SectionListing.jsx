import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useListings, useCategories } from "../data/hooks";
import GenericCard from "../components/GenericCard";
import { SectionIcon } from "../lib/icons";
import { TAG_OPTIONS } from "../lib/tags";

export default function SectionListing() {
  const { sectionKey } = useParams();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTags, setActiveTags] = useState([]);
  const { categories } = useCategories();
  const { listings, loading } = useListings(sectionKey);

  const config = categories.find((c) => c.key === sectionKey);

  function toggleTag(key) {
    setActiveTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  const filtered = listings.filter(
    (i) =>
      (i.title.toLowerCase().includes(query.toLowerCase()) ||
        (i.location || "").toLowerCase().includes(query.toLowerCase())) &&
      (activeTags.length === 0 || activeTags.every((t) => (i.tags || []).includes(t)))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">{config?.tag || ""}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <SectionIcon sectionKey={sectionKey} className="w-8 h-8 text-teal-700" />
          {config?.title || sectionKey}
        </h1>
      </div>

      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:w-96 border border-slate-300 rounded-full px-5 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />

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
        <p className="text-slate-500 text-center py-16">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-16">Nothing found.</p>
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
