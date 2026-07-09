// Parses "https://www.google.com/maps/search/?api=1&query=-5.73,39.29" style
// links to extract [lat, lng] for use on the interactive map.
export function parseLatLng(mapsLink) {
  if (!mapsLink) return null;
  const match = mapsLink.match(/query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])];
}
