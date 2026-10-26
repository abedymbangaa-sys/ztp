import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useListing, useCategories } from "../data/hooks";
import { buildRichInquiryLink, SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { normalizePhone } from "../lib/phone";
import { sendNotificationEmail } from "../lib/email";
import { supabase } from "../lib/supabase";
import { getStoredUTM } from "../lib/utm";
import { SectionIcon } from "../lib/icons";
import { formatLocation } from "../lib/locations";
import { buildDirectionsUrl } from "../lib/maps";
import { MapPin, ExternalLink, ShieldCheck, BadgeCheck, CloudRain, RefreshCw, AlertTriangle } from "lucide-react";
import ReviewsSection from "../components/ReviewsSection";
import RelatedListings from "../components/RelatedListings";
import PhotoGallery from "../components/PhotoGallery";
import AtAGlance from "../components/AtAGlance";
import LocalLens from "../components/LocalLens";
import SuitabilityCard from "../components/SuitabilityCard";
import AmenitiesCard from "../components/AmenitiesCard";
import InquiryModal from "../components/InquiryModal";
import TravelersChoiceBadge from "../components/TravelersChoiceBadge";
import { isTravelersChoice } from "../lib/travelersChoice";
import ClaimListingModal from "../components/ClaimListingModal";
import VerificationPanel from "../components/VerificationPanel";
import ListingContactActions from "../components/ListingContactActions";
import { useT } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { trackEvent } from "../lib/analytics";
import { extractListingId, listingPath } from "../lib/slug";
import { recordView } from "../lib/recentlyViewed";

export default function SectionDetail() {
  // The URL segment is either the new "canary-nungwi-hotel-spa-<uuid>" or the
  // old bare "<uuid>"; useListing and everything below work off the real id.
  const { sectionKey, id: urlSegment } = useParams();
  const id = extractListingId(urlSegment);
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { listing: item, loading, error, retry } = useListing(id);
  const config = categories.find((c) => c.key === sectionKey);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  // Old bare-uuid links (shared on WhatsApp, indexed by Google) are sent to
  // the readable URL once the listing is known, so every visitor and every
  // share from now on uses the keyword-rich address.
  //
  // Only act when the loaded listing is the one the URL is actually about.
  // When a visitor moves from one listing to another (e.g. "Explore Nearby"),
  // this same component stays mounted and `item` still holds the PREVIOUS
  // listing for a moment. Without this check the redirect saw "URL says
  // Shukran Palace, item is Kijani Beach" and bounced the visitor back to the
  // old listing.
  useEffect(() => {
    if (!item || item.id !== id) return;
    const wanted = listingPath(item, sectionKey);
    if (window.location.pathname !== wanted) {
      navigate(wanted + window.location.search + window.location.hash, { replace: true });
    }
  }, [item, id, sectionKey, navigate]);

  // Remember this listing on the visitor's own device for "Recently Viewed".
  useEffect(() => {
    if (item?.id && item.id === id) recordView(item.id, item.category_key || sectionKey);
  }, [item?.id, item?.category_key, id, sectionKey]);
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
      const utm = getStoredUTM();
      await supabase.from("inquiries").insert({
        hotel_id: item.id,
        hotel_name: item.title,
        location: item.location,
        traveler_name: details.name,
        travelers_count: details.travelers,
        budget: details.budget,
        travel_dates: details.dates,
        current_area: details.area,
        notes: details.notes,
        used_fallback_number: !hasOwnNumber,
        created_at: new Date().toISOString(),
        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
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
          message: `Hello ${item.partners.business_name || ""}, you have a new inquiry on Zanzibar Paradise Tours for "${item.title}".\n\nFrom: ${details.name || "N/A"}\nTravelers: ${details.travelers || "N/A"}\nBudget: ${details.budget || "N/A"}\nDates: ${details.dates || "N/A"}\nCurrent area: ${details.area || "N/A"}\nNotes: ${details.notes || "N/A"}\n\nReply directly on WhatsApp to follow up.`,
        });
      } catch (err) {
        console.error("Could not send owner notification email", err);
      }
    }

    // Also notify the ZTP team directly on every single inquiry, regardless
    // of whether the listing has a registered partner - otherwise a lead
    // could only ever be seen by opening Admin Dashboard, and there was no
    // way to know one had come in at all.
    try {
      await sendNotificationEmail({
        toEmail: "info@visitzanzibarparadise.com",
        toName: "ZTP Team",
        subject: `New Inquiry: "${item.title}"`,
        message: `New inquiry on visitzanzibarparadise.com.\n\nListing: ${item.title} (${item.category_key})\nOwner on file: ${item.partners?.business_name || "No registered partner - admin-managed listing"}\n\nFrom: ${details.name || "N/A"}\nTravelers: ${details.travelers || "N/A"}\nBudget: ${details.budget || "N/A"}\nDates: ${details.dates || "N/A"}\nCurrent area: ${details.area || "N/A"}\nNotes: ${details.notes || "N/A"}\n\nCheck Admin Dashboard -> Inquiries for full details.`,
      });
    } catch (err) {
      console.error("Could not send admin notification email", err);
    }

    const targetNumber = hasOwnNumber ? ownerNumber : SITE_CONTACT_NUMBER;
    const link = buildRichInquiryLink(targetNumber, item.title, item.location, details, !hasOwnNumber);
    if (link) window.open(link, "_blank");
    setInquiryOpen(false);
  }

  return (
    <div>
      <PhotoGallery coverImage={item.image_url} galleryImages={item.gallery_images} listingName={item.title} />

      <div className="max-w-6xl mx-auto px-4 py-10">
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
            {isTravelersChoice(item) && <TravelersChoiceBadge size="lg" />}
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

        <AtAGlance item={item} />

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
              onClaimBusiness={() => {
                setClaimDefaultType("claim");
                setClaimOpen(true);
              }}
            />

            <LocalLens item={item} />

            <SuitabilityCard item={item} />

            <AmenitiesCard item={item} />

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
