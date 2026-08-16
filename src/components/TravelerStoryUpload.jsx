import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Camera, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "beaches", label: "Beaches" },
  { value: "stone_town", label: "Stone Town" },
  { value: "food", label: "Food" },
  { value: "hotels", label: "Hotels" },
  { value: "tours", label: "Tours" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB — checked BEFORE compression, on the original file
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Full-size image shown in the lightbox — big enough to look sharp,
// small enough to load fast.
const FULL_MAX_DIMENSION = 1600;
const FULL_QUALITY = 0.8;

// Thumbnail shown in the homepage grid — this is what most visitors
// actually load, so it needs to be tiny.
const THUMB_MAX_DIMENSION = 480;
const THUMB_QUALITY = 0.75;

// Reads the first bytes of a file and checks real magic numbers,
// so a renamed .pdf pretending to be .jpg gets rejected even
// though the browser's accept="" and MIME type can be spoofed.
async function sniffImageType(file) {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e47")) return "image/png";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";
  return null;
}

// Draws the image onto a canvas at a smaller size and re-encodes it
// as JPEG. Re-encoding through canvas also strips EXIF metadata
// (GPS location, camera info) automatically — good for privacy.
// Canvas also reads the image's orientation correctly when drawn,
// which fixes photos that appear sideways from some phone cameras.
function resizeAndCompress(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
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
            reject(new Error("Could not process image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image."));
    };

    img.src = objectUrl;
  });
}

export default function TravelerStoryUpload() {
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [category, setCategory] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setFile(null);
    setPreview(null);

    if (f.size > MAX_SIZE) {
      setError("Photo must be under 10MB.");
      e.target.value = "";
      return;
    }

    const realType = await sniffImageType(f);
    if (!realType || !ALLOWED_TYPES.includes(realType)) {
      setError("Please choose a valid JPG, PNG or WebP photo.");
      e.target.value = "";
      return;
    }

    setProcessingImage(true);
    try {
      // Compress right away, on selection — so the file we're
      // holding in state is already small by the time the person
      // hits submit.
      const compressed = await resizeAndCompress(f, FULL_MAX_DIMENSION, FULL_QUALITY);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Could not process this photo. Please try another one.");
    } finally {
      setProcessingImage(false);
    }
  }

  function validate() {
    if (!file) return "Please choose a photo first.";
    if (!caption.trim() || caption.trim().length < 10) {
      return "Please tell us about the moment (at least 10 characters).";
    }
    if (caption.trim().length > 300) {
      return "Caption must be under 300 characters.";
    }
    if (!locationName.trim()) return "Please tell us where this photo was taken.";
    if (!category) return "Please choose a category.";
    if (!rightsConfirmed) return "Please confirm you own this photo or have permission to share it.";
    if (!privacyConsent) return "Please agree to the privacy policy to continue.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return; // guard against double submit

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // `file` here is already the compressed full-size version
      // (set in handleFileChange). We now also build a much smaller
      // thumbnail from it for the homepage grid.
      const thumbnailBlob = await resizeAndCompress(file, THUMB_MAX_DIMENSION, THUMB_QUALITY);

      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const fullPath = `${baseName}-full.jpg`;
      const thumbPath = `${baseName}-thumb.jpg`;

      const { error: fullUploadError } = await supabase.storage
        .from("traveler-photos")
        .upload(fullPath, file, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
      if (fullUploadError) throw fullUploadError;

      const { error: thumbUploadError } = await supabase.storage
        .from("traveler-photos")
        .upload(thumbPath, thumbnailBlob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
      if (thumbUploadError) throw thumbUploadError;

      const { data: fullUrlData } = supabase.storage.from("traveler-photos").getPublicUrl(fullPath);
      const { data: thumbUrlData } = supabase.storage.from("traveler-photos").getPublicUrl(thumbPath);

      const { error: insertError } = await supabase.from("traveler_stories").insert({
        name: name.trim() || "Anonymous",
        caption: caption.trim(),
        photo_url: fullUrlData.publicUrl,
        thumbnail_url: thumbUrlData.publicUrl,
        location_name: locationName.trim(),
        category,
        rights_confirmed: rightsConfirmed,
        privacy_consent: privacyConsent,
        status: "pending",
      });
      if (insertError) throw insertError;

      setDone(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <p className="font-semibold text-teal-800">Thank you.</p>
        <p className="text-sm text-teal-700 mt-1">
          Your story has been submitted for review. It will appear here once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
      <p className="font-bold text-slate-900 mb-1">Share Your Zanzibar Story</p>
      <p className="text-sm text-slate-500 mb-4">
        Got a great photo from your trip? Share it with future travelers.
      </p>

      <label className="block mb-1">
        <div className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-teal-400 transition overflow-hidden">
          {processingImage ? (
            <div className="text-center text-slate-400">
              <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin" />
              <p className="text-xs">Optimizing photo…</p>
            </div>
          ) : preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-400">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">Tap to choose a photo (JPG, PNG, WebP · max 10MB)</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={processingImage}
          className="hidden"
        />
      </label>
      {file && !processingImage && (
        <p className="text-xs text-slate-400 mb-3">
          Optimized to {(file.size / 1024 / 1024).toFixed(1)}MB — loads fast for everyone.
        </p>
      )}

      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3"
      />

      <textarea
        placeholder="Tell us about the moment (10–300 characters)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
        maxLength={300}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-1 resize-none"
      />
      <p className="text-xs text-slate-400 mb-3 text-right">{caption.length}/300</p>

      <input
        type="text"
        placeholder="Where was this photo taken? (e.g. Nungwi Beach)"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-4 text-slate-700"
      >
        <option value="">Choose a category</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <label className="flex items-start gap-2 mb-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I confirm that I own this photo or have permission to share it, and I agree that
          Zanzibar Paradise Tours may display it on this website.
        </span>
      </label>

      <label className="flex items-start gap-2 mb-3 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree to the{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-teal-700 underline">
            Privacy Policy
          </a>.
        </span>
      </label>

      <p className="text-xs text-slate-400 mb-3">
        Your photo will be reviewed before it appears publicly.
      </p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting || processingImage}
        className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white font-bold py-2.5 rounded-full hover:bg-teal-800 transition disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Uploading..." : "Share My Story"}
      </button>
    </form>
  );
}
