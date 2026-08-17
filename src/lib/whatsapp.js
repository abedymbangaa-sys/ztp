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
// (name, number of travelers, budget, dates, notes) so the business -
// or Wachu Digital Growth, when the business has no number of its own
// yet - receives a useful, structured lead instead of a blank chat.
export function buildRichInquiryLink(businessNumber, itemTitle, itemLocation, details, isFallback) {
  if (!businessNumber) return null;
  const lines = [
    `Habari! I found *${itemTitle}* (${itemLocation}) on Zanzibar Paradise Tours.`,
    ``,
    `Name: ${details.name}`,
    `Travelers: ${details.travelers}`,
    `Budget: ${details.budget}`,
  ];
  if (details.dates) lines.push(`Dates: ${details.dates}`);
  if (details.notes) lines.push(`Notes: ${details.notes}`);
  if (isFallback) {
    lines.push(``, `(This listing doesn't have its own WhatsApp number yet - please help connect me with them, or let me know if you can assist directly.)`);
  } else {
    lines.push(``, `Could you tell me more / check availability?`);
  }
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
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
