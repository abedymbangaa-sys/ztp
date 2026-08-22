// Ndogo, moja tu - kila CTA ya conversion (WhatsApp, Call, Directions,
// Ask Expert) inaita hii badala ya kutumia window.gtag moja kwa moja
// kila mahali. Haiathiri page_view tracking iliyopo tayari kwenye
// index.html - GA4 script yenyewe haibadilishwi hapa, hii ni wrapper
// tu ya "event" calls.

// Same public URL/key already used in lib/supabase.js - duplicated here
// (not imported from the shared client) so this file can send a raw
// `fetch` with `keepalive: true` instead of going through supabase-js.
// This matters specifically for WhatsApp/tel/maps buttons: tapping one
// hands off to another app almost instantly on mobile, which can abort
// an in-flight request before it reaches the server. `keepalive: true`
// tells the browser to finish sending the request even if the page is
// being unloaded or backgrounded - a normal supabase-js call has no way
// to opt into that.
const SUPABASE_URL = "https://phctpwswosfwjmxhidyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HEy4rqVBXuH_qRBHEwYSdg_wW-677OT";

// Events that represent a real lead/conversion signal worth counting per
// listing in the Admin Dashboard's Leads tab - kept as an allowlist so
// unrelated future trackEvent() calls (e.g. UI toggles) don't pollute the
// leads table.
const LEAD_EVENT_TYPES = new Set([
  "click_send_enquiry",
  "click_call_owner",
  "click_get_directions",
  "click_ask_zanzibar_expert",
]);

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  // Best-effort mirror into Supabase so lead volume per listing is
  // visible inside the Admin Dashboard, not just Google Analytics.
  // Fire-and-forget: never blocks or throws for the visitor if this fails.
  if (LEAD_EVENT_TYPES.has(eventName) && params.listing_id) {
    try {
      fetch(`${SUPABASE_URL}/rest/v1/lead_events`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          event_type: eventName,
          listing_id: params.listing_id,
          listing_title: params.listing_name || null,
          listing_category: params.listing_category || null,
        }),
      }).catch(() => {});
    } catch {
      // Never let a tracking failure break the visitor's tap.
    }
  }
}
