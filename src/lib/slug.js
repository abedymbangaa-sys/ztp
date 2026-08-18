// Simple, dependency-free slugify - lowercases, strips punctuation,
// collapses whitespace/dashes. Used to build clean itinerary URLs like
// /itinerary/5-days-in-zanzibar directly from a guide's `title`, so we
// don't need to add a `slug` column to itinerary_guides in Supabase.
// Used both client-side (ItineraryDetail.jsx) and in scripts/prerender.mjs
// so the two always agree on the same URL for the same guide.
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
