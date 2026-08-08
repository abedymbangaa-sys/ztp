// Central list of Zanzibar areas for the public "Location" filter.
// We match against the free-text `location` field on each listing using a
// simple case-insensitive "contains" check, so this works even though the
// underlying location text isn't perfectly standardized (e.g. "Stone Town,
// Zanzibar" and "Historical Site – Stone Town" both match "Stone Town").
export const LOCATION_OPTIONS = [
  { key: "stone-town", label: "Stone Town", match: "stone town" },
  { key: "nungwi", label: "Nungwi", match: "nungwi" },
  { key: "kendwa", label: "Kendwa", match: "kendwa" },
  { key: "paje", label: "Paje", match: "paje" },
  { key: "jambiani", label: "Jambiani", match: "jambiani" },
  { key: "bwejuu", label: "Bwejuu", match: "bwejuu" },
  { key: "matemwe", label: "Matemwe", match: "matemwe" },
  { key: "kizimkazi", label: "Kizimkazi", match: "kizimkazi" },
  { key: "michamvi", label: "Michamvi", match: "michamvi" },
  { key: "fumba", label: "Fumba", match: "fumba" },
  { key: "pemba", label: "Pemba", match: "pemba" },
];

// Returns true if a listing's location text belongs to the given area key.
export function locationMatches(listingLocation, areaKey) {
  const opt = LOCATION_OPTIONS.find((o) => o.key === areaKey);
  if (!opt) return true;
  return (listingLocation || "").toLowerCase().includes(opt.match);
}
