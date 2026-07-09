import { Link, useParams } from "react-router-dom";
import { useAdvertisement } from "../data/hooks";
import { MapPin, MessageCircle, ExternalLink, Megaphone } from "lucide-react";
import PhotoGallery from "../components/PhotoGallery";

// Detail page for a single paid advertisement, reached via the "View
// Details" button on the Sponsored/Featured cards. Mirrors the look of a
// normal listing's detail page (SectionDetail) so paying advertisers get
// an equally polished, "serious" page - not just a thin popup.
export default function AdDetail() {
  const { id } = useParams();
  const { ad, loading } = useAdvertisement(id);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center">Loading...</div>;
  }

  if (!ad) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Not Found</h1>
        <Link to="/" className="text-teal-700 font-semibold hover:underline">
          ← Go Back
        </Link>
      </div>
    );
  }

  const message = encodeURIComponent(
    `Habari! I saw your ad for *${ad.business_name}* on Zanzibar Paradise Tours. Can you tell me more?`
  );

  return (
    <div>
      <PhotoGallery coverImage={ad.image_url} galleryImages={ad.gallery_images} />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/" className="text-sm text-teal-700 font-semibold hover:underline">
          ← Back to Home
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mt-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              {ad.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{ad.business_name}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <a
              href={`https://wa.me/${ad.whatsapp_number}?text=${message}`}
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-600 transition text-white font-bold px-6 py-3 rounded-full whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 inline mr-1.5" /> Chat on WhatsApp
            </a>
          </div>
        </div>

        <p className="text-slate-700 text-lg leading-relaxed">{ad.description}</p>

        {ad.maps_link && (
          <a
            href={ad.maps_link}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-6 text-teal-700 font-semibold hover:underline"
          >
            <MapPin className="w-4 h-4 inline mr-1" /> View on Google Maps{" "}
            <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
          </a>
        )}
      </div>
    </div>
  );
}
