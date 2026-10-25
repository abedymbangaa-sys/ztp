import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getStoredUTM } from "../lib/utm";
import { sendNotificationEmail } from "../lib/email";
import { trackEvent } from "../lib/analytics";

// "Request a custom itinerary" form.
//
// A visitor tells us dates / group / interests and we reply with a suggested
// plan. It is FREE and asks nothing about payment. The only money-related
// thing is an optional tick box ("also send me an estimated cost") that the
// visitor chooses themselves - nothing about prices is shown unless they ask.
//
// Each request is saved in the existing `inquiries` table (no database change
// needed - it uses the traveler_*, travelers_count, budget, travel_dates and
// notes columns) and a notification email goes to info@visitzanzibarparadise.com
// through the same EmailJS helper the other forms use.

const NOTIFY_EMAIL = "info@visitzanzibarparadise.com";

const DAYS_OPTIONS = ["2-3 days", "4-5 days", "6-7 days", "8-10 days", "More than 10 days", "Not sure yet"];
const STYLE_OPTIONS = ["Budget-friendly", "Mid-range", "Comfort / luxury", "Mix of everything", "Not sure yet"];
const INTERESTS = [
  "Beaches & relaxing",
  "Culture & history",
  "Food & markets",
  "Nature & wildlife",
  "Water activities",
  "Romantic trip",
  "Family-friendly",
  "Adventure",
];

const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600";

export default function CustomItineraryModal({ open, onClose, sourcePage }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: "",
    days: "",
    dates: "",
    style: "",
    interests: [],
    notes: "",
    wantsEstimate: false,
    website: "", // honeypot - real visitors never see or fill this
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleInterest(label) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter((i) => i !== label)
        : [...prev.interests, label],
    }));
  }

  function handleClose() {
    onClose();
    // Let a visitor who already sent a request start a fresh one next time.
    if (status === "sent") {
      setStatus("idle");
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        travelers: "",
        days: "",
        dates: "",
        style: "",
        interests: [],
        notes: "",
        wantsEstimate: false,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    // Honeypot filled in = a bot. Pretend it worked, send nothing.
    if (form.website) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    const utm = getStoredUTM();
    const name = form.name.trim().slice(0, 120);
    const email = form.email.trim().slice(0, 160);
    const phone = form.phone.trim().slice(0, 40);
    const travelers = Number.parseInt(form.travelers, 10) || null;
    const dates = form.dates.trim().slice(0, 120);
    const notes = form.notes.trim().slice(0, 1500);
    const interests = form.interests.join(", ");
    const styleLabel = [form.style, form.wantsEstimate ? "cost estimate requested" : ""]
      .filter(Boolean)
      .join(" - ");

    const details = [
      "CUSTOM ITINERARY REQUEST",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone / WhatsApp: ${phone}` : null,
      `Travelers: ${travelers ?? "-"}`,
      `Trip length: ${form.days || "-"}`,
      `Travel dates: ${dates || "-"}`,
      `Hotel style: ${form.style || "-"}`,
      `Interests: ${interests || "-"}`,
      `Wants a cost estimate: ${form.wantsEstimate ? "YES" : "no"}`,
      notes ? `Notes: ${notes}` : null,
      sourcePage ? `Sent from: ${sourcePage}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("inquiries").insert({
      visitor_name: name,
      traveler_name: name,
      visitor_email: email,
      visitor_phone: phone || null,
      traveler_phone: phone || null,
      travelers_count: travelers,
      budget: styleLabel || null,
      travel_dates: [form.days, dates].filter(Boolean).join(" | ") || null,
      message: "CUSTOM ITINERARY REQUEST",
      notes: details.slice(0, 3000),
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
    });

    if (error) {
      setStatus("error");
      return;
    }

    trackEvent("submit_custom_itinerary", { wants_estimate: form.wantsEstimate });

    // Never block the success message if the email fails - the request is
    // already safely stored and shows up in Admin Dashboard -> Inquiries.
    try {
      await sendNotificationEmail({
        toEmail: NOTIFY_EMAIL,
        toName: "ZTP Team",
        subject: `Custom itinerary request from ${name}`,
        message: `${details}\n\nReply to the visitor at ${email}${phone ? ` or on WhatsApp ${phone}` : ""}.`,
      });
    } catch (err) {
      console.error("Could not send custom itinerary notification email", err);
    }

    setStatus("sent");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-itinerary-title"
      >
        <div className="p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-1">
            <h2 id="custom-itinerary-title" className="font-bold text-lg text-slate-900">
              Get a custom Zanzibar itinerary
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {status === "sent" ? (
            <div className="mt-4 flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-5 text-teal-800">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Request received. Thank you!</p>
                <p className="text-sm mt-1">
                  We will read your details and send a suggested itinerary to your email
                  {form.phone ? " (and WhatsApp)" : ""}. Please check your spam folder if you don't see it.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2 rounded-full text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Free. Tell us about your trip and we will suggest a plan using places from our directory.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Your name</label>
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Sarah"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    maxLength={160}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    WhatsApp number (optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={40}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="e.g. +44 7XXX XXX XXX"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Travelers</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="50"
                      value={form.travelers}
                      onChange={(e) => update("travelers", e.target.value)}
                      placeholder="e.g. 2"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Trip length</label>
                    <select
                      required
                      value={form.days}
                      onChange={(e) => update("days", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {DAYS_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Travel dates (optional)
                  </label>
                  <input
                    maxLength={120}
                    value={form.dates}
                    onChange={(e) => update("dates", e.target.value)}
                    placeholder="e.g. 12-18 August, or 'flexible'"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Hotel style (optional)
                  </label>
                  <select value={form.style} onChange={(e) => update("style", e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {STYLE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="block text-sm font-semibold text-slate-700 mb-1.5">What do you enjoy?</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((label) => {
                      const active = form.interests.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleInterest(label)}
                          aria-pressed={active}
                          className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${
                            active
                              ? "bg-teal-700 border-teal-700 text-white"
                              : "bg-white border-slate-300 text-slate-700 hover:border-teal-600"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Anything else we should know? (optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="e.g. honeymoon, travelling with a toddler, want to see dolphins"
                    className={inputClass}
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wantsEstimate}
                    onChange={(e) => update("wantsEstimate", e.target.checked)}
                    className="mt-1"
                  />
                  <span>Also send me an estimated cost for this plan</span>
                </label>

                {/* Honeypot: hidden from people, tempting for bots. */}
                <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                    />
                  </label>
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-600">
                    Something went wrong sending your request. Please try again.
                  </p>
                )}

                <p className="text-xs text-slate-400">
                  Suggested plans are a guide only. Availability and any prices must be confirmed directly with
                  each business. We use your details only to reply to this request. See our{" "}
                  <Link to="/privacy" onClick={handleClose} className="underline hover:text-slate-600">
                    Privacy Policy
                  </Link>
                  .
                </p>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3 rounded-full text-sm disabled:opacity-60"
                >
                  {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === "sending" ? "Sending..." : "Send my request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
