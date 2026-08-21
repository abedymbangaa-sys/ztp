// Ndogo, moja tu - kila CTA ya conversion (WhatsApp, Call, Directions,
// Ask Expert) inaita hii badala ya kutumia window.gtag moja kwa moja
// kila mahali. Haiathiri page_view tracking iliyopo tayari kwenye
// index.html - GA4 script yenyewe haibadilishwi hapa, hii ni wrapper
// tu ya "event" calls.
import { supabase } from "./supabase";

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
    supabase
      .from("lead_events")
      .insert({
        event_type: eventName,
        listing_id: params.listing_id,
        listing_title: params.listing_name || null,
        listing_category: params.listing_category || null,
      })
      .then(() => {})
      .catch(() => {});
  }
}
