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
  const pointCountRef = useRef(0);

  useEffect(() => {
    if (!window.L || !containerRef.current) return;

    const points = listings
      .map((item) => {
        const coords = extractLatLng(item.maps_link);
        return coords ? { ...coords, item } : null;
      })
      .filter(Boolean);
    pointCountRef.current = points.length;

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
      // Link to the listing's own detail page (/<sectionKey>/<id>), same
      // route GenericCard uses - this used to hardcode "/ad/<id>" (the
      // paid-advertisement route), which sent every listing popup to the
      // wrong page.
      // Prefer the item's own category (needed on pages like /area/:key that
      // mix hotels, tours, restaurants etc in one map) and only fall back to
      // the page-level sectionKey for single-category listing pages.
      const linkCategory = item.category_key || sectionKey;
      popupDiv.innerHTML = `<strong>${item.title}</strong><br/><a href="/${linkCategory}/${item.id}" style="color:#0f766e;">View details &rarr;</a>`;
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

  const hasAnyMapsLink = listings.some((item) => !!item.maps_link);

  return (
    <div className="mb-8">
      <div
        ref={containerRef}
        className="w-full h-96 rounded-xl overflow-hidden border border-slate-200"
      />
      {!hasAnyMapsLink && listings.length > 0 && (
        <p className="text-sm text-slate-500 text-center mt-3">
          None of these listings have a map location saved yet, so no pins are shown. Switch to List view to browse them.
        </p>
      )}
    </div>
  );
}
