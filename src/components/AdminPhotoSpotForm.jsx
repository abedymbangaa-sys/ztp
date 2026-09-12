import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const emptyForm = {
  title: "",
  area_key: "",
  lat: "",
  lng: "",
  best_time: "",
  composition_tip: "",
  instagram_tag: "",
};

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-600 mb-1";

export default function AdminPhotoSpotForm() {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [spots, setSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [spotError, setSpotError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadSpots() {
    setLoadingSpots(true);
    setSpotError("");
    const { data, error: fetchError } = await supabase
      .from("photo_spots")
      .select("id, title, area_key, is_published, created_at")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setSpotError(fetchError.message);
    } else {
      setSpots(data || []);
    }
    setLoadingSpots(false);
  }

  useEffect(() => {
    loadSpots();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function uploadFile(file, prefix) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${prefix}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("story-media").upload(path, file);
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
      setError("Latitude si sahihi kwa Zanzibar - lazima iwe namba hasi (mfano: -6.1636).");
      setSaving(false);
      return;
    }
    if (Number.isNaN(lngNum) || lngNum < 38 || lngNum > 41) {
      setError("Longitude si sahihi kwa Zanzibar - inatakiwa iwe kati ya 38 na 41.");
      setSaving(false);
      return;
    }

    try {
      const photo_url = await uploadFile(photoFile, "photo-spots");

      const { error: insertError } = await supabase.from("photo_spots").insert([
        {
          ...form,
          lat: latNum,
          lng: lngNum,
          photo_url,
          is_published: false,
        },
      ]);
      if (insertError) throw insertError;

      setForm(emptyForm);
      setPhotoFile(null);
      setSuccess(true);
      loadSpots();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  async function togglePublish(spot) {
    setBusyId(spot.id);
    const { error: updateError } = await supabase
      .from("photo_spots")
      .update({ is_published: !spot.is_published })
      .eq("id", spot.id);
    if (updateError) {
      setSpotError(updateError.message);
    } else {
      setSpots((prev) =>
        prev.map((s) => (s.id === spot.id ? { ...s, is_published: !s.is_published } : s))
      );
    }
    setBusyId(null);
  }

  async function deleteSpot(spot) {
    if (!window.confirm(`Futa "${spot.title}"? Hatua hii haiwezi kurudishwa.`)) return;
    setBusyId(spot.id);
    const { error: deleteError } = await supabase.from("photo_spots").delete().eq("id", spot.id);
    if (deleteError) {
      setSpotError(deleteError.message);
    } else {
      setSpots((prev) => prev.filter((s) => s.id !== spot.id));
    }
    setBusyId(null);
  }

  return (
    <div>
      {/* ---- Orodha ya Photo Spots ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Photo Spots Zilizopo</h2>
        <p className="text-sm text-slate-500 mb-4">
          Bonyeza "Publish" ili spot ionekane kwenye /photo-spots.
        </p>

        {spotError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {spotError}
          </div>
        )}

        {loadingSpots ? (
          <p className="text-sm text-slate-500">Inapakia...</p>
        ) : spots.length === 0 ? (
          <p className="text-sm text-slate-500">Hakuna photo spot bado. Ongeza moja hapa chini.</p>
        ) : (
          <div className="space-y-2">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{spot.title}</p>
                  <p className="text-xs text-slate-500">{spot.area_key || "hakuna area"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "text-xs font-semibold px-2.5 py-1 rounded-full " +
                      (spot.is_published ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700")
                    }
                  >
                    {spot.is_published ? "Live" : "Draft"}
                  </span>
                  <button
                    onClick={() => togglePublish(spot)}
                    disabled={busyId === spot.id}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 " +
                      (spot.is_published
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-teal-700 text-white hover:bg-teal-800")
                    }
                  >
                    {spot.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteSpot(spot)}
                    disabled={busyId === spot.id}
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

      {/* ---- Fomu ya kuongeza spot mpya ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Ongeza Photo Spot</h2>
        <p className="text-sm text-slate-500 mb-5">
          Spot mpya itaanza kama "Draft" - itumie orodha juu ku-"Publish" ukiridhika.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            Photo spot imehifadhiwa kama Draft - itumie orodha juu ku-publish.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Jina la spot</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="mfano: Nakupenda Rock sunset silhouette"
              className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Area key</label>
            <input name="area_key" value={form.area_key} onChange={handleChange}
              placeholder="mfano: nungwi, stone-town" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude</label>
              <input name="lat" value={form.lat} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input name="lng" value={form.lng} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Picha ya mfano (inspiration shot)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className={labelClass}>Best time (wakati bora wa kupiga picha)</label>
            <input name="best_time" value={form.best_time} onChange={handleChange}
              placeholder="mfano: Golden hour, dakika 30 kabla jua kutua" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Composition tip</label>
            <textarea name="composition_tip" value={form.composition_tip} onChange={handleChange}
              placeholder="mfano: Simama wakati wa maji kupwa (low tide) kwa reflection nzuri"
              className={inputClass} rows={2} />
          </div>

          <div>
            <label className={labelClass}>Instagram hashtag (hiari)</label>
            <input name="instagram_tag" value={form.instagram_tag} onChange={handleChange}
              placeholder="mfano: #ZanzibarSunset" className={inputClass} />
          </div>

          <button type="submit" disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50">
            {saving ? "Inahifadhi..." : "Hifadhi Photo Spot"}
          </button>
        </form>
      </div>
    </div>
  );
}
