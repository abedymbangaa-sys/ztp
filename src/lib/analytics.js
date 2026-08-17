// Ndogo, moja tu - kila CTA ya conversion (WhatsApp, Call, Directions,
// Ask Expert) inaita hii badala ya kutumia window.gtag moja kwa moja
// kila mahali. Haiathiri page_view tracking iliyopo tayari kwenye
// index.html - GA4 script yenyewe haibadilishwi hapa, hii ni wrapper
// tu ya "event" calls.
export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
