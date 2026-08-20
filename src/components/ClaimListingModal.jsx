import { useState, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

const REQUEST_TYPES = [
  {
    value: "claim",
    label: "This is my business — I want to manage it",
    hint: "We'll connect you with a Partner account so you can update the details yourself.",
  },
  {
    value: "edit_request",
    label: "Some information is incorrect — request a correction",
    hint: "Tell us which part of the listing needs to change.",
  },
  {
    value: "removal_request",
    label: "Remove this listing from the site entirely",
    hint: "We'll remove it within 2 business days, free of charge, no conditions.",
  },
];

export default function ClaimListingModal({ open, onClose, listingId, listingTitle, defaultType = "claim" }) {
  const [requestType, setRequestType] = useState(defaultType);
  const [form, setForm] = useState({ business_name: "", contact_name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setRequestType(defaultType);
  }, [open, defaultType]);

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function reset() {
    setRequestType(defaultType);
    setForm({ business_name: "", contact_name: "", phone: "", email: "", message: "" });
    setDone(false);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.business_name.trim() || !form.phone.trim()) {
      setError("Please fill in the business name and phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("listing_claims").insert({
        listing_id: listingId,
        listing_title: listingTitle,
        request_type: requestType,
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        message: form.message.trim() || null,
        status: "pending",
      });
      if (insertError) throw insertError;
      setDone(true);
    } catch (err) {
      console.error("Claim submit failed", err);
      setError("Couldn't submit your request. Please try again, or contact us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-slate-900">Is this your business?</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {done ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-3">✅</p>
              <p className="font-semibold text-slate-900 mb-2">Request received</p>
              <p className="text-sm text-slate-600 mb-4">
                We'll process it within 2 business days. If it's urgent, you can also reach us directly
                on WhatsApp — you'll find the number on the{" "}
                <a href="/data-source" className="text-teal-700 font-semibold underline">
                  Data Source
                </a>{" "}
                page.
              </p>
              <button
                onClick={handleClose}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-2.5 rounded-full"
              >
                Got it, thanks
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                The listing for <span className="font-semibold">{listingTitle}</span> was created using publicly
                available information (e.g. Google Maps, social media). If you're the owner,
                choose what you'd like us to do — this service is free.
              </p>

              <div className="space-y-2">
                {REQUEST_TYPES.map((rt) => (
                  <label
                    key={rt.value}
                    className={
                      "flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition " +
                      (requestType === rt.value
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300")
                    }
                  >
                    <input
                      type="radio"
                      name="request_type"
                      value={rt.value}
                      checked={requestType === rt.value}
                      onChange={() => setRequestType(rt.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-sm text-slate-900">{rt.label}</span>
                      <span className="block text-xs text-slate-500">{rt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Business name *</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => update("business_name", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Your name</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => update("contact_name", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone / WhatsApp number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="E.g. which detail is incorrect, or proof of ownership"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold py-3 rounded-full"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
