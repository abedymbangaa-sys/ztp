// src/lib/stamps.js
//
// "Zanzibar Discovery Passport" stamp system.
//
// A listing can earn MORE THAN ONE stamp (e.g. a beachfront hotel earns
// Beach Stamp + Local Experience Stamp). Mapping is based on the
// listing's existing category_key and tags fields - no schema change,
// no change to save/unsave logic.

export const STAMP_TYPES = {
  heritage: {
    label: "Heritage Stamp",
    color: "#2C4A7C",
    description: "Stone Town streets, forts and cultural heritage sites.",
    zeroCopy: "Discover your first Stone Town heritage site",
    route: "/heritage",
  },
  beach: {
    label: "Beach Stamp",
    color: "#0E7C7B",
    description: "Beaches and beachfront places around the island.",
    zeroCopy: "Discover your first Zanzibar beach",
    route: "/beaches",
  },
  food: {
    label: "Food Stamp",
    color: "#C1690B",
    description: "Restaurants, food markets and local food experiences.",
    zeroCopy: "Discover your first Zanzibar food spot",
    route: "/restaurants",
  },
  nature: {
    label: "Nature Stamp",
    color: "#2F6B3A",
    description: "Forests, mangroves and Zanzibar wildlife.",
    zeroCopy: "Discover your first nature experience",
    route: "/nature",
  },
  local: {
    label: "Local Experience Stamp",
    color: "#6B2D5C",
    description: "Local culture, dhows, tours and community experiences.",
    zeroCopy: "Discover your first local experience",
    route: "/experiences",
  },
};

// Base stamp(s) a listing earns from its directory category.
const CATEGORY_TO_STAMPS = {
  heritage: ["heritage"],
  beaches: ["beach"],
  restaurants: ["food"],
  nature: ["nature"],
  caves: ["nature"],
  attractions: ["local"],
  experiences: ["local"],
  tours: ["local"],
  hotels: ["local"],
};

// Extra stamp(s) a listing earns from its tags (src/lib/tags.js), on top
// of whatever its category already grants. This is how a beachfront hotel
// (category "hotels" -> Local Experience) also earns Beach Stamp.
const TAG_TO_STAMPS = {
  beachfront: ["beach"],
  "eco-certified": ["nature"],
};

/**
 * Returns every stamp a listing qualifies for, as an array of
 * { key, label, color, description, zeroCopy, route }.
 * Never invents a stamp the listing doesn't actually match.
 */
export function getStamps(item) {
  if (!item) return [];
  const keys = new Set(CATEGORY_TO_STAMPS[item.category_key] || []);
  (item.tags || []).forEach((tag) => {
    (TAG_TO_STAMPS[tag] || []).forEach((key) => keys.add(key));
  });
  return Array.from(keys).map((key) => ({ key, ...STAMP_TYPES[key] }));
}
