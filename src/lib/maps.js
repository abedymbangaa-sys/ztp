// Hujenga URL ya Google Maps kwa listing bila API key.
//
// Mpangilio (kwa mpangilio wa upendeleo):
//   1. item.maps_link  - kama admin tayari ameweka link ya moja kwa moja
//      (ndiyo field iliyopo tayari kwenye "View on Google Maps" ya sasa).
//   2. item.location   - vinginevyo, tengeneza search query kwa jina la
//      listing + location yake.
//
// Ikiwa hakuna maps_link WALA location, inarudisha null - button
// "Get Directions" haitaonyeshwa/itakuwa disabled kwenye component.
export function buildDirectionsUrl(item) {
  if (!item) return null;

  if (item.maps_link) {
    return item.maps_link;
  }

  if (item.location) {
    const query = `${item.title}, ${item.location}, Zanzibar`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return null;
}
