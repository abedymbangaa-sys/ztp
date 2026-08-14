import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, CheckCircle2 } from "lucide-react";

// General-purpose contact form (not tied to a specific hotel/listing).
// Saves straight into the existing `inquiries` table so submissions show up
// alongside other leads wherever those are already reviewed.
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setStatus("sending");
    const { error } = await supabase.from("inquiries").insert({
      visitor_name: form.name.trim(),
      visitor_email: form.email.trim(),
      message: form.message.trim(),
    });

    if (error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-6 text-teal-800">
        <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Message sent!</p>
          <p className="text-sm mt-1">Thanks for reaching out — we'll get back to you by email soon.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong sending your message. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full text-sm disabled:opacity-60"
      >
        {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
