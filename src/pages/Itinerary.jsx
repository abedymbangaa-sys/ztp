import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";
import { slugify } from "../lib/slug";
import { BookOpenText, Download, Eye, AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { buildExpertLink } from "../lib/whatsapp";

const FIXED_PDF_FILENAME = "zanzibar-5-day-itinerary.pdf";

export default function Itinerary() {
  const [guides, setGuides] = useState([]);
  // "loading" | "ready" | "error"
  const [status, setStatus] = useState("loading");

  const loadGuides = useCallback(() => {
    setStatus("loading");
    supabase
      .from("itinerary_guides")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setGuides(data || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Plan Your Trip</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpenText className="w-7 h-7 text-teal-700" />
          Zanzibar Itinerary Guides
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          {status === "ready" && guides.length === 0
            ? "We're putting together practical day-by-day Zanzibar guides, free to download - no account, no payment, no email required. Check back soon."
            : "Practical day-by-day Zanzibar guides, free to download - no account, no payment, no email required."}
        </p>
      </div>

      {status === "loading" && <p className="text-slate-500">Preparing your free itinerary...</p>}

      {status === "error" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-800 font-medium">
              We couldn't load the itinerary guides right now.
            </p>
            <button
              onClick={loadGuides}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        </div>
      )}

      {status === "ready" && guides.length === 0 && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-8 text-center">
          <BookOpenText className="w-8 h-8 text-teal-600 mx-auto mb-3" />
          <h2 className="font-bold text-slate-900 text-lg mb-1">Coming Soon</h2>
          <p className="text-slate-600 mb-5 max-w-md mx-auto">
            Our first free itinerary guides are being written and will appear here shortly. In the
            meantime, a Zanzibar Expert can put together a personalized day-by-day plan for you on WhatsApp.
          </p>
          <a
            href={buildExpertLink("a Zanzibar itinerary", "Zanzibar", window.location.href)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2.5 rounded-full text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Ask a Zanzibar Expert
          </a>
        </div>
      )}

      {status === "ready" && guides.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          {guides.map((g) => (
            <ItineraryCard key={g.id} guide={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItineraryCard({ guide: g }) {
  const hasPdf = Boolean(g.pdf_url);
  const slug = slugify(g.title);
  const downloadHref = `/api/download-itinerary?id=${encodeURIComponent(g.id)}`;

  const handleDownloadClick = () => {
    trackEvent("download_itinerary", {
      itinerary_id: g.id,
      itinerary_title: g.title,
      source_page: window.location.pathname,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {g.cover_image && (
        <div className="h-44 overflow-hidden">
          <img
            src={g.cover_image}
            alt={g.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/itinerary/zanzibar-itinerary-fallback.jpg";
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <h2 className="font-bold text-lg text-slate-900 mb-1">{g.title}</h2>
        {g.days_summary && <p className="text-xs text-slate-500 mb-2">{g.days_summary}</p>}
        {g.description && <p className="text-sm text-slate-600 mb-3">{g.description}</p>}

        <span className="inline-flex items-center gap-1.5 self-start bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-1">
          Free PDF
        </span>
        <p className="text-xs text-slate-400 mb-4">Free to download · No account required</p>

        <div className="mt-auto flex flex-col gap-2">
          {hasPdf ? (
            <a
              href={downloadHref}
              download={FIXED_PDF_FILENAME}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownloadClick}
              aria-label={`Download the free ${g.title} PDF`}
              className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full"
            >
              <Download className="w-4 h-4" />
              Download Free PDF
            </a>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">
                The free PDF is temporarily unavailable. View the itinerary online or ask a
                Zanzibar Expert.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to={`/itinerary/${slug}`}
              aria-label={`View the ${g.title} itinerary online`}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-teal-700 text-teal-700 hover:bg-teal-50 transition font-semibold px-4 py-2 rounded-full text-sm"
            >
              <Eye className="w-4 h-4" />
              View Online
            </Link>
            <a
              href={buildExpertLink(g.title, "Zanzibar", window.location.href)}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackEvent("click_itinerary_cta", { itinerary_id: g.id, cta_name: "ask_expert" })
              }
              className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 transition font-semibold px-3 py-2 rounded-full text-sm whitespace-nowrap"
              aria-label="Ask a Zanzibar Expert on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              Ask a Zanzibar Expert
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
