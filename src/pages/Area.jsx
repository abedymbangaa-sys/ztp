import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { getAreaConfig, AREAS } from "../data/areas";
import GenericCard from "../components/GenericCard";
import { MapPin, RefreshCw } from "lucide-react";

const FETCH_TIMEOUT_MS = 15000;

function withTimeout(promise) {
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS));
  return Promise.race([promise, timeoutPromise]);
}

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

// /area/:areaKey - a landing page grouping every approved listing (any
// category: hotels, tours, beaches, restaurants...) that shares one of
// Zanzibar's geographic areas, with real intro copy and internal links to
// the other areas. Built for both visitors deciding "where should I stay"
// and for search engines - each area has a unique, indexable URL.
export default function Area() {
  const { areaKey } = useParams();
  const config = getAreaConfig(areaKey);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!config) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    withTimeout(
      supabase.from("listings").select("*").eq("status", "approved").eq("area", areaKey).order("created_at", { ascending: false })
    )
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        setListings(data || []);
        setLoading(false);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("Area: failed to load listings", err);
        if (!mounted) return;
        setError("Unable to load listings for this area right now.");
        setListings([]);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [areaKey, refreshKey]);

  useSEO({
    title: config ? `${config.name} Zanzibar — Hotels, Tours & Things to Do | Zanzibar Paradise Tours` : "Area not found",
    description: config ? config.description.slice(0, 155) : undefined,
    canonical: config ? `https://visitzanzibarparadise.com/area/${config.key}` : undefined,
    image: config ? `https://visitzanzibarparadise.com${config.heroImage}` : undefined,
  });

  if (!config) {
    return <Navigate to="/" replace />;
  }

  const hotels = listings.filter((l) => l.category_key === "hotels");
  const others = listings.filter((l) => l.category_key !== "hotels");
  const otherAreas = AREAS.filter((a) => a.key !== areaKey);

  return (
    <div>
      <section className="relative h-64 sm:h-80 flex items-end">
        <img src={config.heroImage} alt={config.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pb-8 w-full">
          <p className="text-amber-300 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> Zanzibar Area Guide
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{config.name}</h1>
          <p className="text-slate-200 mt-1 max-w-2xl">{config.tagline}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-slate-700 max-w-3xl leading-relaxed mb-10">{config.description}</p>

        {loading ? (
          <CardSkeletonGrid count={6} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <p className="text-slate-500">
            We're still adding listings for {config.name}. In the meantime, browse{" "}
            <Link to="/things-to-do" className="text-teal-700 font-semibold hover:underline">
              all Things to Do
            </Link>{" "}
            or ask a Zanzibar Expert on WhatsApp.
          </p>
        ) : (
          <div className="space-y-12">
            {hotels.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Where to stay in {config.name}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.map((item) => (
                    <GenericCard key={item.id} item={item} sectionKey="hotels" />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Things to do in {config.name}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {others.map((item) => (
                    <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Internal links to the other areas - helps visitors compare, and
            gives search engines a crawl path between all area pages. */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Explore other areas of Zanzibar</h2>
          <div className="flex flex-wrap gap-3">
            {otherAreas.map((a) => (
              <Link
                key={a.key}
                to={`/area/${a.key}`}
                className="border border-slate-200 hover:border-teal-600 hover:text-teal-700 transition text-slate-700 font-semibold px-4 py-2 rounded-full text-sm"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
