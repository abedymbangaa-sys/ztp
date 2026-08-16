import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Flag, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import TravelerStoryUpload from "./TravelerStoryUpload";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "beaches", label: "Beaches" },
  { value: "stone_town", label: "Stone Town" },
  { value: "food", label: "Food" },
  { value: "hotels", label: "Hotels" },
  { value: "tours", label: "Tours" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
];

const REPORT_REASONS = [
  { value: "copyright", label: "Copyright concern" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "spam", label: "Spam / advertising" },
  { value: "privacy", label: "Privacy issue" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 12;

function SkeletonCard() {
  return <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />;
}

export default function TravelerStories() {
  const [stories, setStories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const lightboxRef = useRef(null);

  const loadStories = useCallback(async (isLoadMore = false) => {
    isLoadMore ? setLoadingMore(true) : setLoading(true);
    setLoadError(false);

    try {
      let query = supabase
        .from("traveler_stories")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (activeFilter !== "all") {
        query = query.eq("category", activeFilter);
      }
      if (locationSearch.trim()) {
        query = query.ilike("location_name", `%${locationSearch.trim()}%`);
      }

      const from = isLoadMore ? stories.length : 0;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, error } = await query;
      if (error) throw error;

      setStories((prev) => (isLoadMore ? [...prev, ...(data || [])] : data || []));
      setHasMore((data || []).length === PAGE_SIZE);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, locationSearch]);

  // Reload from scratch whenever filter or search changes
  useEffect(() => {
    setStories([]);
    loadStories(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, locationSearch]);

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    setReportOpen(false);
    setReportSent(false);
    setReportReason("");
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : Math.min(i + 1, stories.length - 1)));
  }, [stories.length]);

  const showPrev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
  }, []);

  // Keyboard navigation + focus trap for the lightbox
  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "Tab" && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    lightboxRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, closeLightbox, showNext, showPrev]);

  async function submitReport() {
    if (!activeStory || !reportReason) return;
    try {
      await supabase.from("traveler_story_reports").insert({
        story_id: activeStory.id,
        reason: reportReason,
      });
      setReportSent(true);
    } catch {
      // fail silently in UI, report just won't be recorded
      setReportSent(true);
    }
  }

  const categoryLabel = (value) => FILTERS.find((f) => f.value === value)?.label || value;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-6">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Real Stories</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Real Zanzibar Stories</h2>
        <p className="text-slate-500 mt-1">See Zanzibar through the eyes of travelers.</p>
        <p className="text-xs text-slate-400 mt-2">Photos are reviewed before publication.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border transition ${
                activeFilter === f.value
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto w-full sm:w-56">
          <input
            type="text"
            placeholder="Search by location…"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-full px-4 py-1.5"
          />
        </div>
      </div>

      {/* Gallery grid */}
      {loadError ? (
        <div className="text-center py-10">
          <p className="text-slate-500 mb-3">Couldn't load stories right now.</p>
          <button
            onClick={() => loadStories(false)}
            className="text-sm font-semibold text-teal-700 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3 [column-fill:_balance]">
          {/* "Add Photo" tile */}
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full mb-3 aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 transition flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 gap-1.5 break-inside-avoid"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-semibold text-center px-2">Share Your Photo</span>
          </button>

          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="mb-3 break-inside-avoid">
                <SkeletonCard />
              </div>
            ))}

          {!loading &&
            stories.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveIndex(i)}
                className="w-full mb-3 rounded-xl overflow-hidden group relative block break-inside-avoid focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <img
                  src={s.thumbnail_url || s.photo_url}
                  alt={s.caption || `Photo by ${s.name}`}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full h-auto object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition text-left">
                  {s.location_name && (
                    <p className="text-white text-xs font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {s.location_name}
                    </p>
                  )}
                </div>
                {s.category && (
                  <span className="absolute top-2 left-2 bg-white/90 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {categoryLabel(s.category)}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}

      {!loading && !loadError && stories.length === 0 && (
        <p className="text-sm text-slate-400 mt-4">
          No stories here yet — be the first to share a photo!
        </p>
      )}

      {!loading && !loadError && hasMore && stories.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => loadStories(true)}
            disabled={loadingMore}
            className="text-sm font-semibold text-teal-700 border border-teal-200 px-5 py-2 rounded-full hover:bg-teal-50 transition disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-teal-700 text-white font-bold px-6 py-2.5 rounded-full hover:bg-teal-800 transition"
        >
          Share Your Photo
        </button>
        <a
          href="#traveler-reviews"
          className="text-teal-700 font-bold px-6 py-2.5 rounded-full border border-teal-200 hover:bg-teal-50 transition text-center"
        >
          Read Traveler Reviews
        </a>
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setUploadOpen(false)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setUploadOpen(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg text-slate-500 hover:text-slate-800 z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <TravelerStoryUpload />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={activeStory.caption || "Traveler photo"}
        >
          <div
            ref={lightboxRef}
            tabIndex={-1}
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full relative outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow text-slate-600 hover:text-slate-900 z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {activeIndex > 0 && (
              <button
                onClick={showPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow text-slate-600 hover:text-slate-900 z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeIndex < stories.length - 1 && (
              <button
                onClick={showNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow text-slate-600 hover:text-slate-900 z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <img
              src={activeStory.photo_url}
              alt={activeStory.caption || `Photo by ${activeStory.name}`}
              className="w-full max-h-[65vh] object-cover"
            />

            <div className="p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {activeStory.category && (
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {categoryLabel(activeStory.category)}
                  </span>
                )}
                {activeStory.location_name && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {activeStory.location_name}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified story
                </span>
              </div>

              {activeStory.caption && <p className="text-slate-700 mb-2">{activeStory.caption}</p>}
              <p className="text-sm font-semibold text-slate-500 mb-3">— {activeStory.name}</p>

              {!reportOpen ? (
                <button
                  onClick={() => setReportOpen(true)}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" /> Report photo
                </button>
              ) : reportSent ? (
                <p className="text-xs text-teal-700">Thanks — this photo has been reported for review.</p>
              ) : (
                <div className="border-t border-slate-100 pt-3 mt-1">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Why are you reporting this photo?</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReportReason(r.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          reportReason === r.value
                            ? "bg-red-50 border-red-300 text-red-600"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={submitReport}
                      disabled={!reportReason}
                      className="text-xs font-semibold bg-red-500 text-white px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      Submit report
                    </button>
                    <button
                      onClick={() => setReportOpen(false)}
                      className="text-xs font-semibold text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
