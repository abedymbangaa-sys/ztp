import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { Camera, Clock, Sparkles } from "lucide-react";

export default function PhotoSpots() {
  useSEO({
    title: "Instagram Photo Spots in Zanzibar | Zanzibar Paradise Tours",
    description:
      "The best Instagram-worthy photo spots in Zanzibar - exact locations, the best time of day to shoot, and composition tips from locals.",
    canonical: "https://visitzanzibarparadise.com/photo-spots",
  });

  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    supabase
      .from("photo_spots")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
        } else {
          setSpots(data || []);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-1">
          <Camera className="w-4 h-4" /> Photo Spot Guide
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Zanzibar's Best Instagram Spots
        </h1>
        <p className="text-slate-600 mt-2">
          Exact locations, the best time of day, and composition tips - so your shot actually
          looks like the ones you save.
        </p>
      </div>

      {loading && <p className="text-center text-slate-500 text-sm">Loading spots...</p>}
      {loadError && <p className="text-center text-red-600 text-sm">{loadError}</p>}

      {!loading && spots.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="text-slate-700 font-semibold mb-1">New spots coming soon</p>
          <p className="text-slate-500 text-sm">
            We're building out this guide with real locations across the island.
          </p>
        </div>
      )}

      {/* Pinterest-style masonry: CSS columns let cards of different photo
          heights sit naturally in a grid without gaps, unlike a normal
          grid where every row would be forced to match its tallest card. */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
        {spots.map((spot) => (
          <div
            key={spot.id}
            className="break-inside-avoid mb-5 bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            {spot.photo_url && (
              <img
                src={spot.photo_url}
                alt={spot.title}
                className="w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="p-4">
              <h2 className="font-bold text-slate-900 mb-2">{spot.title}</h2>

              {spot.best_time && (
                <p className="flex items-start gap-1.5 text-sm text-slate-700 mb-1.5">
                  <Clock className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold">Best time:</span> {spot.best_time}
                  </span>
                </p>
              )}

              {spot.composition_tip && (
                <p className="flex items-start gap-1.5 text-sm text-slate-600 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{spot.composition_tip}</span>
                </p>
              )}

              {spot.instagram_tag && (
                <p className="text-xs text-teal-700 font-semibold mt-2">{spot.instagram_tag}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
