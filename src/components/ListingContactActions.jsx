import { MessageCircle, Phone, MapPin, Compass } from "lucide-react";
import { buildWhatsAppLink, buildExpertLink } from "../lib/whatsapp";
import { buildDirectionsUrl } from "../lib/maps";
import { normalizePhone } from "../lib/phone";
import { trackEvent } from "../lib/analytics";

// Action area yenye buttons 4: WhatsApp Owner, Call, Get Directions,
// Ask Zanzibar Expert. Inatumika kwenye SectionDetail.jsx (juu ya title)
// na pia kama sticky bottom bar kwenye mobile (compact prop).
//
// Haibashiri fields - inatumia item.whatsapp_number, item.title,
// item.location, item.maps_link tu (ndizo fields halisi zilizopo
// kwenye "listings" table kwa sasa, kama zinavyoonekana SectionDetail.jsx
// na hooks.js).
export default function ListingContactActions({ item, compact = false }) {
  if (!item) return null;

  // Some listings have whatsapp_number stored as a placeholder string
  // ("Null", "N/A", empty) instead of a real missing value - normalizePhone
  // catches that and returns null, so we never build a wa.me/Null link.
  const ownerNumber = normalizePhone(item.whatsapp_number);
  const hasOwnNumber = Boolean(ownerNumber);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const whatsappUrl = hasOwnNumber
    ? buildWhatsAppLink(item.title, item.location, ownerNumber)
    : null;

  // Hatuna field tofauti ya "phone" kwenye listings kwa sasa - Call
  // inatumia namba hiyo hiyo ya WhatsApp (baada ya normalization).
  // Ukiongeza field ya phone baadaye, badilisha mstari huu kwenda
  // normalizePhone(item.phone).
  const callHref = hasOwnNumber ? `tel:+${ownerNumber}` : null;

  const directionsUrl = buildDirectionsUrl(item);
  const expertUrl = buildExpertLink(item.title, item.location, currentUrl);

  const eventData = {
    listing_id: item.id,
    listing_name: item.title,
    listing_category: item.category_key,
    listing_location: item.location,
  };

  const baseBtn =
    "flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-full transition min-h-[44px] leading-tight text-center";
  const primaryBtn = `${baseBtn} bg-green-600 hover:bg-green-700 text-white`;
  const secondaryBtn = `${baseBtn} border border-slate-300 text-slate-700 hover:border-teal-600 hover:text-teal-700 bg-white`;
  const expertBtn = `${baseBtn} bg-amber-500 hover:bg-amber-600 text-white`;
  const disabledBtn = `${baseBtn} border border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50`;

  return (
    <div className={compact ? "" : "space-y-3"}>
      {!compact && (
        <p className="text-sm text-slate-500">
          Need availability, price or directions? Contact the business directly or ask a Zanzibar Expert.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp owner of ${item.title}`}
            className={primaryBtn}
            onClick={() => trackEvent("click_whatsapp_owner", eventData)}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" /> WhatsApp
          </a>
        ) : (
          <span className={disabledBtn} aria-label="Owner contact not available">
            <MessageCircle className="w-3.5 h-3.5 shrink-0" /> Not available
          </span>
        )}

        {callHref ? (
          <a
            href={callHref}
            aria-label={`Call owner of ${item.title}`}
            className={secondaryBtn}
            onClick={() => trackEvent("click_call_owner", eventData)}
          >
            <Phone className="w-3.5 h-3.5 shrink-0" /> Call
          </a>
        ) : (
          <span className={disabledBtn} aria-label="Phone not available">
            <Phone className="w-3.5 h-3.5 shrink-0" /> Not available
          </span>
        )}

        {directionsUrl ? (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${item.title}`}
            className={secondaryBtn}
            onClick={() => trackEvent("click_get_directions", eventData)}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" /> Directions
          </a>
        ) : (
          <span className={disabledBtn} aria-label="Location not available">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> Not available
          </span>
        )}

        <a
          href={expertUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ask Zanzibar Expert about ${item.title}`}
          className={expertBtn}
          onClick={() => trackEvent("click_ask_zanzibar_expert", eventData)}
        >
          <Compass className="w-3.5 h-3.5 shrink-0" /> Ask Expert
        </a>
      </div>
    </div>
  );
}
