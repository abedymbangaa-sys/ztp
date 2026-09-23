import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLatLng } from "../lib/geo";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
import { useCategories } from "../data/hooks";
import { AREAS } from "../data/areas";
import StoryMapPin from "./StoryMapPin";

// Fix default marker icons (Vite bundling breaks leaflet's default asset paths)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ZANZIBAR_CENTER = [-6.1659, 39.2026];

export default function ZanzibarMap({ listings = [], loading = false }) {
  const { language } = useLanguage();
  // StoryMapPin only understands 'sw' or 'en' — anything else (it/de) falls back to English
  const storyLang = language === "sw" ? "sw" : "en";

  const { categories } = useCategories();

  const [storyPins, setStoryPins] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeArea, setActiveArea] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const mapRef = useRef(null);
  const markerRefs = useRef({}); // item.id -> Leaflet marker instance

  useEffect(() => {
    let isMounted = true;
    supabase
      .from("story_pins")
      .select("*")
      .eq("is_published", true)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Failed to load story pins:", error);
          return;
        }
        setStoryPins(data || []);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const allPins = useMemo(
    () =>
      listings
        .map((item) => ({ ...item, coords: parseLatLng(item.maps_link) }))
        .filter((item) => item.coords),
    [listings]
  );

  // Category/area filters only apply to regular listing pins - story pins
  // are a separate "extra" layer (audio/local stories) that always shows,
  // same as before this change.
  const pins = useMemo(
    () =>
      allPins.filter(
        (item) =>
          (!activeCategory || item.category_key === activeCategory) &&
          (!activeArea || item.area === activeArea)
      ),
    [allPins, activeCategory, activeArea]
  );

  // Only offer area chips for areas that actually have at least one
  // approved listing right now - an empty filter chip is worse than no
  // chip at all (same lesson as the Collections-with-0-listings issue).
  const areasWithListings = useMemo(() => {
    const present = new Set(allPins.map((item) => item.area).filter(Boolean));
    return AREAS.filter((a) => present.has(a.key));
  }, [allPins]);

  function focusPin(item) {
    setSelectedId(item.id);
    const map = mapRef.current;
    if (map) {
      map.flyTo(item.coords, 13, { duration: 0.6 });
    }
    // Open its popup once the fly animation is done, else Leaflet can
    // sometimes position the popup using the pre-flight view.
    setTimeout(() => {
      markerRefs.current[item.id]?.openPopup();
    }, 350);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveCategory("")}
          className={
            "text-xs font-semibold px-3 py-1.5 rounded-full border transition " +
            (activeCategory === ""
              ? "bg-teal-700 border-teal-700 text-white"
              : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
          }
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCategory(activeCategory === c.key ? "" : c.key)}
            className={
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition " +
              (activeCategory === c.key
                ? "bg-teal-700 border-teal-700 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
            }
          >
            {c.title}
          </button>
        ))}
      </div>
      {areasWithListings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveArea("")}
            className={
              "text-xs font-medium px-3 py-1.5 rounded-full border transition " +
              (activeArea === ""
                ? "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-400")
            }
          >
            All areas
          </button>
          {areasWithListings.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setActiveArea(activeArea === a.key ? "" : a.key)}
              className={
                "text-xs font-medium px-3 py-1.5 rounded-full border transition " +
                (activeArea === a.key
                  ? "bg-slate-800 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400")
              }
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl overflow-hidden border border-slate-200 h-[420px] relative">
          <MapContainer
            ref={mapRef}
            center={ZANZIBAR_CENTER}
            zoom={10}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pins.map((item) => (
              <Marker
                key={item.id}
                position={item.coords}
                ref={(el) => {
                  if (el) markerRefs.current[item.id] = el;
                }}
                eventHandlers={{ click: () => setSelectedId(item.id) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-slate-500">{item.location}</p>
                    <Link to={`/${item.category_key}/${item.id}`} className="text-teal-700 font-semibold">
                      View More →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
            {storyPins.map((pin) => (
              <StoryMapPin key={`story-${pin.id}`} pin={pin} lang={storyLang} />
            ))}
          </MapContainer>

          {storyPins.length > 0 && (
            <div className="absolute top-3 right-3 bg-white/95 rounded-full shadow-sm px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 pointer-events-none">
              <span>🎙️</span> Local story
            </div>
          )}
          {/* Distinguishes "still fetching listings" from "finished, and truly
              none of them have a usable map location" - the two were
              previously conflated into a single "Loading map markers..."
              message that stayed on screen even once loading had genuinely
              finished with zero valid pins (confirmed in the site re-audit). */}
          {loading && pins.length === 0 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              <p className="bg-white/95 text-slate-500 text-sm px-3 py-1.5 rounded-full shadow-sm">
                Loading map markers…
              </p>
            </div>
          )}
          {!loading && pins.length === 0 && storyPins.length === 0 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              <p className="bg-white/95 text-slate-500 text-sm px-3 py-1.5 rounded-full shadow-sm">
                Nothing matches this filter yet - try "All categories" or "All areas".
              </p>
            </div>
          )}
        </div>

        {/* List <-> map sync: clicking an item flies the map to it and
            opens its popup, so the list and the map always agree on
            what's currently in view. */}
        <div className="h-[420px] overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {pins.length === 0 ? (
            <p className="text-sm text-slate-400 p-4">No listings match this filter.</p>
          ) : (
            pins.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => focusPin(item)}
                className={
                  "w-full text-left px-4 py-2.5 transition " +
                  (selectedId === item.id ? "bg-teal-50" : "hover:bg-slate-50")
                }
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.location}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
