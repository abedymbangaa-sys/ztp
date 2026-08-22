import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import StarRating from "./StarRating";
import { Camera, Loader2, X, BadgeCheck } from "lucide-react";

const MAX_PHOTOS = 3;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB, checked before compression
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PHOTO_MAX_DIMENSION = 1200;
const PHOTO_QUALITY = 0.75;

// Same magic-number sniff used in TravelerStoryUpload.jsx - a renamed
// non-image file won't pass just because its extension looks right.
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

// Resizes + re-encodes as JPEG through canvas - also strips EXIF (GPS,
// camera info) automatically, same as TravelerStoryUpload.jsx.
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

export default function ReviewsSection({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, comment: "" });
  const [photos, setPhotos] = useState([]); // array of { file, preview }
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function handlePhotoChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPhotoError("");

    if (photos.length >= MAX_PHOTOS) {
      setPhotoError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setPhotoError("Photo must be under 10MB.");
      return;
    }
    const realType = await sniffImageType(f);
    if (!realType || !ALLOWED_TYPES.includes(realType)) {
      setPhotoError("Please choose a valid JPG, PNG or WebP photo.");
      return;
    }

    setProcessingPhoto(true);
    try {
      const compressed = await resizeAndCompress(f, PHOTO_MAX_DIMENSION, PHOTO_QUALITY);
      setPhotos((prev) => [...prev, { file: compressed, preview: URL.createObjectURL(compressed) }]);
    } catch {
      setPhotoError("Could not process this photo. Please try another one.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.reviewer_name.trim()) return;
    setSubmitting(true);

    try {
      const uploadedUrls = [];
      for (const p of photos) {
        const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("review-photos")
          .upload(path, p.file, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("review-photos").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("reviews").insert({
        listing_id: listingId,
        reviewer_name: form.reviewer_name,
        rating: form.rating,
        comment: form.comment,
        photo_urls: uploadedUrls,
        status: "pending",
      });
      if (error) throw error;

      setSubmitted(true);
      setForm({ reviewer_name: "", rating: 5, comment: "" });
      setPhotos([]);
    } catch {
      setPhotoError("Something went wrong submitting your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Guest Reviews</h2>
        {avgRating && (
          <span className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">
            <StarRating rating={Math.round(avgRating)} size="w-3.5 h-3.5" />
            {avgRating} ({reviews.length})
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 text-sm mb-8">No reviews yet - be the first to leave one!</p>
      ) : (
        <div className="space-y-4 mb-10">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{r.reviewer_name}</p>
                  {r.verified_by_admin && (
                    <span
                      title="Confirmed by the Zanzibar Paradise Tours team"
                      className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 text-xs font-semibold px-2 py-0.5 rounded-full"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified by ZPT
                    </span>
                  )}
                </div>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="text-slate-600 text-sm mt-2">{r.comment}</p>}
              {r.photo_urls?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {r.photo_urls.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxUrl(url)}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                    >
                      <img src={url} alt={`${r.reviewer_name} review photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-7 h-7" />
          </button>
          <img src={lightboxUrl} alt="Review photo" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Leave Your Review</h3>
        {submitted ? (
          <p className="text-teal-700 font-medium">
            Thank you! Your review has been submitted - it will appear once approved.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              placeholder="Your name"
              value={form.reviewer_name}
              onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rating</label>
              <StarRating
                rating={form.rating}
                interactive
                size="w-6 h-6"
                onChange={(n) => setForm({ ...form, rating: n })}
              />
            </div>
            <textarea
              rows={3}
              placeholder="Your comment (optional)"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Photos <span className="text-slate-400 font-normal">(optional, up to {MAX_PHOTOS})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={p.preview} alt={`Selected ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Remove photo"
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-teal-400 transition">
                    {processingPhoto ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={processingPhoto}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || processingPhoto}
              className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

