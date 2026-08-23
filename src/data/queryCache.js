// Shared stale-while-revalidate cache, backed by sessionStorage + an
// in-memory layer on top (so repeated reads in the same tick don't even
// hit sessionStorage). This is the single highest-impact fix for the
// "every page shows a skeleton, even pages you just visited" complaint -
// TripAdvisor/Booking.com don't refetch from scratch on every navigation;
// they show what they already have instantly and quietly refresh behind
// it. Nothing here is per-user or sensitive - it's the same public
// directory data every visitor sees.
const memoryCache = new Map();
const PREFIX = "ztp_cache:";

// How long cached data is considered "fresh enough to skip refetching
// entirely". Short enough that an admin's edit shows up within a couple
// minutes without the visitor needing a hard refresh; long enough that
// clicking Hotels -> a listing -> back to Hotels never shows a skeleton
// for data that's still obviously current.
const FRESH_MS = 2 * 60 * 1000;

export function getCacheEntry(key) {
  const mem = memoryCache.get(key);
  if (mem) return mem;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function setCacheEntry(key, data) {
  const entry = { data, ts: Date.now() };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // sessionStorage full/unavailable - the in-memory layer still works
    // for the rest of this page's lifetime, just won't survive a reload.
  }
}

export function isFresh(entry) {
  return Boolean(entry) && Date.now() - entry.ts < FRESH_MS;
}
