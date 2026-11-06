import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { AREAS } from "../../data/areas";
import { LEO_INTERESTS } from "../../pages/ZanzibarLeo";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600";
const labelClass = "block text-sm font-medium text-slate-600 mb-1";

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  end_date: "",
  area_key: "",
  interest: "",
  organizer_name: "",
  organizer_url: "",
  verification: "unverified",
};

export default function AdminLeoManager() {
  const [form, setForm] = useState(emptyForm);
  const [events, setEvents] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    const [e, s] = await Promise.all([
      supabase.from("leo_events").select("*").order("event_date", { ascending: false }),
      supabase.from("leo_subscribers").select("*").order("created_at", { ascending: false }),
    ]);
    if (e.error) setError(e.error.message);
    if (s.error) setError(s.error.message);
    setEvents(e.data || []);
    setSubs(s.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const change = (ev) => setForm({ ...form, [ev.target.name]: ev.target.value });

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError("");
    if (form.organizer_url && !/^https?:\/\//i.test(form.organizer_url)) {
      return setError("Organizer link must start with http:// or https://");
    }
    if (form.end_date && form.end_date < form.event_date) {
      return setError("End date cannot be before the start date.");
    }
    setSaving(true);
    const { error: err } = await supabase.from("leo_events").insert([
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        end_date: form.end_date || null,
        area_key: form.area_key || null,
        interest: form.interest || null,
        organizer_name: form.organizer_name.trim() || null,
        organizer_url: form.organizer_url.trim() || null,
        verification: form.verification,
        is_published: false,
      },
    ]);
    setSaving(false);
    if (err) return setError(err.message);
    setForm(emptyForm);
    load();
  }

  async function patch(id, values) {
    setBusyId(id);
    const { error: err } = await supabase.from("leo_events").update(values).eq("id", id);
    if (err) setError(err.message);
    else setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, ...values } : x)));
    setBusyId(null);
  }

  async function remove(ev) {
    if (!window.confirm(`Delete "${ev.title}"?`)) return;
    setBusyId(ev.id);
    const { error: err } = await supabase.from("leo_events").delete().eq("id", ev.id);
    if (err) setError(err.message);
    else setEvents((prev) => prev.filter((x) => x.id !== ev.id));
    setBusyId(null);
  }

  async function removeSub(s) {
    if (!window.confirm("Remove this subscriber?")) return;
    const { error: err } = await supabase.from("leo_subscribers").delete().eq("id", s.id);
    if (err) setError(err.message);
    else setSubs((prev) => prev.filter((x) => x.id !== s.id));
  }

  async function copyList(channel) {
    const text = subs.filter((s) => s.channel === channel).map((s) => s.contact).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(channel);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Could not copy. Select the numbers manually.");
    }
  }

  const waCount = subs.filter((s) => s.channel === "whatsapp").length;
  const emailCount = subs.filter((s) => s.channel === "email").length;
  const areaLabel = (k) => AREAS.find((a) => a.key === k)?.name || "All Zanzibar";

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">{error}</div>
      )}

      {/* Add event */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-1">Add Zanzibar Leo event</h2>
        <p className="text-sm text-slate-500 mb-4">
          Only add events you have confirmed. New events start as Draft; press Publish to show them on /zanzibar-leo.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input name="title" value={form.title} onChange={change} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Short description (optional)</label>
            <textarea name="description" value={form.description} onChange={change} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start date</label>
              <input type="date" name="event_date" value={form.event_date} onChange={change} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>End date (optional)</label>
              <input type="date" name="end_date" value={form.end_date} onChange={change} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Area</label>
              <select name="area_key" value={form.area_key} onChange={change} className={inputClass}>
                <option value="">All Zanzibar</option>
                {AREAS.map((a) => (
                  <option key={a.key} value={a.key}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Interest</label>
              <select name="interest" value={form.interest} onChange={change} className={inputClass}>
                <option value="">Everyone</option>
                {LEO_INTERESTS.map((i) => (
                  <option key={i.key} value={i.key}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Organizer name</label>
              <input name="organizer_name" value={form.organizer_name} onChange={change} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Organizer link</label>
              <input name="organizer_url" value={form.organizer_url} onChange={change} placeholder="https://..." className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Verification</label>
            <select name="verification" value={form.verification} onChange={change} className={inputClass}>
              <option value="unverified">Not yet verified</option>
              <option value="verified">Verified (confirmed with the organizer)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </form>
      </div>

      {/* Events list */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-3">Events</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 break-words">{ev.title}</p>
                  <p className="text-xs text-slate-500">
                    {ev.event_date}
                    {ev.end_date ? ` → ${ev.end_date}` : ""} · {areaLabel(ev.area_key)}
                    {ev.interest ? ` · ${ev.interest}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => patch(ev.id, { verification: ev.verification === "verified" ? "unverified" : "verified" })}
                    disabled={busyId === ev.id}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full " +
                      (ev.verification === "verified" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700")
                    }
                  >
                    {ev.verification === "verified" ? "Verified" : "Unverified"}
                  </button>
                  <button
                    onClick={() => patch(ev.id, { is_published: !ev.is_published })}
                    disabled={busyId === ev.id}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full " +
                      (ev.is_published ? "bg-slate-100 text-slate-700" : "bg-teal-700 text-white")
                    }
                  >
                    {ev.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => remove(ev)}
                    disabled={busyId === ev.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-1">Digest subscribers</h2>
        <p className="text-sm text-slate-500 mb-3">
          {waCount} WhatsApp · {emailCount} email. Copy a list and send the weekly digest yourself
          (use a WhatsApp Broadcast list, or BCC for email).
        </p>
        <div className="flex gap-2 mb-4">
          <button onClick={() => copyList("whatsapp")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-700 text-white">
            {copied === "whatsapp" ? "Copied" : "Copy WhatsApp numbers"}
          </button>
          <button onClick={() => copyList("email")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-700 text-white">
            {copied === "email" ? "Copied" : "Copy emails"}
          </button>
        </div>
        {subs.length === 0 ? (
          <p className="text-sm text-slate-500">No subscribers yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 pb-1.5">
                <span className="min-w-0 break-all">
                  <span className="font-semibold">{s.channel === "whatsapp" ? "WA" : "Email"}</span> · {s.contact}
                  <span className="text-xs text-slate-400"> · {areaLabel(s.area_key)}{s.interest ? ` · ${s.interest}` : ""}</span>
                </span>
                <button onClick={() => removeSub(s)} className="text-xs text-red-600 shrink-0">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
