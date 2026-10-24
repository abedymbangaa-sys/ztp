import { MessageCircle, MapPin } from "lucide-react";
import { buildDirectionsUrl } from "../lib/maps";
import { trackEvent } from "../lib/analytics";

// Action area yenye buttons 2: Send Enquiry na Get Directions.
// Inatumika kwenye SectionDetail.jsx (juu ya title). (Call, Ask Expert na
// sticky bottom bar ziliondolewa kwa ombi la mmiliki.)
//
// "Send Enquiry" inafungua InquiryModal (fomu ya jina/watalii/budget/dates)
// ambayo tayari ipo SectionDetail.jsx - hii component haijengi wa.me link
// yake yenyewe kwa hilo, inaita tu onSendEnquiry() iliyopewa na parent.
// Hii inaepusha kuwa na WhatsApp button mbili tofauti kwenye page moja.
export default function ListingContactActions({ item, onSendEnquiry, compact = false }) {
  if (!item) return null;

  const directionsUrl = buildDirectionsUrl(item);

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
  const disabledBtn = `${baseBtn} border border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50`;

  return (
    <div className={compact ? "" : "space-y-3"}>
      {!compact && (
        <p className="text-sm text-slate-500">
          Need availability, price or directions? Contact the business directly.
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

      </div>
    </div>
  );
}
