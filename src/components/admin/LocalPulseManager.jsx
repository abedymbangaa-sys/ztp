import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Radio, Trash2, Plus, Loader2 } from "lucide-react";

// Simple manual CRUD for "What's happening right now in Zanzibar" -
// short-lived items an admin (or, later, a trusted local partner) types
// in directly. Deliberately manual rather than automated: the idea's
// value is a real person's current read on the island, not a feed.
const CATEGORY_OPTIONS = [
  { key: "general", label: "General" },
  { key: "food", label: "Food & Nightlife" },
  { key: "sunset", label: "Sunset Spot" },
  { key: "crowd", label: "Crowd Level" },
  { key: "weather", label: "Weather Note" },
];

export default function LocalPulseManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("local_pulse")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (err) {
      setError("Could not load pulse items.");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    const hours = Number(expiresInHours);
    const expires_at = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
    const { error: err } = await supabase.from("local_pulse").insert({
      message: message.trim(),
      category,
      expires_at,
      is_active: true,
    });
    setSaving(false);
    if (err) {
      setError("Could not save that item.");
      return;
    }
    setMessage("");
    load();
  }

  async function toggleActive(item) {
    await supabase.from("local_pulse").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function remove(item) {
    if (!window.confirm("Delete this pulse item?")) return;
    await supabase.from("local_pulse").delete().eq("id", item.id);
    load();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-4 text-teal-700">
        <Radio className="w-5 h-5" />
        <h3 className="font-bold text-slate-900">Real-Time Local Pulse</h3>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Short "what's happening right now" notes shown on the homepage. Write them like you're telling a friend -
        e.g. "Tonight at Forodhani: live taarab music from 7pm" or "Nungwi beach is quiet this week, low season."
      </p>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 mb-6">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="What's happening right now?"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="12">Expires in 12 hours</option>
            <option value="24">Expires in 24 hours</option>
            <option value="72">Expires in 3 days</option>
            <option value="168">Expires in 1 week</option>
            <option value="0">No expiry (until I remove it)</option>
          </select>
          <button
            type="submit"
            disabled={saving || !message.trim()}
            className="ml-auto inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Post
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No pulse items yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const expired = item.expires_at && new Date(item.expires_at) < new Date();
            return (
              <div
                key={item.id}
                className={
                  "flex items-start gap-3 border rounded-lg p-3 text-sm " +
                  (item.is_active && !expired ? "border-teal-200 bg-teal-50/40" : "border-slate-200 bg-slate-50 opacity-60")
                }
              >
                <div className="flex-1">
                  <p className="text-slate-800">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {CATEGORY_OPTIONS.find((c) => c.key === item.category)?.label || item.category}
                    {expired && " · expired"}
                    {!item.is_active && " · hidden"}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(item)}
                  className="text-xs font-semibold text-teal-700 hover:underline whitespace-nowrap"
                >
                  {item.is_active ? "Hide" : "Show"}
                </button>
                <button onClick={() => remove(item)} aria-label="Delete" className="text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
