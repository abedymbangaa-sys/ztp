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
    match: { tags: ["family-friendly"] },
  },
  {
    key: "budget",
    title: "Budget Zanzibar",
    tagline: "Real value without cutting the experience short",
    description:
      "For travellers (Tanzanian or international) who want an honest, affordable Zanzibar trip - no compromise on the good parts.",
    match: { tags: ["budget"] },
  },
  {
    key: "luxury",
    title: "Luxury Escapes",
    tagline: "The island's most refined stays and experiences",
    description: "For travellers who want Zanzibar at its most polished - private, high-end, detail-oriented.",
    match: { tags: ["luxury"] },
  },
  {
    key: "quiet-beaches",
    title: "Quiet Beaches",
    tagline: "Away from the crowds",
    description: "Beaches and beachfront stays picked for calm, low-crowd relaxation rather than nightlife.",
    match: { tags: ["quiet-private"], categories: ["beaches", "hotels"] },
  },
  {
    key: "eco-conscious",
    title: "Eco-Conscious Zanzibar",
    tagline: "Businesses doing right by the island",
    description: "Places with real eco or community-benefiting practices, not just a green label.",
    match: { tags: ["eco-certified"] },
  },
  {
    key: "stone-town-in-a-day",
    title: "Stone Town in One Day",
    tagline: "The old town, done right in a single visit",
    description: "Everything worth seeing, eating and doing in Stone Town if you only have one day there.",
    match: { areas: ["stone-town"] },
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
    if (match.categories && !match.categories.includes(item.category_key)) return false;
    if (match.areas && !match.areas.includes(item.area)) return false;
    return true;
  });
}
