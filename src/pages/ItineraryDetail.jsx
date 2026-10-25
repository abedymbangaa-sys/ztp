import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { useSEO } from "../lib/useSEO";
import { trackEvent } from "../lib/analytics";
import { buildExpertLink } from "../lib/whatsapp";
import { readPreload } from "../data/hooks";
import { DAY_PLANS } from "../data/itineraryPlans";
import CustomItineraryModal from "../components/CustomItineraryModal";
import { AlertTriangle, RefreshCw, Download, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

const FIXED_PDF_FILENAME = "zanzibar-5-day-itinerary.pdf";
const SITE_URL = "https://visitzanzibarparadise.com";

export default function ItineraryDetail() {
  const { slug } = useParams();

  // scripts/prerender.mjs embeds this exact guide in the page's static HTML
  // (window.__ZTP_PRELOAD__). Starting from it means the real content stays
  // on screen the moment React mounts, instead of being replaced by a
  // "Preparing your free itinerary..." placeholder while the same data is
  // re-fetched. That blank gap is what Google was reading as a Soft 404.
  const preloaded = readPreload("itinerary", (p) => p.slug === slug);
  const [guide, setGuide] = useState(preloaded || null);
  // "loading" | "ready" | "not_found" | "error"
  const [status, setStatus] = useState(preloaded ? "ready" : "loading");
  const [requestOpen, setRequestOpen] = useState(false);

  // `silent` = we already have this guide on screen, so refresh it in the
  // background without flashing a loading state (or an error) over it.
  const load = useCallback(
    (silent = false) => {
      if (!silent) setStatus("loading");
      supabase
        .from("itinerary_guides")
        .select("*")
        .eq("status", "published")
        .then(({ data, error }) => {
          if (error) {
            if (!silent) setStatus("error");
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
        .catch(() => {
          if (!silent) setStatus("error");
        });
    },
    [slug]
  );

  useEffect(() => {
    load(Boolean(guide && slugify(guide.title) === slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          onClick={() => load()}
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
    // w-full + min-w-0 matter here: App.jsx wraps pages in a flex column, and
    // a flex item with `mx-auto` shrinks to its content's minimum width. The
    // old day table (min-w-[560px]) therefore stretched this whole page
    // wider than a phone screen, cutting off the photo and text.
    <div className="w-full min-w-0 max-w-4xl mx-auto px-4 py-12">
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

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 mb-2 break-words">{guide.title}</h1>
      {guide.days_summary && <p className="text-slate-500 text-sm mb-4 break-words">{guide.days_summary}</p>}
      {guide.description && <p className="text-slate-700 leading-relaxed mb-6 break-words">{guide.description}</p>}

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
          {/* One card per day instead of a wide table: reads well on a phone
              (most visitors), and is plain stacked text for crawlers. */}
          <ol className="list-none p-0 m-0 space-y-4 mb-4">
            {days.map((d) => (
              <li key={d.day} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-teal-700">Day {d.day}</span>
                  <h2 className="text-lg font-bold text-slate-900 break-words">{d.title}</h2>
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-3 break-words">{d.area}</p>
                <p className="text-slate-700 leading-relaxed mb-3 break-words">{d.activities}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {d.links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline text-sm"
                    >
                      {l.label} <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
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

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6">
        <p className="font-bold text-slate-900 mb-1">Want an itinerary made for you?</p>
        <p className="text-slate-700 text-sm mb-4">
          Tell us your dates, who is travelling and what you enjoy. We will send you a suggested plan, free.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => {
              trackEvent("click_itinerary_cta", { itinerary_id: guide.id, cta_name: "request_custom_itinerary" });
              setRequestOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Request my itinerary
          </button>
          <a
            href={expertLink}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackEvent("click_itinerary_cta", { itinerary_id: guide.id, cta_name: "ask_expert" })
            }
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            or ask us on WhatsApp
          </a>
        </div>
      </div>

      <CustomItineraryModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        sourcePage={canonical}
      />

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
