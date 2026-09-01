// Central config for curated "Zanzibar Collections" (report section 8.4).
// Each collection is just a filter recipe over listings you already have
// (by tag, category, and/or area) - no new Supabase columns needed. Adding
// a collection later means adding one entry here.
export const COLLECTIONS = [
  {
    key: "family-friendly",
    title: "Family-Friendly Zanzibar",
    tagline: "Places that work well with kids in tow",
    description:
      "Hotels, beaches and activities that are genuinely easy with children - calm water, space to relax, and staff used to families.",
    criteria: "Selected for calm swimming conditions, family rooms/space, and low-hassle logistics.",
    coverImage: "/images/beaches/kendwa-rocks-beach.jpeg",
    estimatedTime: "Best as a half-day to full-day plan",
    match: { tags: ["family-friendly"] },
  },
  {
    key: "budget",
    title: "Budget Zanzibar",
    tagline: "Real value without cutting the experience short",
    description:
      "For travellers (Tanzanian or international) who want an honest, affordable Zanzibar trip - no compromise on the good parts.",
    criteria: "Selected for genuine value for money, not just the lowest sticker price.",
    coverImage: "/images/beaches/jambiani-beach.jpeg",
    estimatedTime: "Mix and match across your whole trip",
    match: { tags: ["budget"] },
  },
  {
    key: "luxury",
    title: "Luxury Escapes",
    tagline: "The island's most refined stays and experiences",
    description: "For travellers who want Zanzibar at its most polished - private, high-end, detail-oriented.",
    criteria: "Selected for high-end finish, service standard and privacy.",
    coverImage: "/images/hotels/zanzibar-serena.jpeg",
    estimatedTime: "Best for a full stay, 3+ nights",
    match: { tags: ["luxury"] },
  },
  {
    key: "quiet-beaches",
    title: "Quiet Beaches",
    tagline: "Away from the crowds",
    description: "Beaches and beachfront stays picked for calm, low-crowd relaxation rather than nightlife.",
    criteria: "Selected for low crowds and distance from the busiest nightlife strips.",
    coverImage: "/images/beaches/matemwe-beach.jpeg",
    estimatedTime: "Half a day per beach, no rush",
    match: { tags: ["quiet-private"], categories: ["beaches", "hotels"] },
  },
  {
    key: "eco-conscious",
    title: "Eco-Conscious Zanzibar",
    tagline: "Businesses doing right by the island",
    description: "Places with real eco or community-benefiting practices, not just a green label.",
    criteria: "Selected for documented eco-certification or community-benefit practices.",
    coverImage: "/images/nature/mangrove-forests.jpeg",
    estimatedTime: "Mix and match across your whole trip",
    match: { tags: ["eco-certified"] },
  },
  {
    key: "stone-town-in-a-day",
    title: "Stone Town in One Day",
    tagline: "The old town, done right in a single visit",
    description: "Everything worth seeing, eating and doing in Stone Town if you only have one day there.",
    criteria: "Selected for walkability within Stone Town and being manageable in a single day.",
    coverImage: "/images/heritage/stone-town.jpeg",
    estimatedTime: "One full day, on foot",
    match: { areas: ["stone-town"] },
  },
  {
    key: "couples",
    title: "Zanzibar for Couples",
    tagline: "Places that work well for two",
    description: "Hotels, tours and dinners chosen with couples in mind - privacy, atmosphere and easy logistics for two.",
    criteria: "Selected because the business itself has marked these as suited to couples.",
    coverImage: "/images/hotels/zanzibar-serena.jpeg",
    estimatedTime: "Mix and match across your whole trip",
    match: { goodFor: ["couples"] },
  },
  {
    key: "honeymoon",
    title: "Zanzibar Honeymoon",
    tagline: "Our couples picks, narrowed to the more private and high-end end",
    description: "Pulled from the same couples-suited listings, filtered down to the ones also marked luxury - for a trip you only plan once.",
    criteria: "Selected as couples-suited AND tagged luxury - both set by the business, not guessed.",
    coverImage: "/images/hotels/zanzibar-serena.jpeg",
    estimatedTime: "Best for a full stay, 3+ nights",
    match: { goodFor: ["couples"], tags: ["luxury"] },
  },
  {
    key: "solo-travelers",
    title: "Zanzibar for Solo Travellers",
    tagline: "Easy to navigate alone, easy to meet people",
    description: "Places and tours that work well if you're travelling by yourself - straightforward logistics, no single-supplement guesswork needed to browse.",
    criteria: "Selected because the business has marked these as suited to solo travelers.",
    coverImage: "/images/beaches/paje-beach-kite-surfing-hub.jpeg",
    estimatedTime: "Mix and match across your whole trip",
    match: { goodFor: ["solo-travelers"] },
  },
  {
    key: "adventure",
    title: "Zanzibar for Adventure",
    tagline: "Kitesurfing, diving, and more active days",
    description: "Activities and tours for travellers who want to move - water sports, diving, and other active experiences.",
    criteria: "Selected because the business has marked these as suited to adventure seekers.",
    coverImage: "/images/beaches/paje-beach-kite-surfing-hub.jpeg",
    estimatedTime: "Best spread across a few days",
    match: { goodFor: ["adventure-seekers"] },
  },
  {
    key: "food-lovers",
    title: "Zanzibar for Food Lovers",
    tagline: "Restaurants worth building a meal around",
    description: "From Stone Town street food stalls to beachfront seafood grills - restaurants and food experiences across the island.",
    criteria: "All approved restaurant listings on the site.",
    coverImage: "/images/tours/kidichi-spice-farm-tour.jpeg",
    estimatedTime: "Mix and match across your whole trip",
    match: { categories: ["restaurants"] },
  },
  {
    key: "beach-lovers",
    title: "Zanzibar for Beach Lovers",
    tagline: "The best sand and swimming on the island",
    description: "Beaches and beachfront stays for travellers whose trip revolves around the water.",
    criteria: "Selected beach listings and hotels tagged beachfront.",
    coverImage: "/images/beaches/nungwi-beach.jpeg",
    estimatedTime: "Half a day per beach, no rush",
    match: { categories: ["beaches"] },
  },
  {
    key: "culture",
    title: "Zanzibar for Culture",
    tagline: "Heritage sites and history worth the detour",
    description: "Stone Town heritage sites and cultural attractions for travellers who want the island's history, not just its beaches.",
    criteria: "All approved heritage and attraction listings on the site.",
    coverImage: "/images/heritage/stone-town.jpeg",
    estimatedTime: "Half a day to a full day",
    match: { categories: ["heritage", "attractions"] },
  },
];

export function getCollectionConfig(key) {
  return COLLECTIONS.find((c) => c.key === key);
}

// Applies a collection's match rules to a list of already-loaded approved
// listings. Kept simple (OR within a field, AND across fields) since every
// collection here only uses one or two match fields.
export function filterListingsForCollection(listings, match) {
  if (!match) return [];
  return listings.filter((item) => {
    if (match.tags && !match.tags.some((tag) => (item.tags || []).includes(tag))) return false;
    if (match.goodFor && !match.goodFor.some((key) => (item.good_for || []).includes(key))) return false;
    if (match.categories && !match.categories.includes(item.category_key)) return false;
    if (match.areas && !match.areas.includes(item.area)) return false;
    return true;
  });
}
