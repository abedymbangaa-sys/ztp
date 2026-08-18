import { MessageCircle, Phone, MapPin, Compass } from "lucide-react";
import { buildExpertLink } from "../lib/whatsapp";
import { buildDirectionsUrl } from "../lib/maps";
import { normalizePhone } from "../lib/phone";
import { trackEvent } from "../lib/analytics";

// Action area yenye buttons 4: Send Enquiry, Call, Get Directions,
// Ask Zanzibar Expert. Inatumika kwenye SectionDetail.jsx (juu ya title)
// na pia kama sticky bottom bar kwenye mobile (compact prop).
//
// "Send Enquiry" inafungua InquiryModal (fomu ya jina/watalii/budget/dates)
// ambayo tayari ipo SectionDetail.jsx - hii component haijengi wa.me link
// yake yenyewe kwa hilo, inaita tu onSendEnquiry() iliyopewa na parent.
// Hii inaepusha kuwa na WhatsApp button mbili tofauti kwenye page moja.
export default function ListingContactActions({ item, onSendEnquiry, compact = false }) {
  if (!item) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // Hatuna field tofauti ya "phone" kwenye listings kwa sasa - Call
  // inatumia namba hiyo hiyo ya WhatsApp (baada ya normalization).
  // Ukiongeza field ya phone baadaye, badilisha mstari huu kwenda
  // normalizePhone(item.phone).
  const ownerNumber = normalizePhone(item.whatsapp_number);
  const callHref = ownerNumber ? `tel:+${ownerNumber}` : null;

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
        <button
          type="button"
          onClick={() => {
            trackEvent("click_send_enquiry", eventData);
            onSendEnquiry?.();
          }}
          aria-label={`Send enquiry about ${item.title}`}
          className={primaryBtn}
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" /> Send Enquiry
        </button>

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
