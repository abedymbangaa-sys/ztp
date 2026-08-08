import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { extractLatLng } from "../lib/mapUtils";

// Renders an interactive Leaflet map with a pin for every listing that has
// real coordinates in its maps_link. Leaflet itself is loaded globally via
// a <script>/<link> tag in index.html (see README note), so this component
// just waits for `window.L` to exist rather than importing an npm package.
export default function ListingsMap({ listings, sectionKey }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.L || !containerRef.current) return;

    const points = listings
      .map((item) => {
        const coords = extractLatLng(item.maps_link);
        return coords ? { ...coords, item } : null;
      })
      .filter(Boolean);

    if (!mapRef.current) {
      mapRef.current = window.L.map(containerRef.current).setView([-6.1659, 39.2026], 10); // Zanzibar center
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }

    // Clear old markers before adding new ones (e.g. when filters change)
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof window.L.Marker) mapRef.current.removeLayer(layer);
    });

    points.forEach(({ lat, lng, item }) => {
      const marker = window.L.marker([lat, lng]).addTo(mapRef.current);
      const popupDiv = document.createElement("div");
      popupDiv.innerHTML = `<strong>${item.title}</strong><br/><a href="/ad/${item.id}" style="color:#0f766e;">View details &rarr;</a>`;
      marker.bindPopup(popupDiv);
    });

    if (points.length > 0) {
      const bounds = window.L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [listings, sectionKey]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 rounded-xl overflow-hidden border border-slate-200 mb-8"
    />
  );
}
