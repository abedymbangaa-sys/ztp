import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLatLng } from "../lib/geo";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
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

  const [storyPins, setStoryPins] = useState([]);

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

  const pins = listings
    .map((item) => ({ ...item, coords: parseLatLng(item.maps_link) }))
    .filter((item) => item.coords);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[420px] relative">
      <MapContainer center={ZANZIBAR_CENTER} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((item) => (
          <Marker key={item.id} position={item.coords}>
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
            No listings with a saved map location yet.
          </p>
        </div>
      )}
    </div>
  );
}
