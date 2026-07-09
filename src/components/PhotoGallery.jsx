import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

// Editorial "mosaic" header: one large photo plus a small grid of supporting
// shots, with a "See all photos" overlay that opens the full lightbox.
// Falls back to a single swipeable image on mobile, where a mosaic has no
// room to breathe.
export default function PhotoGallery({ coverImage, galleryImages = [] }) {
  const allImages = [coverImage, ...galleryImages].filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openAt = (i) => {
    setCurrent(i);
    setLightboxOpen(true);
  };

  const next = () => setCurrent((c) => (c + 1) % allImages.length);
  const prev = () => setCurrent((c) => (c - 1 + allImages.length) % allImages.length);

  if (allImages.length === 0) return null;

  // Single image: no mosaic needed, just a clean banner.
  if (allImages.length === 1) {
    return (
      <div className="h-64 md:h-[26rem] w-full overflow-hidden">
        <img src={allImages[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  const sideThumbs = allImages.slice(1, 5);
  const remainingCount = allImages.length - 5;

  return (
    <>
      {/* --- Mobile: swipeable single frame --- */}
      <div className="md:hidden relative h-64 w-full overflow-hidden group">
        <img
          src={allImages[current]}
          alt=""
          className="w-full h-full object-cover"
          onClick={() => openAt(current)}
        />
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {current + 1} / {allImages.length}
        </span>
      </div>

      {/* --- Desktop: mosaic grid --- */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-1.5 h-[26rem] max-w-6xl mx-auto px-4 mt-4">
        <button onClick={() => openAt(0)} className="col-span-2 row-span-2 overflow-hidden rounded-l-2xl">
          <img src={allImages[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
        </button>
        {sideThumbs.map((img, i) => {
          const isLast = i === sideThumbs.length - 1 && remainingCount > 0;
          const cornerClass = i === 1 ? "rounded-tr-2xl" : i === 3 ? "rounded-br-2xl" : "";
          return (
            <button
              key={i}
              onClick={() => openAt(i + 1)}
              className={`relative overflow-hidden ${cornerClass}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
              {isLast && (
                <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                  +{remainingCount} more
                </span>
              )}
            </button>
          );
        })}
        {/* Pad the grid if there are fewer than 4 side images */}
        {sideThumbs.length < 4 &&
          Array.from({ length: 4 - sideThumbs.length }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-slate-100 rounded-r-2xl" />
          ))}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => openAt(0)}
          className="hidden md:inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-600 hover:text-teal-700"
        >
          <Images className="w-3.5 h-3.5" /> See all {allImages.length} photos
        </button>
      </div>

      {/* --- Lightbox --- */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white p-2">
            <X className="w-7 h-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white p-2"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={allImages[current]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white p-2"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold">
            {current + 1} / {allImages.length}
          </span>
        </div>
      )}
    </>
  );
}
