// Central config for Zanzibar area landing pages (/area/:key). Adding a
// new area later means adding one entry here + backfilling listings.area
// in Supabase - no other code needs to change.
export const AREAS = [
  {
    key: "stone-town",
    name: "Stone Town",
    tagline: "Zanzibar's UNESCO old town — history, spice markets and rooftop sunsets",
    description:
      "Stone Town is Zanzibar's historic heart: narrow alleys, carved wooden doors, the old slave market, spice markets, and rooftop restaurants over the harbour. It's the best base for culture, food and day-trip boats to Prison Island.",
    heroImage: "/images/heritage/stone-town.jpeg",
  },
  {
    key: "north",
    name: "North Coast",
    tagline: "Nungwi & Kendwa — Zanzibar's most famous beaches and sunset swims",
    description:
      "The north coast around Nungwi and Kendwa has the island's calmest, most swimmable beaches at every tide, plus the liveliest sunset bars and dhow trips. It's the most popular first stop for beach holidays.",
    heroImage: "/images/beaches/nungwi-beach.jpeg",
  },
  {
    key: "east",
    name: "East Coast",
    tagline: "Paje, Bwejuu & Jambiani — kite-surfing, quiet villages, white sand",
    description:
      "The east coast (Paje, Bwejuu, Jambiani, Michamvi) is quieter and more laid-back than the north, with wide white beaches, seaweed farms, and some of the best kite-surfing conditions in East Africa.",
    heroImage: "/images/beaches/paje-beach-kite-surfing-hub.jpeg",
  },
  {
    key: "south",
    name: "South Coast",
    tagline: "Kizimkazi dolphins, Jozani Forest and quieter shores",
    description:
      "The south of Zanzibar is home to Kizimkazi's dolphin tours, Jozani-Chwaka Bay National Park (home to the red colobus monkey), and a handful of low-key beach lodges away from the crowds.",
    heroImage: "/images/attractions/jozani-chwaka-bay-national-park.jpeg",
  },
  {
    key: "central",
    name: "Central Zanzibar",
    tagline: "Spice farms, Jozani Forest and the island's green interior",
    description:
      "Central Zanzibar is spice-farm country - the source of the island's nickname 'Spice Island' - along with forest reserves and cultural stops between Stone Town and the coasts.",
    heroImage: "/images/tours/kidichi-spice-farm-tour.jpeg",
  },
  {
    key: "pemba",
    name: "Pemba Island",
    tagline: "Zanzibar's quiet sister island — untouched reefs and forest",
    description:
      "Pemba, north of Zanzibar's main island, is greener, quieter and far less visited - known for pristine diving reefs, clove plantations, and a slower pace than Unguja.",
    heroImage: "/images/nature/mangrove-forests.jpeg",
  },
];

export function getAreaConfig(key) {
  return AREAS.find((a) => a.key === key);
}
