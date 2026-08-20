import { useState } from "react";
import { X, Compass } from "lucide-react";
import { buildTripBuilderLink } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";

// A lightweight "Build My Zanzibar Trip" teaser - 3 quick questions that
// turn into one prefilled WhatsApp message to the Zanzibar Expert line,
// instead of the full AI itinerary-builder planned for later in the
// roadmap. This still removes the blank-chat friction today: the expert
// receives dates, budget and interests in one message and can reply with
// a real day-by-day plan.
export default function TripBuilderModal({ open, onClose }) {
  const [dates, setDates] = useState("");
  const [travelers, setTravelers] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [interests, setInterests] = useState("");

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    trackEvent("trip_builder_submit", { dates, travelers, budget, area, interests });
    const link = buildTripBuilderLink({ dates, travelers, budget, area, interests });
    window.open(link, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-teal-700">
            <Compass className="w-5 h-5" />
            <h2 className="font-bold text-lg text-slate-900">Build My Zanzibar Trip</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Answer a few quick questions and a local Zanzibar expert will reply on WhatsApp with a day-by-day plan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">When are you travelling?</label>
            <input
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="e.g. 12-18 Sept, 6 days"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Travelers</label>
              <input
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                placeholder="e.g. 2 adults"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Budget</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $50-80/day"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Where are you staying? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Nungwi, Stone Town"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              What do you want to do? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. beaches, snorkeling, Stone Town, food"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3.5 rounded-full"
          >
            Get My Itinerary on WhatsApp
          </button>
          <p className="text-xs text-slate-400 text-center">
            Opens WhatsApp with your answers prefilled - a real local expert replies, no bot.
          </p>
        </form>
      </div>
    </div>
  );
}
