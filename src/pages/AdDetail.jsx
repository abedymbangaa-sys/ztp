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

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link to="/" className="text-sm text-teal-700 font-semibold hover:underline">
          ← Back to Home
        </Link>

        <div className="mt-4 mb-6">
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            {ad.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{ad.business_name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <p className="text-slate-700 text-lg leading-relaxed">{ad.description}</p>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <a
                href={`https://wa.me/${ad.whatsapp_number}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-amber-500 hover:bg-amber-600 transition text-white font-bold px-6 py-3 rounded-full"
              >
                <MessageCircle className="w-4 h-4 inline mr-1.5" /> Chat on WhatsApp
              </a>

              {ad.maps_link && (
                <a
                  href={ad.maps_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-teal-700 font-semibold hover:underline text-sm pt-1"
                >
                  <MapPin className="w-4 h-4" /> View on Google Maps{" "}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
