// Parses a Google Maps link to extract [lat, lng] for use on the
// interactive map. Delegates to the shared extractLatLng() in mapUtils.js
// so every map/near-me feature on the site recognizes the exact same set
// of Google Maps link formats - previously this file had its own,
// slightly more permissive copy of the same regex logic, which meant a
// listing could show a pin on the homepage map but silently vanish from
// the category-page map and Near Me results (or vice versa) depending on
// which Maps link format was pasted for it.
import { extractLatLng } from "./mapUtils";

export function parseLatLng(mapsLink) {
  const coords = extractLatLng(mapsLink);
  return coords ? [coords.lat, coords.lng] : null;
}

