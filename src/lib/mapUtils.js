// Extracts { lat, lng } from a Google Maps link, if the link contains a
// raw coordinate pair. Supports the two common formats people end up
// with when sharing a location: the "search" link with a coordinate
// query (.../maps/search/?api=1&query=-6.16,39.19) and the ordinary
// "place" link Google generates when you open a pin and copy its URL
// (.../maps/place/Some+Name/@-6.16,39.19,17z/...). Returns null if the
// link is missing, malformed, a short goo.gl link (those need resolving
// server-side to reveal coordinates, which we don't do here), or uses a
// text search instead of coordinates (e.g. "Nungwi+Beach+Zanzibar") -
// those listings simply won't get a pin on the map until their link is
// corrected to one of the two supported formats above.
export function extractLatLng(mapsLink) {
  if (!mapsLink) return null;
  try {
    const url = new URL(mapsLink);

    // Format 1: ?query=lat,lng (or &query=lat,lng)
    const query = url.searchParams.get("query");
    if (query) {
      const match = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
      }
    }

    // Format 2: .../@lat,lng,zoom anywhere in the path (the format Google
    // itself puts in the address bar for any place/search page you open).
    const atMatch = mapsLink.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
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
