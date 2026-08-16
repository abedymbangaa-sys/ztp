import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import TravelerStoryUpload from "./TravelerStoryUpload";

export default function TravelerStories() {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("traveler_stories")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);
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

      {stories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {stories.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStory(s)}
              className="aspect-square rounded-xl overflow-hidden group relative"
            >
              <img
                src={s.photo_url}
                alt={s.caption || `Photo by ${s.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
            </button>
          ))}
        </div>
      )}

      <div className="max-w-md">
        <TravelerStoryUpload />
      </div>

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
