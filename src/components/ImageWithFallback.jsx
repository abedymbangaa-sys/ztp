import { useState } from "react";
import { ImageOff } from "lucide-react";

// Drop-in replacement for <img> that shows a neutral, on-brand
// placeholder instead of the browser's broken-image icon when a photo
// URL 404s, times out, or the file was deleted from storage. Every
// other prop (className, loading, alt, etc.) passes straight through.
export default function ImageWithFallback({ src, alt = "", className = "", onClick, ...rest }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}
      >
        <ImageOff className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">{alt || "Image unavailable"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
