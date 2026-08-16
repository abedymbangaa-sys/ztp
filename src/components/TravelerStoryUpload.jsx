import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Camera, Loader2 } from "lucide-react";

export default function TravelerStoryUpload() {
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a photo first.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("traveler-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("traveler-photos").getPublicUrl(path);

      const { error: insertError } = await supabase.from("traveler_stories").insert({
        name: name.trim() || "Anonymous",
        caption: caption.trim() || null,
        photo_url: urlData.publicUrl,
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
        <p className="font-semibold text-teal-800">Thank you for sharing your story!</p>
        <p className="text-sm text-teal-700 mt-1">
          It's been submitted and will appear here once reviewed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="font-bold text-slate-900 mb-1">Share Your Zanzibar Story</p>
      <p className="text-sm text-slate-500 mb-4">
        Got a great photo from your trip? Share it with future travelers.
      </p>

      <label className="block mb-4">
        <div className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-teal-400 transition overflow-hidden">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-400">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">Tap to choose a photo</p>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>

      <input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3"
      />
      <textarea
        placeholder="Tell us about the moment (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3 resize-none"
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white font-bold py-2.5 rounded-full hover:bg-teal-800 transition disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Uploading..." : "Share My Story"}
      </button>
    </form>
  );
}
