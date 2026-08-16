import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import TravelerStoryUpload from "./TravelerStoryUpload";

export default function TravelerStories() {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("traveler_stories")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(11); // leaves room for the "Add Photo" tile to make 12
      setStories(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Real Stories</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Moments Shared by Travelers</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* "Add Photo" tile — always first, same size as the photos */}
        <button
          onClick={() => setUploadOpen(true)}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/50 transition flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 gap-1.5"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-semibold text-center px-2">Share Your Photo</span>
        </button>

        {stories.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveStory(s)}
            className="aspect-square rounded-xl overflow-hidden group relative"
          >
            <img
              src={s.photo_url}
              alt={s.caption || `Photo by ${s.name}`}
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
          </button>
        ))}
      </div>

      {stories.length === 0 && (
        <p className="text-sm text-slate-400 mt-4">
          Be the first to share a photo from your trip!
        </p>
      )}

      {/* Upload modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setUploadOpen(false)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setUploadOpen(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg text-slate-500 hover:text-slate-800"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <TravelerStoryUpload />
          </div>
        </div>
      )}

      {/* Lightbox for viewing a photo */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={activeStory.photo_url} alt={activeStory.caption} className="w-full max-h-[70vh] object-cover" />
            <div className="p-4">
              {activeStory.caption && <p className="text-slate-700 mb-2">{activeStory.caption}</p>}
              <p className="text-sm font-semibold text-slate-500">— {activeStory.name}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
