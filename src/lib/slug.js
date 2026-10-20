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

// ---------------------------------------------------------------------------
// Listing URLs: /hotels/canary-nungwi-hotel-spa-<full-uuid>
//
// The readable part puts the words people actually search for ("canary
// nungwi hotel spa") into the URL, while the real listing id stays at the
// END so no database change is needed and every lookup (useListing,
// reviews, inquiries) keeps working off the same id as before.
// OLD links (/hotels/<uuid> with no words) still resolve - extractListingId()
// just returns the uuid unchanged - and SectionDetail redirects them to the
// new URL, while the prerendered legacy page points its canonical tag at
// the new URL so Google consolidates both into one.
// ---------------------------------------------------------------------------
const UUID_AT_END = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pulls the listing id out of a URL segment, whether it is the new
// "words-<uuid>" form or the old bare "<uuid>" form.
export function extractListingId(param) {
  const value = String(param || "");
  const match = value.match(UUID_AT_END);
  return match ? match[0] : value;
}

// Just the last URL segment: "canary-nungwi-hotel-spa-<uuid>".
export function listingSlug(item) {
  const words = slugify(item?.title).slice(0, 60).replace(/-$/, "");
  return words ? `${words}-${item.id}` : String(item?.id ?? "");
}

// Full app path for a listing, e.g. "/hotels/canary-nungwi-hotel-spa-<uuid>".
// categoryKey is optional - falls back to the item's own category_key.
export function listingPath(item, categoryKey) {
  return `/${categoryKey || item?.category_key}/${listingSlug(item)}`;
}
