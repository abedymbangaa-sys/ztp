// Extracts { lat, lng } from a Google Maps "search" link if the link's
// query parameter is a raw coordinate pair (e.g. "-6.16,39.19"). Returns
// null if the link is missing, malformed, or uses a text search instead
// of coordinates (e.g. "Nungwi+Beach+Zanzibar") - those listings simply
// won't get a pin on the map until their link is corrected.
export function extractLatLng(mapsLink) {
  if (!mapsLink) return null;
  try {
    const url = new URL(mapsLink);
    const query = url.searchParams.get("query");
    if (!query) return null;
    const match = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
