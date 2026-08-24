import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";

const BUCKET = "listing-photos";

// Resizes/compresses an image in the browser before upload, so large phone
// photos (often 4-8MB) become fast-loading JPEGs without a visible quality
// difference at the sizes we display them. Falls back to the original file
// if anything goes wrong. maxWidth/maxHeight and quality kept generous
// (2200px, 90%) so photos still look sharp when a visitor opens the full
// gallery view, not just as small thumbnails.
function compressImage(file, { maxWidth = 2200, maxHeight = 2200, quality = 0.9 } = {}) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file); // don't touch animated GIFs or vector SVGs
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve(file);
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // couldn't decode - upload the original rather than fail
    };

    img.src = objectUrl;
  });
}

async function uploadFile(file) {
  const compressed = await compressImage(file);
  const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Single-photo uploader (e.g. main/cover photo). value/onChange hold a URL string.
export function SinglePhotoUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      setError("Imeshindwa kupandisha picha: " + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}
      {value ? (
        <div className="relative w-40 h-32 rounded-lg overflow-hidden border border-slate-300">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-40 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition text-slate-500 text-xs gap-1">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Weka Picha</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// Multi-photo uploader (e.g. gallery photos). value/onChange hold an array of URLs.
export function MultiPhotoUploader({ value = [], onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadFile));
      onChange([...(value || []), ...urls]);
    } catch (err) {
      setError("Imeshindwa kupandisha picha: " + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border border-slate-300">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center w-24 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition text-slate-500 text-xs gap-1">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Ongeza</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

