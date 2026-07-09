import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLatLng } from "../lib/geo";

// Fix default marker icons (Vite bundling breaks leaflet's default asset paths)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ZANZIBAR_CENTER = [-6.1659, 39.2026];

export default function ZanzibarMap({ listings = [] }) {
  const pins = listings
    .map((item) => ({ ...item, coords: parseLatLng(item.maps_link) }))
    .filter((item) => item.coords);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[420px]">
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
      </MapContainer>
      {pins.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">Loading map markers...</p>
      )}
    </div>
  );
}
