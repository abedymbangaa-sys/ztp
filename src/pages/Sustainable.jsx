import { useListings } from "../data/hooks";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { Leaf } from "lucide-react";

export default function Sustainable() {
  useSEO({
    title: "Sustainable & Eco-Certified Places in Zanzibar | Zanzibar Paradise Tours",
    description:
      "Eco-certified hotels, tours, and experiences in Zanzibar - for travelers who want their visit to support the island's environment and communities.",
    canonical: "https://visitzanzibarparadise.com/sustainable",
  });

  // Reuses the existing "all categories" listings fetch (same one
  // SectionListing.jsx uses when no category is specified) and filters
  // client-side for the eco-certified tag - no new table, no new fetch.
  const { listings, loading, error } = useListings();
  const ecoListings = listings.filter((l) => (l.tags || []).includes("eco-certified"));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <p className="text-green-700 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-1">
          <Leaf className="w-4 h-4" /> Sustainable Zanzibar
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Eco-Certified Places to Stay &amp; Do
        </h1>
        <p className="text-slate-600 mt-2">
          Hotels, tours, and experiences that have been marked eco-certified - for travelers who
          want their visit to leave a lighter footprint on Zanzibar.
        </p>
      </div>

      {loading && <p className="text-center text-slate-500 text-sm">Loading...</p>}
      {error && <p className="text-center text-red-600 text-sm">{error}</p>}

      {!loading && !error && ecoListings.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="text-slate-700 font-semibold mb-1">No eco-certified listings yet</p>
          <p className="text-slate-500 text-sm">Check back soon as more partners get certified.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ecoListings.map((item) => (
          <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
        ))}
      </div>
    </div>
  );
}
