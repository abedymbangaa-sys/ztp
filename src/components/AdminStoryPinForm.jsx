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

export default function AdminStoryPinForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [narratorPhoto, setNarratorPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      onSaved?.();
      alert("Story pin imehifadhiwa. Nenda kwenye orodha ku-publish.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-3">
      <h2 className="text-lg font-bold text-teal-800">Ongeza Story Pin</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <input name="title" value={form.title} onChange={handleChange}
        placeholder="Jina la mahali (mfano: Bi Asha's Spice Corner)"
        className="w-full border rounded p-2" required />

      <input name="area_key" value={form.area_key} onChange={handleChange}
        placeholder="Area key (mfano: nungwi, stone-town)"
        className="w-full border rounded p-2" />

      <div className="flex gap-2">
        <input name="lat" value={form.lat} onChange={handleChange}
          placeholder="Latitude" className="w-1/2 border rounded p-2" required />
        <input name="lng" value={form.lng} onChange={handleChange}
          placeholder="Longitude" className="w-1/2 border rounded p-2" required />
      </div>

      <input name="narrator_name" value={form.narrator_name} onChange={handleChange}
        placeholder="Jina la msimuliaji (mfano: Mzee Juma)"
        className="w-full border rounded p-2" required />

      <label className="block text-sm text-gray-600">Picha ya msimuliaji</label>
      <input type="file" accept="image/*" onChange={(e) => setNarratorPhoto(e.target.files[0])} />

      <label className="block text-sm text-gray-600">Audio (Kiswahili)</label>
      <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />

      <label className="block text-sm text-gray-600">Video (hiari, chini ya sekunde 30)</label>
      <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />

      <textarea name="story_text_sw" value={form.story_text_sw} onChange={handleChange}
        placeholder="Hadithi kwa Kiswahili" className="w-full border rounded p-2" rows={2} />

      <textarea name="story_text_en" value={form.story_text_en} onChange={handleChange}
        placeholder="Story in English" className="w-full border rounded p-2" rows={2} />

      <textarea name="local_secret" value={form.local_secret} onChange={handleChange}
        placeholder="Siri ya mtaa (mfano: hapa jioni 5:30 kuna chai bure...)"
        className="w-full border rounded p-2" rows={2} />

      <textarea name="locals_do_text" value={form.locals_do_text} onChange={handleChange}
        placeholder="Wenyeji wanafanya nini hapa" className="w-full border rounded p-2" rows={2} />

      <textarea name="tourists_told_text" value={form.tourists_told_text} onChange={handleChange}
        placeholder="Watalii wanaambiwa nini" className="w-full border rounded p-2" rows={2} />

      <button type="submit" disabled={saving}
        className="w-full bg-teal-700 text-white rounded p-2 font-semibold disabled:opacity-50">
        {saving ? "Inahifadhi..." : "Hifadhi Story Pin"}
      </button>
    </form>
  );
}
