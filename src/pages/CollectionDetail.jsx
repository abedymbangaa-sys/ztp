import { useParams, Link, Navigate } from "react-router-dom";
import { useListings } from "../data/hooks";
import { getCollectionConfig, filterListingsForCollection, COLLECTIONS } from "../data/collections";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { ArrowLeft, RefreshCw } from "lucide-react";

function CardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="w-full h-44 bg-slate-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CollectionDetail() {
  const { collectionKey } = useParams();
  const config = getCollectionConfig(collectionKey);
  // Reuses the same useListings hook every other page uses (timeout +
  // error/retry already built in) rather than a bespoke fetch - the
  // filtering happens client-side over the approved set it returns.
  const { listings, loading, error, retry } = useListings();

  useSEO({
    title: config ? `${config.title} | Zanzibar Paradise Tours` : "Collection not found",
    description: config ? config.description.slice(0, 155) : undefined,
    canonical: config ? `https://visitzanzibarparadise.com/collections/${config.key}` : undefined,
  });

  if (!config) {
    return <Navigate to="/collections" replace />;
  }

  const matched = filterListingsForCollection(listings, config.match);
  const otherCollections = COLLECTIONS.filter((c) => c.key !== collectionKey);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link to="/collections" className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> All collections
      </Link>

      <div className="mb-8 max-w-2xl">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">{config.tagline}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{config.title}</h1>
        <p className="text-slate-600">{config.description}</p>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : matched.length === 0 ? (
        <p className="text-slate-500">
          We're still adding listings to this collection - check back soon, or browse{" "}
          <Link to="/things-to-do" className="text-teal-700 font-semibold hover:underline">
            all Things to Do
          </Link>
          .
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matched.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
          ))}
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Other collections</h2>
        <div className="flex flex-wrap gap-3">
          {otherCollections.map((c) => (
            <Link
              key={c.key}
              to={`/collections/${c.key}`}
              className="border border-slate-200 hover:border-teal-600 hover:text-teal-700 transition text-slate-700 font-semibold px-4 py-2 rounded-full text-sm"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
