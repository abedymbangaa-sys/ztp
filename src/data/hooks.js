import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// Load active categories from Supabase (live - admin can add new ones anytime)
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (mounted) {
          setCategories(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading };
}

// Load approved listings, optionally filtered by category.
// Featured (paid/sponsored) listings are pinned to the top.
export function useListings(categoryKey) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    let query = supabase.from("listings").select("*").eq("status", "approved");
    if (categoryKey) {
      query = query.eq("category_key", categoryKey);
    }
    query
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (mounted) {
          setListings(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [categoryKey]);

  return { listings, loading };
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

// Load a single listing by id
export function useListing(id) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("listings")
      .select("*, partners(business_name, email)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (mounted) {
          setListing(data || null);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  return { listing, loading };
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
      .eq("category_key", categoryKey)
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
