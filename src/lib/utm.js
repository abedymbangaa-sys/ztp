const STORAGE_KEY = "ztp_utm";

// Fixes the attribution gap flagged from GA4: without this, a visitor who
// lands from a WhatsApp/Instagram campaign link but then clicks around
// before contacting a business loses that source by the time the lead
// (WhatsApp click, inquiry, etc) fires - GA4 only sees UTM params on the
// exact landing hit, not on later interactions.
//
// This captures utm_* params ONCE per session, on whichever page the
// visitor actually lands on, and keeps them in sessionStorage so every
// later trackEvent() call in this session can attach the true original
// source - not "(direct)".
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function captureUTMOnce() {
  if (typeof window === "undefined") return;
  try {
    // Already captured this session - first touch wins, don't overwrite
    // with "(direct)" just because a later page in the same visit has no
    // UTM params on its URL.
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm = {};
    let hasAny = false;
    UTM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
        hasAny = true;
      }
    });

    // Still record a landing page + referrer even with no UTM params, so
    // "direct" vs "organic search" vs "social referral" can be told apart
    // later instead of everything non-UTM looking identical.
    utm.landing_page = window.location.pathname;
    utm.referrer = document.referrer || null;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage unavailable (private mode, etc) - attribution is
    // best-effort, never blocks the visitor.
  }
}

export function getStoredUTM() {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
