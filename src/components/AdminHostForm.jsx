import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const STYLE_OPTIONS = [
  { key: "quiet_beach", label: "Quiet beach" },
  { key: "party", label: "Party" },
  { key: "culture", label: "Culture" },
  { key: "family", label: "Family" },
  { key: "romantic", label: "Romantic" },
  { key: "adventure", label: "Adventure" },
];

const BUDGET_OPTIONS = [
  { key: "budget", label: "Budget" },
  { key: "mid-range", label: "Mid-range" },
  { key: "luxury", label: "Luxury" },
];

const PREFERENCE_OPTIONS = [
  { key: "halal", label: "Halal food" },
  { key: "kids_friendly", label: "Kid-friendly" },
  { key: "no_crowds", label: "No crowds" },
  { key: "spice_lover", label: "Spice lover" },
];

const emptyForm = {
  name: "",
  bio: "",
  recommends_text: "",
  whatsapp_number: "",
  style_tags: [],
  budget_tiers: [],
  preference_tags: [],
};

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-600 mb-1";

function TagPicker({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onToggle(opt.key)}
          className={
            "text-xs font-semibold px-3 py-1.5 rounded-full border transition " +
            (selected.includes(opt.key)
              ? "bg-teal-700 border-teal-700 text-white"
              : "bg-white border-slate-300 text-slate-600 hover:border-teal-400")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminHostForm() {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [hosts, setHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [hostError, setHostError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadHosts() {
    setLoadingHosts(true);
    setHostError("");
    const { data, error: fetchError } = await supabase
      .from("hosts")
      .select("id, name, whatsapp_number, style_tags, is_published, created_at")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setHostError(fetchError.message);
    } else {
      setHosts(data || []);
    }
    setLoadingHosts(false);
  }

  useEffect(() => {
    loadHosts();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleTag = (field, key) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(key)
        ? prev[field].filter((k) => k !== key)
        : [...prev[field], key],
    }));
  };

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

    const cleanedNumber = form.whatsapp_number.replace(/[^0-9]/g, "");
    if (cleanedNumber.length < 9) {
      setError("Namba ya WhatsApp si sahihi — weka kwa mfumo wa kimataifa bila '+' (mfano: 255712345678).");
      setSaving(false);
      return;
    }
    if (form.style_tags.length === 0) {
      setError("Chagua angalau 'style' moja kwa host huyu.");
      setSaving(false);
      return;
    }

    try {
      const photo_url = await uploadFile(photoFile, "hosts");
      const video_url = await uploadFile(videoFile, "hosts");

      const { error: insertError } = await supabase.from("hosts").insert([
        {
          ...form,
          whatsapp_number: cleanedNumber,
          photo_url,
          video_url,
          is_published: false,
        },
      ]);
      if (insertError) throw insertError;

      setForm(emptyForm);
      setPhotoFile(null);
      setVideoFile(null);
      setSuccess(true);
      loadHosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  async function togglePublish(host) {
    setBusyId(host.id);
    const { error: updateError } = await supabase
      .from("hosts")
      .update({ is_published: !host.is_published })
      .eq("id", host.id);
    if (updateError) {
      setHostError(updateError.message);
    } else {
      setHosts((prev) =>
        prev.map((h) => (h.id === host.id ? { ...h, is_published: !h.is_published } : h))
      );
    }
    setBusyId(null);
  }

  async function deleteHost(host) {
    if (!window.confirm(`Futa "${host.name}"? Hatua hii haiwezi kurudishwa.`)) return;
    setBusyId(host.id);
    const { error: deleteError } = await supabase.from("hosts").delete().eq("id", host.id);
    if (deleteError) {
      setHostError(deleteError.message);
    } else {
      setHosts((prev) => prev.filter((h) => h.id !== host.id));
    }
    setBusyId(null);
  }

  return (
    <div>
      {/* ---- Orodha ya Hosts ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Local Hosts Zilizopo</h2>
        <p className="text-sm text-slate-500 mb-4">
          Bonyeza "Publish" ili host aonekane kwenye "Find My Local Host" quiz.
        </p>

        {hostError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {hostError}
          </div>
        )}

        {loadingHosts ? (
          <p className="text-sm text-slate-500">Inapakia...</p>
        ) : hosts.length === 0 ? (
          <p className="text-sm text-slate-500">Hakuna host bado. Ongeza mmoja hapa chini.</p>
        ) : (
          <div className="space-y-2">
            {hosts.map((host) => (
              <div
                key={host.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{host.name}</p>
                  <p className="text-xs text-slate-500">
                    {host.whatsapp_number} · {(host.style_tags || []).join(", ") || "hakuna style"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "text-xs font-semibold px-2.5 py-1 rounded-full " +
                      (host.is_published ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700")
                    }
                  >
                    {host.is_published ? "Live" : "Draft"}
                  </span>
                  <button
                    onClick={() => togglePublish(host)}
                    disabled={busyId === host.id}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 " +
                      (host.is_published
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-teal-700 text-white hover:bg-teal-800")
                    }
                  >
                    {host.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteHost(host)}
                    disabled={busyId === host.id}
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

      {/* ---- Fomu ya kuongeza host mpya ---- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-1">Ongeza Local Host</h2>
        <p className="text-sm text-slate-500 mb-5">
          Host mpya ataanza kama "Draft" — mtumie orodha juu ku-"Publish" ukiridhika.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-2.5 mb-4">
            Host amehifadhiwa kama Draft — mtumie orodha juu ku-publish.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Jina la host</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="mfano: Fatma Juma" className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Namba ya WhatsApp ya host (bila '+')</label>
            <input name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange}
              placeholder="mfano: 255712345678" className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Utangulizi mfupi (bio)</label>
            <textarea name="bio" value={form.bio} onChange={handleChange}
              className={inputClass} rows={2} placeholder="mfano: Mkazi wa Nungwi tangu utotoni, anajua fukwe za utulivu vizuri" />
          </div>

          <div>
            <label className={labelClass}>"Why I recommend these places"</label>
            <textarea name="recommends_text" value={form.recommends_text} onChange={handleChange}
              className={inputClass} rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Picha ya host</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className={labelClass}>Video (hiari, ~15s)</label>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Style (chagua zinazomfaa)</label>
            <TagPicker
              options={STYLE_OPTIONS}
              selected={form.style_tags}
              onToggle={(key) => toggleTag("style_tags", key)}
            />
          </div>

          <div>
            <label className={labelClass}>Budget anayofaa</label>
            <TagPicker
              options={BUDGET_OPTIONS}
              selected={form.budget_tiers}
              onToggle={(key) => toggleTag("budget_tiers", key)}
            />
          </div>

          <div>
            <label className={labelClass}>Preferences anazofahamu vizuri</label>
            <TagPicker
              options={PREFERENCE_OPTIONS}
              selected={form.preference_tags}
              onToggle={(key) => toggleTag("preference_tags", key)}
            />
          </div>

          <button type="submit" disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50">
            {saving ? "Inahifadhi..." : "Hifadhi Host"}
          </button>
        </form>
      </div>
    </div>
  );
}
