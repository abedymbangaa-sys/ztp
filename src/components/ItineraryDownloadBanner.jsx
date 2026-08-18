import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { trackEvent } from "../lib/analytics";

// Small promo box pointing blog readers to the free itinerary. Links to
// /itinerary (not directly to a PDF) because this component doesn't know
// which specific guide/id is live - the Itinerary page handles the actual
// free, no-signup download.
export default function ItineraryDownloadBanner({ ctaName = "blog_banner" }) {
  return (
    <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 my-8">
      <div>
        <p className="font-bold text-slate-900">Planning a Zanzibar trip?</p>
        <p className="text-sm text-slate-600 mt-1">
          Download our free 5-day itinerary and explore the island with a simple day-by-day plan.
        </p>
      </div>
      <Link
        to="/itinerary"
        onClick={() => trackEvent("click_itinerary_cta", { cta_name: ctaName })}
        className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full whitespace-nowrap"
      >
        <Download className="w-4 h-4" />
        Download Free Itinerary
      </Link>
    </div>
  );
}
