import { useState } from "react";
import { supabase } from "../lib/supabase";

const emptyForm = {
  title: "",
  area_key: "",
  lat: "",
  lng: "",
  narrator_name: "",
  story_text_sw: "",
  story_text_en: "",
  local_secret: "",
  locals_do_text: "",
  tourists_told_text: "",
};

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-600 mb-1";

export default function AdminStoryPinForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [narratorPhoto, setNarratorPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function uploadFile(file, prefix) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${prefix}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("story-media")
      .upload(path, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("story-media").getPublicUrl(path);
    return data.publicUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const audio_url = await uploadFile(audioFile, "audio");
      const video_url = await uploadFile(videoFile, "video");
      const narrator_photo_url = await uploadFile(narratorPhoto, "narrators");

      const { error: insertError } = await supabase.from("story_pins").insert([
        {
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          audio_url,
          video_url,
          narrator_photo_url,
          is_published: false, // review before publishing
        },
      ]);
      if (insertError) throw insertError;

      setForm(emptyForm);
      setAudioFile(null);
      setVideoFile(null);
      setNarratorPhoto(null);
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Ongeza Story Pin</h2>
        <p className="text-sm text-slate-500 mb-5">
          Story mpya haitaonekana kwa umma mpaka ui-"publish" kwenye Supabase (is_published).
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            Story pin imehifadhiwa. Nenda Supabase kui-publish.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Jina la mahali</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="mfano: Bi Asha's Spice Corner"
              className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Area key</label>
            <input name="area_key" value={form.area_key} onChange={handleChange}
              placeholder="mfano: nungwi, stone-town"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude</label>
              <input name="lat" value={form.lat} onChange={handleChange}
                className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input name="lng" value={form.lng} onChange={handleChange}
                className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Jina la msimuliaji</label>
            <input name="narrator_name" value={form.narrator_name} onChange={handleChange}
              placeholder="mfano: Mzee Juma"
              className={inputClass} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Picha ya msimuliaji</label>
              <input type="file" accept="image/*"
                onChange={(e) => setNarratorPhoto(e.target.files[0])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className={labelClass}>Audio (Kiswahili)</label>
              <input type="file" accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files[0])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className={labelClass}>Video (hiari, &lt;30s)</label>
              <input type="file" accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hadithi kwa Kiswahili</label>
              <textarea name="story_text_sw" value={form.story_text_sw} onChange={handleChange}
                className={inputClass} rows={3} />
            </div>
            <div>
              <label className={labelClass}>Story in English</label>
              <textarea name="story_text_en" value={form.story_text_en} onChange={handleChange}
                className={inputClass} rows={3} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Siri ya mtaa</label>
            <textarea name="local_secret" value={form.local_secret} onChange={handleChange}
              placeholder="mfano: hapa jioni 5:30 kuna chai ya tangawizi bure..."
              className={inputClass} rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Wenyeji wanafanya nini hapa</label>
              <textarea name="locals_do_text" value={form.locals_do_text} onChange={handleChange}
                className={inputClass} rows={2} />
            </div>
            <div>
              <label className={labelClass}>Watalii wanaambiwa nini</label>
              <textarea name="tourists_told_text" value={form.tourists_told_text} onChange={handleChange}
                className={inputClass} rows={2} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50">
            {saving ? "Inahifadhi..." : "Hifadhi Story Pin"}
          </button>
        </form>
      </div>
    </div>
  );
}
