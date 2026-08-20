import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useListing, useCategories } from "../data/hooks";
import { buildRichInquiryLink, SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { normalizePhone } from "../lib/phone";
import { sendNotificationEmail } from "../lib/email";
import { supabase } from "../lib/supabase";
import { SectionIcon } from "../lib/icons";
import { formatLocation } from "../lib/locations";
import { buildDirectionsUrl } from "../lib/maps";
import { MapPin, ExternalLink, ShieldCheck, BadgeCheck, CloudRain, RefreshCw, AlertTriangle } from "lucide-react";
import ReviewsSection from "../components/ReviewsSection";
import RelatedListings from "../components/RelatedListings";
import PhotoGallery from "../components/PhotoGallery";
import InquiryModal from "../components/InquiryModal";
import ClaimListingModal from "../components/ClaimListingModal";
import VerificationPanel from "../components/VerificationPanel";
import ListingContactActions from "../components/ListingContactActions";
import { useT } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { MessageCircle as WA, Compass } from "lucide-react";
import { buildExpertLink } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";

export default function SectionDetail() {
  const { sectionKey, id } = useParams();
  const { categories } = useCategories();
  const { listing: item, loading, error, retry } = useListing(id);
  const config = categories.find((c) => c.key === sectionKey);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimDefaultType, setClaimDefaultType] = useState("claim");
  const { language } = useLanguage();
  const t = useT();

  if (loading) {
    return <SectionDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t("Something went wrong")}</h1>
        <p className="text-slate-500 mb-6">
          {t("We couldn't load this listing. Please check your connection and try again.")}
        </p>
        <button
          onClick={retry}
          className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2.5 rounded-full"
        >
          <RefreshCw className="w-4 h-4" /> {t("Try Again")}
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Not Found</h1>
        <Link to={`/${sectionKey}`} className="text-teal-700 font-semibold hover:underline">
          ← Go Back
        </Link>
      </div>
    );
  }

  // Normalized once here and reused everywhere on the page (sticky bar,
  // action buttons, and the rich-inquiry WhatsApp fallback below) so a
  // placeholder value like "Null" or "N/A" in whatsapp_number can never
  // produce a broken wa.me/Null link or a bogus rich-inquiry target.
  const ownerNumber = normalizePhone(item.whatsapp_number);
  const hasOwnNumber = Boolean(ownerNumber);
  // Same URL the "Get Directions" button in ListingContactActions uses
  // (maps_link if the admin set one, otherwise a Maps search built from
  // the location text) - reused here for the small "View on map" link
  // right next to the location line.
  const directionsUrl = buildDirectionsUrl(item);

  async function handleInquirySubmit(details) {
    try {
      await supabase.from("inquiries").insert({
        hotel_id: item.id,
        hotel_name: item.title,
        location: item.location,
        traveler_name: details.name,
        travelers_count: details.travelers,
        budget: details.budget,
        travel_dates: details.dates,
        notes: details.notes,
        used_fallback_number: !hasOwnNumber,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Could not log inquiry", err);
    }

    // Notify the business owner by email too, in case they miss the WhatsApp
    // message - only works for listings owned by a registered partner with
    // an email on file. Never blocks the WhatsApp flow if it fails.
    if (item.partners?.email) {
      try {
        await sendNotificationEmail({
          toEmail: item.partners.email,
          toName: item.partners.business_name || item.title,
          subject: `New Inquiry for "${item.title}"`,
          message: `Hello ${item.partners.business_name || ""}, you have a new inquiry on Zanzibar Paradise Tours for "${item.title}".\n\nFrom: ${details.name || "N/A"}\nTravelers: ${details.travelers || "N/A"}\nBudget: ${details.budget || "N/A"}\nDates: ${details.dates || "N/A"}\nNotes: ${details.notes || "N/A"}\n\nReply directly on WhatsApp to follow up.`,
        });
      } catch (err) {
        console.error("Could not send owner notification email", err);
      }
    }

    const targetNumber = hasOwnNumber ? ownerNumber : SITE_CONTACT_NUMBER;
    const link = buildRichInquiryLink(targetNumber, item.title, item.location, details, !hasOwnNumber);
    if (link) window.open(link, "_blank");
    setInquiryOpen(false);
  }

  return (
    <div>
      <PhotoGallery coverImage={item.image_url} galleryImages={item.gallery_images} listingName={item.title} />

      {/* Sticky bottom action bar - mobile only. Quick access to the two
          highest-intent actions without scrolling back up. Hidden on
          desktop (lg:hidden) since the sidebar card already covers this. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <ListingContactActionsCompactBar item={item} onSendEnquiry={() => setInquiryOpen(true)} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 pb-28 lg:pb-10">
        <Link to={`/${sectionKey}`} className="text-sm text-teal-700 font-semibold hover:underline">
          ← {t("Back to")} {config?.title || sectionKey}
        </Link>

        <div className="mt-4 mb-6">
          <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            <SectionIcon sectionKey={sectionKey} className="w-3.5 h-3.5" />
            {config?.tag || ""}
          </span>
          {/* Name wraps under itself on narrow screens instead of the
              Verified badge fighting it for space on one line - each gets
              its own row below ~380px wide (e.g. "Jabali Bungalows Lodge"). */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-snug sm:leading-tight break-words flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span>{item.title}</span>
            {item.is_verified && (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full align-middle">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </h1>
          {item.location && (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <p className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 shrink-0" /> {formatLocation(item.location)}
              </p>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 text-sm font-semibold hover:underline"
                >
                  {t("View on map")}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Conversion action area - WhatsApp Owner / Call / Get Directions /
            Ask Zanzibar Expert. Sits right under the title/location, near
            the top of the page, as its own compact card. */}
        <div className="mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <ListingContactActions item={item} onSendEnquiry={() => setInquiryOpen(true)} />
        </div>

        {/* Two-column layout: main story on the left, a compact info card
            pinned on the right so contact/location details stay in view
            while reading - the page no longer feels like one long stack of
            full-width blocks. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {(() => {
              const translated = language !== "en" ? item[`description_${language}`] : null;
              return (
                <>
                  <p className="text-slate-700 text-lg leading-relaxed">{translated || item.description}</p>
                  {translated && (
                    <p className="text-xs text-slate-400 mt-1">
                      Automatically shown in {language === "it" ? "Italian" : "German"}. Original description is in
                      English.
                    </p>
                  )}
                </>
              );
            })()}

            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setClaimDefaultType("claim");
                  setClaimOpen(true);
                }}
                className="text-xs text-slate-400 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {t("Own this business? Claim, edit or request removal")}
              </button>
            </div>

            <ReviewsSection listingId={item.id} />
          </div>

          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
            <VerificationPanel
              item={item}
              onReportIssue={() => {
                setClaimDefaultType("edit_request");
                setClaimOpen(true);
              }}
            />

            {(item.weather_policy || item.maps_link) && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                {item.weather_policy && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex gap-3">
                    <CloudRain className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">{t("Weather / Cancellation Policy")}</p>
                      <p className="text-sm text-slate-600">{item.weather_policy}</p>
                    </div>
                  </div>
                )}

                {item.maps_link && (
                  <a
                    href={item.maps_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-teal-700 font-semibold hover:underline text-sm pt-1"
                  >
                    <MapPin className="w-4 h-4" /> {t("View on Google Maps")}{" "}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <RelatedListings categoryKey={sectionKey} excludeId={item.id} />
      </div>

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        itemTitle={item.title}
        itemLocation={item.location}
        onSubmit={handleInquirySubmit}
      />

      <ClaimListingModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        listingId={item.id}
        listingTitle={item.title}
        defaultType={claimDefaultType}
      />
    </div>
  );
}

// Compact version of the two highest-intent actions (WhatsApp Owner + Ask
// Zanzibar Expert) for the mobile sticky bottom bar. A 2x2 grid of all 4
// buttons would be too tall for a bottom bar, so this renders just the
// two primary CTAs directly, sharing the same helpers/tracking events as
// ListingContactActions above.
function ListingContactActionsCompactBar({ item, onSendEnquiry }) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const expertUrl = buildExpertLink(item.title, item.location, currentUrl);

  const eventData = {
    listing_id: item.id,
    listing_name: item.title,
    listing_category: item.category_key,
    listing_location: item.location,
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => {
          trackEvent("click_send_enquiry", eventData);
          onSendEnquiry?.();
        }}
        aria-label={`Send enquiry about ${item.title}`}
        className="flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
      >
        <WA className="w-3.5 h-3.5 shrink-0" /> Send Enquiry
      </button>
      <a
        href={expertUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ask Zanzibar Expert about ${item.title}`}
        className="flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-full min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white"
        onClick={() => trackEvent("click_ask_zanzibar_expert", eventData)}
      >
        <Compass className="w-3.5 h-3.5 shrink-0" /> Ask Expert
      </a>
    </div>
  );
}

// Skeleton shown while the listing is loading, matching the real page's
// layout (gallery, title/location, 4-button action area, description) so
// there's no layout shift and no bare "Loading..." text flash.
function SectionDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[320px] sm:h-[420px] bg-slate-200" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
        <div className="h-5 w-20 bg-slate-200 rounded-full mb-3" />
        <div className="h-9 w-2/3 bg-slate-200 rounded mb-3" />
        <div className="h-4 w-40 bg-slate-200 rounded mb-8" />

        <div className="mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <div className="h-4 w-3/4 bg-slate-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-11 bg-slate-200 rounded-full" />
            <div className="h-11 bg-slate-200 rounded-full" />
            <div className="h-11 bg-slate-200 rounded-full" />
            <div className="h-11 bg-slate-200 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-40 bg-slate-100 border border-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
