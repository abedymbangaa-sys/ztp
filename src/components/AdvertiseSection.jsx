import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdvertisements } from "../data/hooks";

// One ad card with its own tiny photo carousel (main photo + gallery_images).
// The whole card links to the ad's own detail page (/ad/:id) - just like a
// normal listing card links to its detail page - rather than jumping
// straight to WhatsApp, so a paid ad gets the same "serious" treatment.
function AdCard({ ad }) {
  const photos = [ad.image_url, ...(ad.gallery_images || [])].filter(Boolean);
  const [current, setCurrent] = useState(0);
  const hasMultiple = photos.length > 1;
  const [paused, setPaused] = useState(false);

  // Auto-advance every 3s, like a mini slideshow. Pauses while the user is
  // actively interacting with the arrows/dots so it doesn't fight them.
  useEffect(() => {
    if (!hasMultiple || paused) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % photos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [hasMultiple, paused, photos.length]);

  function go(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    setPaused(true);
    setCurrent((c) => (c + dir + photos.length) % photos.length);
  }

  return (
    <Link
      to={`/ad/${ad.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow border border-amber-200"
    >
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={photos[current]}
          alt={ad.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          Ad
        </span>

        {hasMultiple && (
          <>
            <button
              onClick={(e) => go(e, -1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => go(e, 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaused(true);
                    setCurrent(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === current ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs text-amber-700 font-semibold mb-1">{ad.category}</p>
        <h3 className="font-bold text-lg text-slate-900 mb-1">{ad.business_name}</h3>
        {ad.maps_link && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
            <MapPin className="w-3.5 h-3.5" /> View on map
          </p>
        )}
        <p className="text-sm text-slate-600 line-clamp-2">{ad.description}</p>
        <span className="inline-flex items-center gap-1.5 mt-4 bg-amber-500 group-hover:bg-amber-600 transition text-white text-sm font-semibold px-4 py-2 rounded-full">
          View Details →
        </span>
      </div>
    </Link>
  );
}

// Renders only paid, admin-approved, still-active ads. This never reads
// from or writes to `listings`, so free directory listings are completely
// unaffected by who has or hasn't paid for an ad.
export default function AdvertiseSection() {
  const { ads, loading } = useAdvertisements(6);

  if (loading || ads.length === 0) return null;

  return (
    <section className="bg-amber-50/60 border-y border-amber-100">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-4 h-4 text-amber-600" />
          <p className="text-amber-700 font-semibold text-sm uppercase tracking-wide">Sponsored</p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Featured Businesses</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
