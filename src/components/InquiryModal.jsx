import { useState } from "react";

const BUDGET_OPTIONS = [
  "Under $50/day",
  "$50 - $150/day",
  "$150 - $300/day",
  "$300+/day",
  "Not sure yet",
];

export default function InquiryModal({ open, onClose, itemTitle, itemLocation, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    travelers: "",
    budget: "",
    dates: "",
    notes: "",
  });
  const [sending, setSending] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    await onSubmit(form);
    setSending(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content area */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Tell us about your trip</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                For: <span className="font-semibold text-slate-700">{itemTitle}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
              &times;
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            A few quick details help us (and the business) respond with the right info the first time.
          </p>

          <form id="inquiry-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sarah"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Your Phone / WhatsApp Number
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +255 6XX XXX XXX"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                So the business can reply to you directly.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Number of Travelers
              </label>
              <input
                required
                type="number"
                min="1"
                value={form.travelers}
                onChange={(e) => setForm({ ...form, travelers: e.target.value })}
                placeholder="e.g. 2"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Range</label>
              <select
                required
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              >
                <option value="">Select a range</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Travel Dates (optional)
              </label>
              <input
                value={form.dates}
                onChange={(e) => setForm({ ...form, dates: e.target.value })}
                placeholder="e.g. 12-18 August, or 'flexible'"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Anything else? (optional)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. traveling with kids, need airport pickup..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
          </form>
        </div>

        {/* Sticky submit button - always visible, no need to scroll to find it */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            type="submit"
            form="inquiry-form"
            disabled={sending}
            className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold px-6 py-3 rounded-full disabled:opacity-50"
          >
            {sending ? "Inatuma Ombi..." : "Tuma Ombi (Send Enquiry)"}
          </button>
        </div>
      </div>
    </div>
  );
}
