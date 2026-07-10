import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useListing, useCategories } from "../data/hooks";
import { buildRichInquiryLink, SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { sendNotificationEmail } from "../lib/email";
import { supabase } from "../lib/supabase";
import { SectionIcon } from "../lib/icons";
import { MapPin, MessageCircle, ExternalLink, ShieldCheck, BadgeCheck, CloudRain } from "lucide-react";
import ReviewsSection from "../components/ReviewsSection";
import RelatedListings from "../components/RelatedListings";
import PhotoGallery from "../components/PhotoGallery";
import InquiryModal from "../components/InquiryModal";
import ClaimListingModal from "../components/ClaimListingModal";
import { useT } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";

export default function SectionDetail() {
  const { sectionKey, id } = useParams();
  const { categories } = useCategories();
  const { listing: item, loading } = useListing(id);
  const config = categories.find((c) => c.key === sectionKey);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const { language } = useLanguage();
  const t = useT();

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center">Loading...</div>;
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

  const hasOwnNumber = Boolean(item.whatsapp_number);

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

    const targetNumber = hasOwnNumber ? item.whatsapp_number : SITE_CONTACT_NUMBER;
    const link = buildRichInquiryLink(targetNumber, item.title, item.location, details, !hasOwnNumber);
    if (link) window.open(link, "_blank");
    setInquiryOpen(false);
  }

  return (
    <div>
      <PhotoGallery coverImage={item.image_url} galleryImages={item.gallery_images} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link to={`/${sectionKey}`} className="text-sm text-teal-700 font-semibold hover:underline">
          ← {t("Back to")} {config?.title || sectionKey}
        </Link>

        <div className="mt-4 mb-6">
          <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            <SectionIcon sectionKey={sectionKey} className="w-3.5 h-3.5" />
            {config?.tag || ""}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            {item.title}
            {item.is_verified && (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full align-middle">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </h1>
          {item.location && (
            <p className="text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {item.location}
            </p>
          )}
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
                onClick={() => setClaimOpen(true)}
                className="text-xs text-slate-400 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {t("Own this business? Claim, edit or request removal")}
              </button>
            </div>

            <ReviewsSection listingId={item.id} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <button
                onClick={() => setInquiryOpen(true)}
                className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold px-6 py-3 rounded-full"
              >
                <MessageCircle className="w-4 h-4 inline mr-1.5" /> {t("Send Enquiry")}
              </button>

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
      />
    </div>
  );
}
