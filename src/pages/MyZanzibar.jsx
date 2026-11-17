import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useListings } from "../data/hooks";
import { useSavedList } from "../lib/SavedListContext";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { Heart, Share2, Copy, Check, MessageCircle, ArrowRight } from "lucide-react";
import { STAMP_TYPES, getStamps } from "../lib/stamps";
import { getConnectionCount } from "../lib/connections";
import StampSeal from "../components/StampSeal";

function CardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="w-full h-44 bg-slate-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// /my-zanzibar - "My Zanzibar Passport": a save-list-you-can-share, no
// account required. Saves live in this browser via SavedListContext;
// sharing puts the saved ids straight in the URL (?ids=a,b,c).
//
// Two modes on the same page:
//  - Normal visit (no ?ids=): shows the visitor's own Passport.
//  - Someone opened a shared link (?ids=...): shows that person's list as
//    a read-only preview, with a button to copy it into your own Passport.
export default function MyZanzibar() {
  const [searchParams] = useSearchParams();
  const sharedIdsParam = searchParams.get("ids");
  const isSharedView = Boolean(sharedIdsParam);
  const sharedIds = useMemo(
    () => (sharedIdsParam ? sharedIdsParam.split(",").filter(Boolean) : []),
    [sharedIdsParam]
  );

  const { listings, loading, error, retry } = useListings();
  const { savedIds, addMany } = useSavedList();
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  useSEO({
    title: isSharedView ? "A Shared Zanzibar Passport | Visit Zanzibar Paradise" : "My Zanzibar Passport | Visit Zanzibar Paradise",
    description: "Save places you like in Zanzibar, earn discovery stamps, and share your personal Zanzibar story.",
    canonical: "https://visitzanzibarparadise.com/my-zanzibar",
  });

  const activeIds = isSharedView ? sharedIds : savedIds;
  const items = listings.filter((l) => activeIds.includes(l.id));

  // A listing can earn more than one stamp (e.g. a beachfront hotel earns
  // Beach Stamp + Local Experience Stamp) - see src/lib/stamps.js.
  const stampCounts = items.reduce((acc, item) => {
    getStamps(item).forEach(({ key }) => {
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {});
  // "Local Connection" isn't earned from saved listings - it comes from
  // listening to a Story Map pin or messaging a Local Host, tracked in
  // src/lib/connections.js. Shared Passport views (?ids=) show someone
  // else's saved places, not this browser's own connections, so it's
  // only shown on your own Passport.
  if (!isSharedView) {
    stampCounts.connection = getConnectionCount();
  }

  const stampKeysInOrder = Object.keys(STAMP_TYPES).filter(
    (key) => key !== "connection" || !isSharedView
  );
  const earnedCount = stampKeysInOrder.filter((key) => stampCounts[key] > 0).length;
  const nextStampKey = stampKeysInOrder.find((key) => !stampCounts[key]);
  const nextStamp = nextStampKey ? { key: nextStampKey, ...STAMP_TYPES[nextStampKey] } : null;

  const shareUrl = `https://visitzanzibarparadise.com/my-zanzibar?ids=${savedIds.join(",")}`;
  const shareMessage = `My Zanzibar Passport\nI have discovered ${items.length} ${items.length === 1 ? "place" : "places"} and earned ${earnedCount} of ${stampKeysInOrder.length} stamps.\nExplore my Zanzibar story:\n${shareUrl}`;

  function handleCopyLink() {
    navigator.clipboard?.writeText(shareMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsAppShare() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  }

  function handleImport() {
    addMany(sharedIds);
    setImported(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-3 max-w-2xl">
        {isSharedView && (
          <p className="text-teal-700 font-semibold text-xs uppercase tracking-wide">Shared with you</p>
        )}
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-teal-700 shrink-0" />
          {isSharedView ? "A Shared Zanzibar Passport" : "My Zanzibar Passport"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {isSharedView
            ? "Someone shared their Zanzibar Passport with you."
            : "Save places with the heart icon and watch your Passport fill up."}
        </p>
      </div>

      {!loading && !error && (
        <>
          {/* One slim row: your numbers + share buttons */}
          {!isSharedView && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">{items.length}</strong> {items.length === 1 ? "place" : "places"} saved
                {" · "}
                <strong className="text-slate-900">{earnedCount}</strong> of {stampKeysInOrder.length} stamps
              </p>
              {savedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-teal-500 text-slate-700 font-semibold px-3 py-1.5 rounded-full text-xs transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-3 py-1.5 rounded-full text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Compact stamp tiles - always all 6, 3 per row on phones. Tap a tile to explore it. */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            {stampKeysInOrder.map((key) => {
              const meta = STAMP_TYPES[key];
              const count = stampCounts[key] || 0;
              const earned = count > 0;
              return (
                <Link
                  key={key}
                  to={meta.route}
                  title={earned ? meta.description : meta.zeroCopy}
                  className={`rounded-xl border py-2.5 px-1.5 flex flex-col items-center text-center gap-0.5 transition hover:shadow-sm ${earned ? "bg-white shadow-sm" : "bg-slate-50 border-dashed"}`}
                  style={{ borderColor: earned ? meta.color : "#e2e8f0" }}
                >
                  <StampSeal stampKey={key} color={earned ? meta.color : "#cbd5e1"} size={26} />
                  <span className="text-xl font-black text-slate-900 leading-none mt-1">{count}</span>
                  <span
                    className="text-[11px] font-semibold leading-tight"
                    style={{ color: earned ? meta.color : "#64748b" }}
                  >
                    {meta.label.replace(" Stamp", "")}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Next discovery - one slim line */}
          {!isSharedView && nextStamp && (
            <div
              className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between gap-3"
              style={{ backgroundColor: `${nextStamp.color}12`, border: `1px solid ${nextStamp.color}33` }}
            >
              <p className="text-sm text-slate-800 min-w-0">
                <span className="font-semibold" style={{ color: nextStamp.color }}>Next: </span>
                Earn your {nextStamp.label}
                <span className="hidden sm:inline text-slate-500"> · {nextStamp.description}</span>
              </p>
              <Link
                to={nextStamp.route}
                className="inline-flex items-center gap-1 text-white font-semibold px-3 py-1.5 rounded-full text-xs shrink-0"
                style={{ backgroundColor: nextStamp.color }}
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}

      {isSharedView && sharedIds.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">Want to keep these in your own Zanzibar Passport?</p>
          <button
            onClick={handleImport}
            disabled={imported}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2 rounded-full text-sm disabled:opacity-60"
          >
            {imported ? (
              <>
                <Check className="w-4 h-4" /> Added to your Passport
              </>
            ) : (
              "Add to my Passport"
            )}
          </button>
        </div>
      )}

      {loading ? (
        <CardSkeletonGrid count={3} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold mb-1">
            {isSharedView ? "This shared Passport is empty or has expired." : "Your Zanzibar Passport is waiting for its first stamp."}
          </p>
          {!isSharedView && (
            <>
              <p className="text-slate-500 mb-4">Save a hotel, beach, tour, food place or attraction by tapping the heart icon.</p>
              <Link to="/things-to-do" className="text-teal-700 font-semibold hover:underline">
                Explore Zanzibar →
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item) => {
            const itemStamps = getStamps(item);
            return (
              <div key={item.id}>
                {itemStamps.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    {itemStamps.map((s) => (
                      <span
                        key={s.key}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold"
                        style={{ color: s.color }}
                      >
                        <StampSeal stampKey={s.key} color={s.color} size={14} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
                <GenericCard item={item} sectionKey={item.category_key} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
