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
    whoItSuits: "First-time visitors, culture and history lovers, foodies, short layovers before/after the beach.",
    dayPlan: [
      "Morning: wander the alleys, visit the old Slave Market and House of Wonders",
      "Midday: spice market + lunch in a local café",
      "Afternoon: Forodhani Gardens, harbour views",
      "Evening: rooftop dinner at sunset, then a short dhow trip if time allows",
    ],
  },
  {
    key: "north",
    name: "North Coast",
    tagline: "Nungwi & Kendwa — Zanzibar's most famous beaches and sunset swims",
    description:
      "The north coast around Nungwi and Kendwa has the island's calmest, most swimmable beaches at every tide, plus the liveliest sunset bars and dhow trips. It's the most popular first stop for beach holidays.",
    heroImage: "/images/beaches/nungwi-beach.jpeg",
    whoItSuits: "Beach lovers, honeymooners, groups who want swimmable water at any tide, sunset/nightlife seekers.",
    dayPlan: [
      "Morning: swim (always swimmable, unlike the east coast at low tide)",
      "Midday: seafood lunch by the water",
      "Afternoon: dhow cruise or snorkeling trip",
      "Evening: sunset bar, then dinner along the beach strip",
    ],
  },
  {
    key: "east",
    name: "East Coast",
    tagline: "Paje, Bwejuu & Jambiani — kite-surfing, quiet villages, white sand",
    description:
      "The east coast (Paje, Bwejuu, Jambiani, Michamvi) is quieter and more laid-back than the north, with wide white beaches, seaweed farms, and some of the best kite-surfing conditions in East Africa.",
    heroImage: "/images/beaches/paje-beach-kite-surfing-hub.jpeg",
    whoItSuits: "Kite-surfers, budget/backpacker travellers, couples wanting quiet villages over nightlife.",
    dayPlan: [
      "Morning: check tide times — best swimming is at high tide",
      "Midday: kite-surfing lesson or lounge at a beach bar",
      "Afternoon: walk the seaweed farms, visit a nearby village",
      "Evening: casual beach-shack dinner, early night (this coast is quiet after dark)",
    ],
  },
  {
    key: "south",
    name: "South Coast",
    tagline: "Kizimkazi dolphins, Jozani Forest and quieter shores",
    description:
      "The south of Zanzibar is home to Kizimkazi's dolphin tours, Jozani-Chwaka Bay National Park (home to the red colobus monkey), and a handful of low-key beach lodges away from the crowds.",
    heroImage: "/images/attractions/jozani-chwaka-bay-national-park.jpeg",
    whoItSuits: "Nature lovers, wildlife/dolphin-tour travellers, people wanting fewer crowds.",
    dayPlan: [
      "Morning: dolphin tour at Kizimkazi (go early for calmer water and more sightings)",
      "Midday: lunch near the coast",
      "Afternoon: Jozani Forest walk to see red colobus monkeys",
      "Evening: quiet lodge dinner — this coast has little nightlife",
    ],
  },
  {
    key: "central",
    name: "Central Zanzibar",
    tagline: "Spice farms, Jozani Forest and the island's green interior",
    description:
      "Central Zanzibar is spice-farm country - the source of the island's nickname 'Spice Island' - along with forest reserves and cultural stops between Stone Town and the coasts.",
    heroImage: "/images/tours/kidichi-spice-farm-tour.jpeg",
    whoItSuits: "Day-trippers based in Stone Town or the coasts, culture and nature travellers, not an overnight base for most visitors.",
    dayPlan: [
      "Morning: spice farm tour with tastings",
      "Midday: local lunch on the farm or nearby",
      "Afternoon: forest reserve stop or cultural village visit",
      "Evening: head back to Stone Town or your coastal base",
    ],
  },
  {
    key: "pemba",
    name: "Pemba Island",
    tagline: "Zanzibar's quiet sister island — untouched reefs and forest",
    description:
      "Pemba, north of Zanzibar's main island, is greener, quieter and far less visited - known for pristine diving reefs, clove plantations, and a slower pace than Unguja.",
    heroImage: "/images/nature/mangrove-forests.jpeg",
    whoItSuits: "Divers, travellers wanting an off-the-beaten-path escape, longer stays rather than day trips.",
    dayPlan: [
      "Morning: dive or snorkel trip on the reefs",
      "Midday: lunch at your lodge",
      "Afternoon: clove plantation visit or slow beach time",
      "Evening: quiet dinner — Pemba has very little nightlife by design",
    ],
  },
];

export function getAreaConfig(key) {
  return AREAS.find((a) => a.key === key);
}
