// One place for the public brand name, so the site, the browser tab, Google
// and share previews all say the same thing as the domain
// (visitzanzibarparadise.com). Older pages may still contain the previous
// name "Zanzibar Paradise Tours"; normalizeBrand() converts it on the fly.
export const BRAND_NAME = "Visit Zanzibar Paradise";

export function normalizeBrand(text) {
  return typeof text === "string" ? text.replace(/Zanzibar Paradise Tours/g, BRAND_NAME) : text;
}
