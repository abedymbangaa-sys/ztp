import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getCacheEntry, setCacheEntry, isFresh } from "./queryCache";

// Shared timeout so a hung Supabase request (dead connection, cold serverless
// function, flaky mobile network) can't leave a page stuck on "loading"
// forever. Any request that takes longer than this is treated as failed.
const FETCH_TIMEOUT_MS = 9000;

function withTimeout(promise) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS)
  );
  return Promise.race([promise, timeoutPromise]);
}

// Reads the data scripts/prerender.mjs already embedded in THIS exact
// page's static HTML (window.__ZTP_PRELOAD__). Without this, the first
// thing a detail page does on mount is throw away the real, readable
// content that was just sitting in the HTML and show an empty grey
// skeleton while it re-fetches the SAME data from Supabase over the
// network. A search engine crawler (or anyone on a slow connection)
// evaluating the page during that gap sees a blank page - which is how a
// perfectly good listing ends up flagged as thin/soft-404. Used only to
// avoid that initial blank flash; the hook still refetches in the
// background afterwards so the data stays current.
function readPreload(type, match) {
  if (typeof window === "undefined") return undefined;
  const preload = window.__ZTP_PRELOAD__;
  if (!preload || preload.type !== type) return undefined;
  if (match && !match(preload)) return undefined;
  return preload.data;
}

// Load active categories from Supabase (live - admin can add new ones anytime).
// Exposes `error` and `retry` so pages relying on categories (page title,
// icon, tag label) don't silently render blank forever if the request fails.
//
// Cached per session (see queryCache.js) - after the first successful
// load this tab/session, every later mount of this hook shows the cached
// categories INSTANTLY (no skeleton at all), refetching quietly in the
// background only once the cache is more than a couple minutes old.
const CATEGORIES_CACHE_KEY = "categories";

export function useCategories() {
  const cachedEntry = getCacheEntry(CATEGORIES_CACHE_KEY);
  const [categories, setCategories] = useState(cachedEntry?.data || []);
  const [loading, setLoading] = useState(!cachedEntry);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const entry = getCacheEntry(CATEGORIES_CACHE_KEY);
    if (entry) {
      setCategories(entry.data);
      setLoading(false);
      setError(null);
      // Fresh enough - skip the network call entirely rather than
      // refetching data we just showed a moment ago.
      if (isFresh(entry) && refreshKey === 0) return;
    } else {
      setLoading(true);
      setError(null);
    }

    withTimeout(
      supabase.from("categories").select("*").eq("is_active", true).order("created_at", { ascending: true })
    )
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        const rows = data || [];
        setCacheEntry(CATEGORIES_CACHE_KEY, rows);
        setCategories(rows);
        setLoading(false);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("useCategories: failed to load", err);
        if (!mounted) return;
        // Had cached data already showing - a failed background refresh
        // shouldn't wipe out a perfectly good, already-visible list.
        if (!entry) {
          setError("Unable to load categories right now.");
          setCategories([]);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return { categories, loading, error, retry: () => setRefreshKey((k) => k + 1) };
}

// Load approved listings, optionally filtered by category.
// Featured (paid/sponsored) listings are pinned to the top.
// Has a hard timeout + error state so a hung request (dead connection, cold
// serverless function, flaky mobile network) can't leave the page stuck on
// "Loading..." forever - it resolves to an error with a retry button instead.
//
// Also cached per session (see queryCache.js) - this is the hook behind
// Hotels, Things to Do, Tours and every other category listing page, plus
// Area pages and Collections. Once any of those has loaded once this
// session, revisiting shows the same listings INSTANTLY - no skeleton,
// no wait - while a fresh copy loads quietly behind it if the cache has
// gone stale (>2 min old).
export function useListings(categoryKey) {
  const cacheKey = `listings:${categoryKey || "all"}`;
  const cachedEntry = getCacheEntry(cacheKey);
  const preloaded = cachedEntry
    ? undefined
    : readPreload("listings", (p) => p.categoryKey === categoryKey);
  const [listings, setListings] = useState(cachedEntry?.data || preloaded || []);
  const [loading, setLoading] = useState(!cachedEntry && !preloaded);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const entry = getCacheEntry(cacheKey);
    const preload = entry ? undefined : readPreload("listings", (p) => p.categoryKey === categoryKey);
    if (entry) {
      setListings(entry.data);
      setLoading(false);
      setError(null);
      if (isFresh(entry) && refreshKey === 0) return;
    } else if (preload) {
      // Same category page this data was prerendered for - show the real
      // list immediately instead of a skeleton grid, then quietly refetch.
      setListings(preload);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    let query = supabase.from("listings").select("*").eq("status", "approved");
    if (categoryKey) {
      // ilike (case-insensitive exact match, no wildcards in categoryKey)
      // instead of eq() - guards against a listing whose category_key was
      // saved with different casing ("Hotels" vs "hotels") silently
      // returning zero rows with no error, which looks identical to "no
      // listings" from the UI's point of view.
      query = query.ilike("category_key", categoryKey);
    }

    withTimeout(query.order("created_at", { ascending: false }))
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        const rows = data || [];

        // Attach a lightweight rating/review-count summary to each card so
        // listing grids can show trust signals (e.g. "4.8 (12)") without a
        // separate request per card. Best-effort: if this secondary query
        // fails, listings still render fine, just without the badge.
        if (rows.length > 0) {
          try {
            const ids = rows.map((r) => r.id);
            const { data: reviewRows } = await withTimeout(
              supabase.from("reviews").select("listing_id, rating").eq("status", "approved").in("listing_id", ids)
            );
            const statsByListing = {};
            (reviewRows || []).forEach((r) => {
              const s = (statsByListing[r.listing_id] ||= { total: 0, count: 0 });
              s.total += r.rating;
              s.count += 1;
            });
            rows.forEach((row) => {
              const s = statsByListing[row.id];
              row.review_avg = s ? Number((s.total / s.count).toFixed(1)) : null;
              row.review_count = s ? s.count : 0;
            });
          } catch (statsErr) {
            if (import.meta.env.DEV) console.error("useListings: failed to load review stats", statsErr);
          }
        }

        setCacheEntry(cacheKey, rows);
        setListings(rows);
        setLoading(false);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("useListings: failed to load", err);
        if (!mounted) return;
        // A background refresh failing shouldn't blank out listings that
        // were already showing fine from cache or the prerendered page.
        if (!entry && !preload) {
          setError("Unable to load listings right now.");
          setListings([]);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [categoryKey, refreshKey]);

  return { listings, loading, error, retry: () => setRefreshKey((k) => k + 1) };
}

// Load approved listings currently marked as a "deal" (is_deal = true),
// for the homepage "Special Deals" section.
export function useDeals(limit = 6) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .eq("is_deal", true)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (mounted) {
          setDeals(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { deals, loading };
}

// ── Advertisements (paid) ────────────────────────────────────────────────
// Completely separate from `listings`. A business can be listed for free in
// the normal directory (hotels/tours/etc) AND, if they choose, pay to also
// appear in the dedicated "Advertise" spotlight. Listings themselves are
// never reordered or badged because of this - it lives in its own table.
export function useAdvertisements(limit = 12) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("advertisements")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit * 2) // fetch extra since some may have lapsed
      .then(({ data }) => {
        if (mounted) {
          const now = Date.now();
          const active = (data || []).filter(
            (ad) => !ad.active_until || new Date(ad.active_until).getTime() > now
          );
          setAds(active.slice(0, limit));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { ads, loading };
}

// ── Site settings (editable prices, etc.) ────────────────────────────────
// Backed by a simple key/value `settings` table so the admin can change
// things like the ad price from the dashboard, without needing a code
// change + redeploy every time.
const SETTINGS_DEFAULTS = {
  ad_price_usd: "15",
};

export function useSettings() {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("settings")
      .select("*")
      .then(({ data }) => {
        if (mounted) {
          const map = { ...SETTINGS_DEFAULTS };
          (data || []).forEach((row) => {
            map[row.key] = row.value;
          });
          setSettings(map);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
}

// Load a single listing by id.
//
// Now also exposes `error` and `retry`, used by SectionDetail.jsx to show
// a proper error/retry state instead of getting stuck showing "Loading"
// (or silently falling through to "Not Found") when the request itself
// fails (network issue, Supabase down, etc.) rather than the listing
// genuinely not existing.
export function useListing(id) {
  const cacheKey = `listing:${id}`;
  const cachedEntry = getCacheEntry(cacheKey);
  const preloaded = cachedEntry ? undefined : readPreload("listing", (p) => p.id === id);
  const initialListing = cachedEntry?.data ?? preloaded ?? null;
  const [listing, setListing] = useState(initialListing);
  const [loading, setLoading] = useState(!initialListing);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const entry = getCacheEntry(cacheKey);
    const preload = entry ? undefined : readPreload("listing", (p) => p.id === id);
    if (entry) {
      setListing(entry.data);
      setLoading(false);
      setError(null);
      if (isFresh(entry) && refreshKey === 0) return;
    } else if (preload) {
      // Nothing cached yet, but this is the exact page the listing was
      // prerendered for - show it immediately instead of a skeleton, then
      // fall through to the fetch below to quietly confirm/refresh it.
      setListing(preload);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    withTimeout(
      supabase
        .from("listings")
        .select("*, partners(business_name, email)")
        .eq("id", id)
        .single()
    )
      .then(({ data, error }) => {
        if (!mounted) return;
        // PGRST116 = "no rows returned" from .single() - that's a genuine
        // "this listing doesn't exist", not a failure, so we treat it the
        // same as before (listing stays null, no error state shown).
        if (error && error.code !== "PGRST116") {
          // A background refresh failing shouldn't blank out a listing
          // that's already showing fine from cache or the prerendered page.
          if (!entry && !preload) {
            setError(error);
            setListing(null);
          }
        } else {
          setCacheEntry(cacheKey, data || null);
          setListing(data || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        // Timeout (or any other rejection outside the normal Supabase
        // {data,error} shape) lands here - surfaced as the same error
        // state so the retry button always appears within ~9s instead of
        // the skeleton spinning forever on a hung connection, UNLESS we
        // already have cached/prerendered data to keep showing.
        if (!mounted) return;
        if (!entry && !preload) {
          setError(err);
          setListing(null);
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, refreshKey]);

  function retry() {
    setRefreshKey((k) => k + 1);
  }

  return { listing, loading, error, retry };
}

// Load a handful of other approved listings in the same category, for the
// "You might also like" section on a listing's detail page.
export function useAdvertisement(id) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("advertisements")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (mounted) {
          setAd(data || null);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  return { ad, loading };
}

export function useRelatedListings(categoryKey, excludeId, limit = 4) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!categoryKey || !excludeId) {
      setRelated([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .ilike("category_key", categoryKey)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (mounted) {
          setRelated(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [categoryKey, excludeId, limit]);

  return { related, loading };
}

// Lightweight rating/count summary for a single listing, used by the
// "At a glance" card. Reads the same `reviews` table ReviewsSection
// already queries, but only the `rating` column and only approved
// reviews, so this stays a cheap, separate read rather than plumbing
// state out of ReviewsSection itself.
export function useListingRatingSummary(listingId) {
  const [summary, setSummary] = useState({ average: null, count: 0, loading: true });

  useEffect(() => {
    let mounted = true;
    if (!listingId) {
      setSummary({ average: null, count: 0, loading: false });
      return;
    }
    supabase
      .from("reviews")
      .select("rating")
      .eq("listing_id", listingId)
      .eq("status", "approved")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data || data.length === 0) {
          setSummary({ average: null, count: 0, loading: false });
          return;
        }
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setSummary({ average: Number(avg.toFixed(1)), count: data.length, loading: false });
      });
    return () => {
      mounted = false;
    };
  }, [listingId]);

  return summary;
}
