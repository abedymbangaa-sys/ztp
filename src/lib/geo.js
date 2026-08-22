// Parses a Google Maps link to extract [lat, lng] for use on the
// interactive map. Google Maps URLs come in several shapes depending on
// how the link was created/shared - this now recognizes the common
// ones instead of only the "query=lat,lng" format, which was silently
// dropping any listing whose maps_link used a different (still
// perfectly valid) Google Maps URL style, leaving the map without
// markers for those listings.
export function parseLatLng(mapsLink) {
  if (!mapsLink) return null;

  // 1. "?api=1&query=-6.16,39.19" - the format this site's own
  //    "Get Directions" fallback link builder produces.
  let match = mapsLink.match(/[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];

  // 2. ".../@-6.16,39.19,15z" - the format Google Maps uses in the
  //    address bar for a "place" or map-view link.
  match = mapsLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];

  // 3. "!3d-6.16!4d39.19" - the embedded-coordinate parameter Google
  //    Maps adds to some "place" links alongside the @lat,lng in #2.
  match = mapsLink.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];

  // 4. A bare "-6.16,39.19" pair with nothing else around it - in case
  //    it was pasted directly rather than as part of a maps.google.com
  //    URL.
  match = mapsLink.match(/^\s*(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)\s*$/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];

  // A maps.app.goo.gl/xxxx short link has no coordinates in the URL
  // itself (Google resolves it server-side), so it can't be parsed
  // client-side - returning null here means it correctly won't show a
  // pin, rather than showing a wrong one.
  return null;
}
