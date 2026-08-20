// Namba ya jumla ya Wachu Digital Growth - kwa mawasiliano ya site nzima
// (navbar, hero "Uliza Sasa", advertise/jiunge) - SI kwa listings binafsi.
export const SITE_CONTACT_NUMBER = "255635442732";

// Kila listing inapaswa kuwa na whatsapp_number yake mwenyewe (namba ya
// biashara husika - hoteli, mgahawa, n.k). Function hii inatumia namba
// hiyo binafsi. Ikiwa listing haina namba bado, inarudisha null - kwa
// hali hiyo tunaonyesha "Namba bado haijawekwa" badala ya kumpigia mtu
// asiyehusika.
export function buildWhatsAppLink(businessName, location, businessNumber) {
  if (!businessNumber) return null;
  const message = encodeURIComponent(
    `Habari! Ninapenda kupata taarifa zaidi kuhusu ${businessName} (${location}). Je, mnaweza kunisaidia?`
  );
  return `https://wa.me/${businessNumber}?text=${message}`;
}

// Builds a rich WhatsApp inquiry message from the trip-details form
// (name, number of travelers, budget, dates, current area/hotel, notes)
// so the business - or Wachu Digital Growth, when the business has no
// number of its own yet - receives a useful, structured lead instead of
// a blank chat. Every line is optional except the listing name/location,
// so the message never shows "undefined" for a field the traveler left
// blank.
export function buildRichInquiryLink(businessNumber, itemTitle, itemLocation, details, isFallback) {
  if (!businessNumber) return null;
  const lines = [
    `Hello, I'm inquiring about *${itemTitle}*${itemLocation ? ` (${itemLocation})` : ""}.`,
  ];
  if (details.dates) lines.push(`My travel dates: ${details.dates}.`);
  if (details.travelers) lines.push(`Number of travelers: ${details.travelers}.`);
  if (details.area) lines.push(`Currently staying in/at: ${details.area}.`);
  lines.push(`Could you tell me the availability, price and more details?`);
  lines.push(``, `Name: ${details.name}`);
  if (details.budget) lines.push(`Budget: ${details.budget}`);
  if (details.notes) lines.push(`Notes: ${details.notes}`);
  if (isFallback) {
    lines.push(``, `(This listing doesn't have its own WhatsApp number yet - please help connect me with them, or let me know if you can assist directly.)`);
  }
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// "Build My Zanzibar Trip" teaser - a lightweight 3-question flow on the
// homepage (dates, budget, interests) that turns into a single prefilled
// WhatsApp message to the Zanzibar Expert line. This is intentionally NOT
// a full itinerary-generation engine - it just removes the back-and-forth
// of a blank chat, matching the message format Wachu Digital Growth uses
// for its "Ask Expert" concierge line.
export function buildTripBuilderLink({ dates, area, travelers, budget, interests }) {
  const lines = [
    `Habari, nipo Zanzibar${dates ? ` ${dates}` : ""}${area ? `, niko ${area}` : ""}, watu ${travelers || "?"}, budget ${budget || "?"}${interests ? `, napenda ${interests}` : ""}.`,
    `Naomba itinerary na options zilizothibitishwa.`,
  ];
  return `https://wa.me/${SITE_CONTACT_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
// "Ask Zanzibar Expert" - inatumika kutoka listing detail page (na
// baadaye listing cards) kumpeleka visitor kwa Wachu Digital Growth
// moja kwa moja, si kwa biashara husika. Inatumia SITE_CONTACT_NUMBER
// hapo juu - namba moja tu, centralized, kama ilivyopo kwa CTA zingine
// za site nzima.
export function buildExpertLink(itemTitle, itemLocation, pageUrl) {
  const lines = [
    `Habari Zanzibar Expert, naomba msaada kuchagua hoteli, tour au experience Zanzibar.`,
    ``,
    `Listing: ${itemTitle}${itemLocation ? ` (${itemLocation})` : ""}`,
  ];
  if (pageUrl) lines.push(`Page: ${pageUrl}`);
  return `https://wa.me/${SITE_CONTACT_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
