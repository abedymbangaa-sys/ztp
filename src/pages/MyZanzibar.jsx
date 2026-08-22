import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useListings } from "../data/hooks";
import { useSavedList } from "../lib/SavedListContext";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { Heart, Share2, Copy, Check, MessageCircle } from "lucide-react";

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

// /my-zanzibar - a simple "save list you can share" (report section 8.5),
// deliberately lighter than a full account: saves live in this browser via
// SavedListContext, and sharing works by putting the saved ids straight in
// the URL (?ids=a,b,c) rather than needing a backend "trip" record.
//
// Two modes on the same page:
//  - Normal visit (no ?ids=): shows the visitor's own saved list.
//  - Someone opened a shared link (?ids=...): shows that person's list as
//    a read-only preview, with a button to copy it into your own saved list.
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
    title: isSharedView ? "A Shared Zanzibar List | Zanzibar Paradise Tours" : "My Zanzibar | Zanzibar Paradise Tours",
    description: "Save places you like in Zanzibar and share your list with friends or family.",
    canonical: "https://visitzanzibarparadise.com/my-zanzibar",
  });

  const activeIds = isSharedView ? sharedIds : savedIds;
  const items = listings.filter((l) => activeIds.includes(l.id));

  const shareUrl = `https://visitzanzibarparadise.com/my-zanzibar?ids=${savedIds.join(",")}`;

  function handleCopyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsAppShare() {
    const message = encodeURIComponent(`Check out my Zanzibar list — ${items.length} places I've saved: ${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  function handleImport() {
    addMany(sharedIds);
    setImported(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">
          {isSharedView ? "Shared with you" : "Saved by you"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-teal-700" />
          {isSharedView ? "A Zanzibar List" : "My Zanzibar"}
        </h1>
        <p className="text-slate-600">
          {isSharedView
            ? "Someone shared this list of Zanzibar places with you."
            : "Places you've saved with the heart icon across the site. Share this list with whoever you're travelling with."}
        </p>
      </div>

      {isSharedView && sharedIds.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 mb-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">Want to keep these in your own My Zanzibar list?</p>
          <button
            onClick={handleImport}
            disabled={imported}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2 rounded-full text-sm disabled:opacity-60"
          >
            {imported ? (
              <>
                <Check className="w-4 h-4" /> Added to your list
              </>
            ) : (
              "Add to my list"
            )}
          </button>
        </div>
      )}

      {!isSharedView && savedIds.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 flex flex-wrap items-center gap-3">
          <Share2 className="w-5 h-5 text-teal-700 shrink-0" />
          <p className="text-sm text-slate-600 flex-1 min-w-[200px]">Share your list so far with a link.</p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-teal-500 text-slate-700 font-semibold px-4 py-2 rounded-full text-sm transition"
          >
            {copied ? <Check className="w-4 h-4 text-teal-700" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-4 py-2 rounded-full text-sm"
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
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
          <p className="text-slate-500 mb-4">
            {isSharedView ? "This shared list is empty or has expired." : "You haven't saved anything yet."}
          </p>
          {!isSharedView && (
            <Link to="/things-to-do" className="text-teal-700 font-semibold hover:underline">
              Browse Things to Do and tap the heart icon on places you like →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
          ))}
        </div>
      )}
    </div>
  );
}
