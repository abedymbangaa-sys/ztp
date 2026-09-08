import { useEffect, useState } from "react";
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

export default function AdminStoryPinForm() {
  const [form, setForm] = useState(emptyForm);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [narratorPhoto, setNarratorPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [pins, setPins] = useState([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [pinError, setPinError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadPins() {
    setLoadingPins(true);
    setPinError("");
    const { data, error: fetchError } = await supabase
      .from("story_pins")
      .select("id, title, area_key, narrator_name, is_published, created_at")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setPinError(fetchError.message);
    } else {
      setPins(data || []);
    }
    setLoadingPins(false);
  }

  useEffect(() => {
    loadPins();
  }, []);

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

    const latNum = parseFloat(form.lat);
    const lngNum = parseFloat(form.lng);
    if (Number.isNaN(latNum) || latNum >= 0 || latNum < -7) {
      setError(
        "Latitude si sahihi kwa Zanzibar — lazima iwe namba hasi (mfano: -6.1636). Angalia una '-' mbele."
      );
      setSaving(false);
      return;
    }
    if (Number.isNaN(lngNum) || lngNum < 38 || lngNum > 41) {
      setError("Longitude si sahihi kwa Zanzibar — inatakiwa iwe kati ya 38 na 41 (mfano: 39.1908).");
      setSaving(false);
      return;
    }

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
      loadPins();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  async function togglePublish(pin) {
    setBusyId(pin.id);
    const { error: updateError } = await supabase
      .from("story_pins")
      .update({ is_published: !pin.is_published })
      .eq("id", pin.id);
    if (updateError) {
      setPinError(updateError.message);
    } else {
      setPins((prev) =>
        prev.map((p) => (p.id === pin.id ? { ...p, is_published: !p.is_published } : p))
      );
    }
    setBusyId(null);
  }

  async function deletePin(pin) {
    if (!window.confirm(`Futa "${pin.title}"? Hatua hii haiwezi kurudishwa.`)) return;
    setBusyId(pin.id);
    const { error: deleteError } = await supabase.from("story_pins").delete().eq("id", pin.id);
    if (deleteError) {
      setPinError(deleteError.message);
    } else {
      setPins((prev) => prev.filter((p) => p.id !== pin.id));
    }
    setBusyId(null);
  }

  return (
    <div>
      {/* ---- Orodha ya Story Pins zilizopo ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Story Pins Zilizopo</h2>
        <p className="text-sm text-slate-500 mb-4">
          Bonyeza "Publish" ili ionekane kwa umma kwenye map — hakuna haja ya kuingia Supabase.
        </p>

        {pinError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {pinError}
          </div>
        )}

        {loadingPins ? (
          <p className="text-sm text-slate-500">Inapakia...</p>
        ) : pins.length === 0 ? (
          <p className="text-sm text-slate-500">Hakuna story pin bado. Ongeza moja hapa chini.</p>
        ) : (
          <div className="space-y-2">
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{pin.title}</p>
                  <p className="text-xs text-slate-500">
                    {pin.narrator_name} · {pin.area_key || "hakuna area"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "text-xs font-semibold px-2.5 py-1 rounded-full " +
                      (pin.is_published
                        ? "bg-teal-50 text-teal-700"
                        : "bg-amber-50 text-amber-700")
                    }
                  >
                    {pin.is_published ? "Live" : "Draft"}
                  </span>
                  <button
                    onClick={() => togglePublish(pin)}
                    disabled={busyId === pin.id}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 " +
                      (pin.is_published
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-teal-700 text-white hover:bg-teal-800")
                    }
                  >
                    {pin.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => deletePin(pin)}
                    disabled={busyId === pin.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Futa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Fomu ya kuongeza pin mpya ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Ongeza Story Pin</h2>
        <p className="text-sm text-slate-500 mb-5">
          Story mpya itaanza kama "Draft" — itumie orodha juu kui-"Publish" ukiridhika.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            Story pin imehifadhiwa kama Draft — itumie orodha juu kui-publish.
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
