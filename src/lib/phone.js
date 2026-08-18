// Normalizes a Tanzanian phone number into the digits-only format used by
// wa.me/tel: links (e.g. "255777123456"), or returns null if the value is
// missing, a placeholder string, or too short/long to be a real number.
//
// This is the fix for the "https://wa.me/Null" bug: some listings have
// whatsapp_number stored as the literal text "Null" (or "N/A", empty
// string, etc.) instead of a real missing value, so a simple
// `if (!businessNumber)` check wasn't catching it - "Null" is a truthy
// string. Every place that builds a WhatsApp/tel link must go through
// this function first.
//
// Handles the formats seen in the listings data:
//   "0777123456"      -> "255777123456"
//   "777123456"       -> "255777123456"
//   "+255777123456"   -> "255777123456"
//   "255777123456"    -> "255777123456"
//   "Null" / "" / null / undefined / "N/A" / "-" -> null
export function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null;

  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Placeholder values that sometimes end up stored as literal text
  // instead of an actually-empty field.
  if (/^(null|undefined|n\/?a|none|-+|0+)$/i.test(trimmed)) return null;

  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = `255${normalized.slice(1)}`;
  } else if (normalized.length === 9) {
    normalized = `255${normalized}`;
  }

  // A real Tanzanian mobile number in "255XXXXXXXXX" form is 12 digits.
  // Anything clearly outside a sane range is treated as invalid rather
  // than risking a broken wa.me/tel: link.
  if (normalized.length < 11 || normalized.length > 13) return null;

  return normalized;
}
