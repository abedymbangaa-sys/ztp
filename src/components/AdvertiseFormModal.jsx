import { useState } from "react";
import { supabase } from "../lib/supabase";
import { SinglePhotoUploader, MultiPhotoUploader } from "./ImageUploader";

const CATEGORY_OPTIONS = [
  "Hotel",
  "Restaurant",
  "Tour Operator",
  "Beach / Destination",
  "Activity / Experience",
  "Other",
];

// Standalone ad-submission form. This is intentionally separate from the
// free "Partner Signup" listing flow - submitting here creates a row in
// `advertisements`, never touches `listings`, and only appears in the
// dedicated Advertise spotlight once an admin approves it after payment.
export default function AdvertiseFormModal({ open, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    business_name: "",
    category: CATEGORY_OPTIONS[0],
    description: "",
    image_url: "",
    gallery_images: [],
    whatsapp_number: "",
    maps_link: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.image_url) {
      setError("Please add a photo of your business.");
      return;
    }

    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("advertisements")
      .insert({ ...form, status: "pending" })
      .select()
      .single();

    setSaving(false);
    if (insertError) {
      setError("Something went wrong: " + insertError.message);
      return;
    }

    onSubmitted(data);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-lg text-slate-900">Advertise Your Business</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          This is a separate paid spotlight - it does not affect your free directory listing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Business / Destination Name</label>
            <input
              required
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              placeholder="e.g. Nungwi Dreams by Mantis"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Short Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What makes it worth a tourist's attention?"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          <div>
            <SinglePhotoUploader
              label="Main Photo"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>

          <div>
            <MultiPhotoUploader
              label="Extra Photos (up to 10, optional)"
              value={form.gallery_images}
              onChange={(urls) => setForm({ ...form, gallery_images: urls.slice(0, 10) })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
            <input
              required
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="255700000000"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (optional)</label>
            <input
              value={form.maps_link}
              onChange={(e) => setForm({ ...form, maps_link: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 transition text-white font-bold px-6 py-3 rounded-full disabled:opacity-50 mt-2"
          >
            {saving ? "Submitting..." : "Continue to Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
