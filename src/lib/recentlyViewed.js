// Tracks the last few listings a visitor opened, stored on their own device
// (localStorage) - no account needed. This is what lets "Recently Viewed"
// bring someone back to a listing they were considering, instead of them
// having to search for it again or losing it entirely.
const STORAGE_KEY = "ztp_recently_viewed";
const MAX_ITEMS = 10;

export function recordView(listingId, categoryKey) {
  if (!listingId || typeof window === "undefined") return;
  try {
    const current = getRecentlyViewed();
    const withoutThis = current.filter((entry) => entry.id !== listingId);
    const updated = [{ id: listingId, category_key: categoryKey, viewedAt: Date.now() }, ...withoutThis].slice(
      0,
      MAX_ITEMS
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage can fail (private browsing, quota) - never block the page for this
  }
}

export function getRecentlyViewed() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
