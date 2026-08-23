import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useListings, useCategories } from "../data/hooks";
import { extractLatLng, haversineDistanceKm } from "../lib/mapUtils";
import { AREAS } from "../data/areas";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { Compass, MapPin, RefreshCw, LocateFixed } from "lucide-react";

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

// /near-me - "What is near me?" (report section 8.3). Only meaningful once
// the visitor is actually in Zanzibar, so this asks for their live location
// rather than requiring an account or manual area picker. Never shown or
// used anywhere except this page/session - not stored.
function ManualAreaLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {AREAS.map((a) => (
        <Link
          key={a.key}
          to={`/area/${a.key}`}
          className="text-sm font-semibold border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-700 px-4 py-2 rounded-full transition"
        >
          {a.name}
        </Link>
      ))}
    </div>
  );
}

export default function NearMe() {
  const { categories } = useCategories();
  const { listings, loading: listingsLoading, error, retry } = useListings();
  const [activeCategory, setActiveCategory] = useState("");

  // locationStatus: "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error"
  const [locationStatus, setLocationStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  // Some browsers/environments never fire either the success or error
  // callback if the permission prompt itself stalls (silently blocked by
  // an embedded webview, a policy, or an automated crawler) - the
  // geolocation API's own `timeout` option doesn't cover that case since
  // it only starts counting once a request is actually in flight. This is
  // a hard backstop: if we're still "requesting" after 6s no matter what,
  // show the manual area fallback instead of leaving the visitor stuck on
  // "Asking your browser for your location..." forever.
  const [showManualFallback, setShowManualFallback] = useState(false);

  useSEO({
    title: "What's Near Me in Zanzibar | Zanzibar Paradise Tours",
    description: "Find hotels, restaurants, beaches and things to do near your current location in Zanzibar.",
    canonical: "https://visitzanzibarparadise.com/near-me",
  });

  function requestLocation() {
    setShowManualFallback(false);
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      (err) => {
        setLocationStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }

  // Auto-prompt once on first load, same as any "find things near me" tool -
  // the browser's own permission dialog is the real gate, this just fires it.
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (locationStatus !== "requesting") return;
    const timer = setTimeout(() => setShowManualFallback(true), 6000);
    return () => clearTimeout(timer);
  }, [locationStatus]);

  const withDistance = useMemo(() => {
    if (!coords) return [];
    return listings
      .map((item) => {
        const itemCoords = extractLatLng(item.maps_link);
        if (!itemCoords) return null;
        return { item, distanceKm: haversineDistanceKm(coords, itemCoords) };
      })
      .filter(Boolean)
      .filter((row) => !activeCategory || row.item.category_key === activeCategory)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [listings, coords, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">While you're here</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-teal-700" />
          What's Near Me
        </h1>
        <p className="text-slate-600">
          Uses your current location to show hotels, food and things to do closest to you right now.
        </p>
      </div>

      {locationStatus === "requesting" && (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-6">Asking your browser for your location…</p>
          {showManualFallback && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-slate-500 mb-3">Taking a while? Jump straight to an area instead:</p>
              <ManualAreaLinks />
            </div>
          )}
        </div>
      )}

      {locationStatus === "denied" && (
        <div className="text-center py-16 max-w-md mx-auto">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">
            Location access was denied, so we can't show what's nearby. You can allow it in your browser's site
            settings, or browse everything by area instead.
          </p>
          <button
            onClick={requestLocation}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full mb-6"
          >
            <LocateFixed className="w-4 h-4" /> Try again
          </button>
          <ManualAreaLinks />
        </div>
      )}

      {(locationStatus === "unsupported" || locationStatus === "error") && (
        <div className="text-center py-16 max-w-md mx-auto">
          <p className="text-slate-500 mb-6">We couldn't get your location on this device. Choose an area instead:</p>
          <ManualAreaLinks />
        </div>
      )}

      {locationStatus === "granted" && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              className={
                "text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
                (activeCategory === ""
                  ? "bg-teal-700 border-teal-700 text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
              }
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCategory(c.key)}
                className={
                  "text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
                  (activeCategory === c.key
                    ? "bg-teal-700 border-teal-700 text-white"
                    : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
                }
              >
                {c.title}
              </button>
            ))}
          </div>

          {listingsLoading ? (
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
          ) : withDistance.length === 0 ? (
            <p className="text-slate-500">
              Nothing with a saved map location matches this filter yet near you - try "All" or check back as more
              listings add their exact location.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {withDistance.map(({ item, distanceKm }) => (
                <GenericCard key={item.id} item={item} sectionKey={item.category_key} distanceKm={distanceKm} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
