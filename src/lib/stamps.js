// src/lib/stamps.js
//
// "Zanzibar Discovery Passport" stamp system — pure add-on on top of the
// EXISTING save mechanism (SavedListContext / "My Zanzibar"). Does not
// touch localStorage, does not touch save/unsave logic. It only maps a
// listing's existing category_key to a stamp label + color, so the
// already-saved list can be grouped and given identity.
//
// Hakuna logic ya "save" hapa — ni classification tu, hivyo haiwezi
// kuvunja chochote kilichopo.

export const STAMP_TYPES = {
  heritage: { label: "Heritage Stamp", color: "#2C4A7C", emoji: "🏛️" },
  beach: { label: "Beach Stamp", color: "#0E7C7B", emoji: "🏖️" },
  food: { label: "Food Stamp", color: "#C1690B", emoji: "🍽️" },
  nature: { label: "Nature Stamp", color: "#2F6B3A", emoji: "🌿" },
  local: { label: "Local Experience Stamp", color: "#6B2D5C", emoji: "✨" },
};

// Maps existing category_key values (see src/data/section-config.json,
// plus "hotels" and "tours" which aren't in that file) to a stamp.
const CATEGORY_KEY_TO_STAMP = {
  heritage: "heritage",
  beaches: "beach",
  restaurants: "food",
  nature: "nature",
  caves: "nature",
  attractions: "local",
  experiences: "local",
  tours: "local",
  hotels: "local",
};

export function getStamp(categoryKey) {
  const key = CATEGORY_KEY_TO_STAMP[categoryKey] || "local";
  return { key, ...STAMP_TYPES[key] };
}
