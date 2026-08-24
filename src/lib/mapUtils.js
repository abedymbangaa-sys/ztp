// Extracts { lat, lng } from a Google Maps link, if the link contains a
// raw coordinate pair. Supports every common format people end up with
// when sharing a location:
//   1. The "search" link with a coordinate query
//      (.../maps/search/?api=1&query=-6.16,39.19) - also what this
//      site's own "Get Directions" fallback link builder produces.
//   2. The ordinary "place"/map-view link Google puts in the address bar
//      (.../maps/place/Some+Name/@-6.16,39.19,17z/...).
//   3. The embedded-coordinate parameter Google Maps adds to some
//      "place" links alongside the @lat,lng in #2 (!3d-6.16!4d39.19).
//   4. A bare "-6.16,39.19" pair with nothing else around it, in case it
//      was pasted directly rather than as part of a maps.google.com URL.
// Returns null if the link is missing, malformed, a short goo.gl link
// (maps.app.goo.gl - those need resolving server-side to reveal
// coordinates, which we don't do here), or uses a text search instead of
// coordinates (e.g. "Nungwi+Beach+Zanzibar") - those listings simply
// won't get a pin on the map until their link is corrected to one of the
// formats above.
export function extractLatLng(mapsLink) {
  if (!mapsLink) return null;

  // Format 1: ?query=lat,lng (or &query=lat,lng)
  let match = mapsLink.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  // Format 2: .../@lat,lng,zoom anywhere in the path
  match = mapsLink.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  // Format 3: !3dlat!4dlng
  match = mapsLink.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  // Format 4: a bare "lat,lng" pair with nothing else around it
  match = mapsLink.match(/^\s*(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)\s*$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  return null;
}

// Great-circle distance between two coordinates, in kilometers. Used by the
// "Near Me" page to sort listings by actual distance from the visitor.
export function haversineDistanceKm(a, b) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
