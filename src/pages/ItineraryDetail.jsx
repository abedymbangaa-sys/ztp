import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { useSEO } from "../lib/useSEO";
import { trackEvent } from "../lib/analytics";
import { buildExpertLink } from "../lib/whatsapp";
import { AlertTriangle, RefreshCw, Download, MessageCircle, ArrowRight } from "lucide-react";

const FIXED_PDF_FILENAME = "zanzibar-5-day-itinerary.pdf";
const SITE_URL = "https://visitzanzibarparadise.com";

// Day-by-day content for known itinerary guides, keyed by slug. There is
// no day-by-day column in itinerary_guides yet, so this is the source of
// truth for the online view for now. Guides that don't have an entry here
// still get a working page - just without the table (see fallback below).
const DAY_PLANS = {
  "5-days-in-zanzibar": [
    {
      day: 1,
      title: "Stone Town",
      area: "Stone Town",
      activities: "Guided walk through Stone Town's historic streets, old doors and waterfront, then Forodhani Night Market at sunset for Zanzibar pizza, urojo, mishkaki and fresh seafood",
      links: [
        { label: "Heritage sites", to: "/heritage" },
        { label: "Tours", to: "/tours" },
      ],
    },
    {
      day: 2,
      title: "Safari Blue",
      area: "Menai Bay, South Coast",
      activities: "Full-day traditional dhow trip around Menai Bay - visit a sandbank, snorkel in clear water and enjoy a fresh seafood lunch",
      links: [
        { label: "Tours", to: "/tours" },
        { label: "South Coast", to: "/area/south" },
      ],
    },
    {
      day: 3,
      title: "Jozani Forest",
      area: "Jozani Forest & Spice Farm",
      activities: "Guided walk through Jozani Forest to see the red colobus monkey, then continue to a spice farm to learn about Zanzibar's famous cloves, cinnamon and tropical fruits",
      links: [
        { label: "Nature", to: "/nature" },
        { label: "Tours", to: "/tours" },
      ],
    },
    {
      day: 4,
      title: "Nungwi & Kendwa",
      area: "North Coast",
      activities: "A day on the north coast - clear water, beach time, a turtle aquarium visit and a sunset dhow cruise",
      links: [
        { label: "Hotels", to: "/hotels" },
        { label: "Beaches", to: "/beaches" },
      ],
    },
    {
      day: 5,
      title: "Paje & Departure",
      area: "Paje, East Coast",
      activities: "A slow morning on Paje Beach with a lagoon activity if the tide allows, then departure with enough time for your airport or ferry transfer",
      links: [
        { label: "Beaches", to: "/beaches" },
        { label: "Things to Do", to: "/things-to-do" },
      ],
    },
  ],
};

export default function ItineraryDetail() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  // "loading" | "ready" | "not_found" | "error"
  const [status, setStatus] = useState("loading");

  const load = useCallback(() => {
    setStatus("loading");
    supabase
      .from("itinerary_guides")
      .select("*")
      .eq("status", "published")
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        const match = (data || []).find((g) => slugify(g.title) === slug);
        if (!match) {
          setStatus("not_found");
          return;
        }
        setGuide(match);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status === "ready" && guide) {
      trackEvent("view_itinerary_online", { itinerary_id: guide.id, itinerary_title: guide.title });
    }
  }, [status, guide]);

  const canonical = `${SITE_URL}/itinerary/${slug}`;
  useSEO({
    title: guide ? `${guide.title} | Free Online Itinerary | Zanzibar Paradise Tours` : undefined,
    description: guide?.description || "A free, practical day-by-day Zanzibar itinerary.",
    canonical,
    image: guide?.cover_image,
    structuredData: guide
      ? {
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: guide.title,
          description: guide.description || "",
          url: canonical,
        }
      : undefined,
  });

  if (status === "loading") {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500">Preparing your free itinerary...</div>;
  }

  if (status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-3" />
        <p className="text-slate-700 mb-4">We couldn't load this itinerary right now.</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">Itinerary Not Found</h1>
        <p className="text-slate-600 mb-4">This guide may have moved or is no longer published.</p>
        <Link to="/itinerary" className="text-teal-700 font-semibold hover:underline">
          ← Back to Itinerary Guides
        </Link>
      </div>
    );
  }

  const days = DAY_PLANS[slug];
  const downloadHref = `/api/download-itinerary?id=${encodeURIComponent(guide.id)}`;
  const expertLink = buildExpertLink(guide.title, "Zanzibar", canonical);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {guide.cover_image && (
        <div className="h-56 md:h-72 w-full overflow-hidden rounded-2xl mb-6">
          <img
            src={guide.cover_image}
            alt={guide.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/itinerary/zanzibar-itinerary-fallback.jpg";
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <Link to="/itinerary" className="text-sm text-teal-700 font-semibold hover:underline">
        ← Back to Itinerary Guides
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 mb-2">{guide.title}</h1>
      {guide.days_summary && <p className="text-slate-500 text-sm mb-4">{guide.days_summary}</p>}
      {guide.description && <p className="text-slate-700 leading-relaxed mb-6">{guide.description}</p>}

      {guide.pdf_url && (
        <a
          href={downloadHref}
          download={FIXED_PDF_FILENAME}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("download_itinerary", {
              itinerary_id: guide.id,
              itinerary_title: guide.title,
              source_page: window.location.pathname,
            })
          }
          className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full mb-8"
        >
          <Download className="w-4 h-4" />
          Download Free PDF
        </a>
      )}

      {days ? (
        <>
          <div className="overflow-x-auto -mx-4 px-4 mb-4">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-semibold">Day</th>
                  <th className="py-2 pr-4 font-semibold">Area</th>
                  <th className="py-2 pr-4 font-semibold">Suggested activities</th>
                  <th className="py-2 font-semibold">Useful links</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.day} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      Day {d.day} — {d.title}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{d.area}</td>
                    <td className="py-3 pr-4 text-slate-600">{d.activities}</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        {d.links.map((l) => (
                          <Link
                            key={l.to}
                            to={l.to}
                            className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline text-xs"
                          >
                            {l.label} <ArrowRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mb-10">
            This is a suggested itinerary, not a factual booking promise. Times, prices and
            availability may change. Confirm directly with the business before booking.
          </p>
        </>
      ) : (
        <p className="text-slate-500 mb-10">
          A detailed day-by-day breakdown for this guide is coming soon. Download the free PDF
          above for the full plan in the meantime.
        </p>
      )}

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-700 font-medium">Need help planning this trip? Ask a Zanzibar Expert on WhatsApp.</p>
        <a
          href={expertLink}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackEvent("click_itinerary_cta", { itinerary_id: guide.id, cta_name: "ask_expert" })
          }
          className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          Ask a Zanzibar Expert
        </a>
      </div>

      <div className="flex flex-wrap gap-4 mt-6 text-sm">
        <Link
          to="/hotels"
          onClick={() => trackEvent("click_itinerary_cta", { itinerary_id: guide.id, cta_name: "find_hotel" })}
          className="text-teal-700 font-semibold hover:underline"
        >
          Find a Hotel
        </Link>
        <Link
          to="/things-to-do"
          onClick={() => trackEvent("click_itinerary_cta", { itinerary_id: guide.id, cta_name: "things_to_do" })}
          className="text-teal-700 font-semibold hover:underline"
        >
          Browse Things to Do
        </Link>
      </div>
    </div>
  );
}
