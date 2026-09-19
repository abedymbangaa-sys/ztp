import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import StarRating from "./StarRating";
import { Camera, Loader2, X, BadgeCheck, ThumbsUp, Flag, Building2 } from "lucide-react";
import { getVoterToken, hasVoted, markVoted } from "../lib/reviewInteractions";

const TRIP_TYPES = ["Solo", "Couples", "Family", "Friends", "Business"];

const REPORT_REASONS = [
  { key: "spam", label: "Spam or advertising" },
  { key: "fake", label: "Looks fake or not a real visit" },
  { key: "offensive", label: "Offensive or inappropriate" },
  { key: "off_topic", label: "Not about this listing" },
  { key: "other", label: "Other" },
];

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
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, title: "", trip_type: "", comment: "" });
  const [photos, setPhotos] = useState([]); // array of { file, preview }
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [sortBy, setSortBy] = useState("recent");
  const [votingId, setVotingId] = useState(null);

  const [reportTarget, setReportTarget] = useState(null); // review being reported, or null
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

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

  async function handleVote(review) {
    if (hasVoted(review.id) || votingId) return;
    setVotingId(review.id);
    const token = getVoterToken();
    const { data, error } = await supabase.rpc("vote_helpful", {
      p_review_id: review.id,
      p_voter_token: token,
    });
    if (!error) {
      markVoted(review.id);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, helpful_count: data ?? r.helpful_count + 1 } : r))
      );
    }
    setVotingId(null);
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    setReportSubmitting(true);
    const { error } = await supabase.from("review_reports").insert({
      review_id: reportTarget.id,
      reason: reportReason,
      note: reportNote.trim() || null,
    });
    setReportSubmitting(false);
    if (!error) {
      setReportSubmitted(true);
    }
  }

  function closeReportModal() {
    setReportTarget(null);
    setReportReason("spam");
    setReportNote("");
    setReportSubmitted(false);
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
        title: form.title.trim() || null,
        trip_type: form.trip_type || null,
        comment: form.comment,
        photo_urls: uploadedUrls,
        status: "pending",
      });
      if (error) throw error;

      setSubmitted(true);
      setForm({ reviewer_name: "", rating: 5, title: "", trip_type: "", comment: "" });
      setPhotos([]);
    } catch {
      setPhotoError("Something went wrong submitting your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    switch (sortBy) {
      case "helpful":
        return copy.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      case "highest":
        return copy.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return copy.sort((a, b) => a.rating - b.rating);
      case "recent":
      default:
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [reviews, sortBy]);

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  // Count of reviews per star (5 -> 1), used for the distribution bars
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  function ratingWord(avg) {
    if (avg >= 4.5) return "Excellent";
    if (avg >= 4) return "Very Good";
    if (avg >= 3) return "Average";
    if (avg >= 2) return "Poor";
    return "Terrible";
  }

  const STAR_LABELS = {
    5: "Excellent",
    4: "Good",
    3: "Average",
    2: "Poor",
    1: "Terrible",
  };
  const STAR_BAR_COLOR = {
    5: "bg-teal-600",
    4: "bg-teal-400",
    3: "bg-amber-400",
    2: "bg-orange-400",
    1: "bg-red-400",
  };

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Guest Reviews</h2>

      {avgRating && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 max-w-md">
          <div className="flex items-baseline gap-4 mb-5">
            <span className="text-4xl font-extrabold text-teal-700 leading-none">{avgRating}</span>
            <div>
              <p className="font-semibold text-slate-900">{ratingWord(avgRating)}</p>
              <p className="text-xs text-slate-500">
                from {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {distribution.map(({ star, count }) => (
              <div key={star} className="grid grid-cols-[90px_1fr_28px] items-center gap-3">
                <span className="text-xs text-slate-600">{STAR_LABELS[star]}</span>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STAR_BAR_COLOR[star]}`}
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 text-sm mb-8">No reviews yet - be the first to leave one!</p>
      ) : (
        <div className="mb-10">
          {reviews.length > 1 && (
            <div className="flex justify-end mb-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600"
              >
                <option value="recent">Most recent</option>
                <option value="helpful">Most helpful</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
          )}
          <div className="space-y-4">
            {sortedReviews.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">{r.reviewer_name}</p>
                  {r.trip_type && (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {r.trip_type}
                    </span>
                  )}
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
              {r.title && <p className="font-semibold text-slate-800 text-sm mt-1">{r.title}</p>}
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

              {r.owner_response && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Building2 className="w-3.5 h-3.5" /> Response from management
                  </p>
                  <p className="text-sm text-slate-600">{r.owner_response}</p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleVote(r)}
                  disabled={hasVoted(r.id) || votingId === r.id}
                  className={
                    "flex items-center gap-1.5 text-xs font-semibold transition " +
                    (hasVoted(r.id)
                      ? "text-teal-700 cursor-default"
                      : "text-slate-500 hover:text-teal-700 disabled:opacity-50")
                  }
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful{r.helpful_count > 0 ? ` (${r.helpful_count})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setReportTarget(r)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 transition"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report
                </button>
              </div>
            </div>
          ))}
          </div>
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

      {reportTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeReportModal}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <>
                <p className="font-bold text-slate-900 mb-2">Thanks for letting us know</p>
                <p className="text-sm text-slate-600 mb-4">
                  Our team will take a look at this review.
                </p>
                <button
                  onClick={closeReportModal}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-full"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <p className="font-bold text-slate-900 mb-3">Report this review</p>
                <div className="space-y-2 mb-3">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.key} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="report_reason"
                        value={r.key}
                        checked={reportReason === r.key}
                        onChange={() => setReportReason(r.key)}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Additional details (optional)"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 transition text-white font-semibold py-2.5 rounded-full disabled:opacity-50"
                  >
                    {reportSubmitting ? "Sending..." : "Submit Report"}
                  </button>
                  <button
                    type="button"
                    onClick={closeReportModal}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-full"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
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
            <input
              placeholder="Give your review a title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Trip type <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TRIP_TYPES.map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setForm({ ...form, trip_type: form.trip_type === tt ? "" : tt })}
                    className={
                      "text-sm px-3 py-1.5 rounded-full border transition " +
                      (form.trip_type === tt
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-white text-slate-600 border-slate-300 hover:border-teal-400")
                    }
                  >
                    {tt}
                  </button>
                ))}
              </div>
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

            <p className="text-xs text-slate-400">
              Please base your review on a real, first-hand visit. Reviews are checked before
              they're published.
            </p>

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


