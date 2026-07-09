import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PhotoGallery({ coverImage, galleryImages = [] }) {
  const allImages = [coverImage, ...galleryImages].filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (allImages.length <= 1) {
    return (
      <div className="h-72 md:h-96 w-full overflow-hidden">
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  const next = () => setCurrent((c) => (c + 1) % allImages.length);
  const prev = () => setCurrent((c) => (c - 1 + allImages.length) % allImages.length);

  return (
    <>
      <div className="relative h-72 md:h-96 w-full overflow-hidden group">
        <img
          src={allImages[current]}
          alt=""
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        />
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition ${i === current ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
        <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {allImages.length}
        </span>
      </div>

      {/* Thumbnail strip */}
      <div className="max-w-4xl mx-auto px-4 mt-3 flex gap-2 overflow-x-auto">
        {allImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
              i === current ? "border-teal-600" : "border-transparent"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <X className="w-7 h-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 text-white p-2"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </>
  );
}
