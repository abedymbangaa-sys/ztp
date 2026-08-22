import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { AREAS } from "../data/areas";
import { buildItineraryConfirmLink } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";
import GenericCard from "../components/GenericCard";
import { Compass, MapPin, Hotel as HotelIcon, RefreshCw, MessageCircle } from "lucide-react";

const DAY_OPTIONS = [
  { value: 3, label: "1-3 days" },
  { value: 5, label: "4-6 days" },
  { value: 8, label: "7+ days" },
];

// Maps a friendly interest label to the category_key values already used
// in the listings table (checked against real data, not guessed).
const INTERESTS = [
  { key: "beaches", label: "Beaches", categories: ["beaches"] },
  { key: "tours", label: "Tours & Excursions", categories: ["tours"] },
  { key: "culture", label: "Culture & Heritage", categories: ["heritage", "attractions"] },
  { key: "nature", label: "Nature & Caves", categories: ["nature", "caves"] },
  { key: "food", label: "Food & Restaurants", categories: ["restaurants"] },
  { key: "unique", label: "Unique Experiences", categories: ["experiences", "sports", "lodges"] },
];

// This is a rule-based planner, not AI - it only ever arranges *real,
// approved listings* already in Supabase into a day-by-day structure.
// It never invents a business, price, or activity. If there aren't
// enough matching listings, it says so plainly instead of padding the
// plan with irrelevant results.
function buildItinerary(listings, days) {
  const hotels = listings.filter((l) => l.category_key === "hotels");
  const activities = listings.filter((l) => l.category_key !== "hotels");

  const dayPlans = Array.from({ length: days }, () => []);
  activities.forEach((item, i) => {
    dayPlans[i % days].push(item);
  });

  return { hotels: hotels.slice(0, 3), dayPlans: dayPlans.filter((d) => d.length > 0) };
}

export default function TripBuilder() {
  const [step, setStep] = useState("form"); // "form" | "results"
  const [days, setDays] = useState(5);
  const [area, setArea] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(["beaches", "tours"]);
  const [travelers, setTravelers] = useState("");
  const [dates, setDates] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useSEO({
    title: "Build My Zanzibar Trip — Free Itinerary Builder | Zanzibar Paradise Tours",
    description:
      "Answer a few quick questions and get an instant day-by-day Zanzibar itinerary built from real, verified hotels, tours and attractions.",
    canonical: "https://visitzanzibarparadise.com/trip-builder",
  });

  function toggleInterest(key) {
    setSelectedInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const categoryKeys = Array.from(
      new Set(
        selectedInterests.flatMap((key) => INTERESTS.find((i) => i.key === key)?.categories || [])
      )
    );

    try {
      let query = supabase.from("listings").select("*").eq("status", "approved");
      if (area) query = query.eq("area", area);

      const { data: hotelsData, error: hotelsError } = await query.eq("category_key", "hotels");
      if (hotelsError) throw hotelsError;

      let activityQuery = supabase.from("listings").select("*").eq("status", "approved");
      if (area) activityQuery = activityQuery.eq("area", area);
      if (categoryKeys.length > 0) activityQuery = activityQuery.in("category_key", categoryKeys);
      const { data: activitiesData, error: activitiesError } = await activityQuery.neq("category_key", "hotels");
      if (activitiesError) throw activitiesError;

      const combined = [...(hotelsData || []), ...(activitiesData || [])];
      const plan = buildItinerary(combined, days);
      setResult(plan);
      setStep("results");
      trackEvent("trip_builder_generated", { days, area: area || "any", interests: selectedInterests.join(",") });
    } catch (err) {
      if (import.meta.env.DEV) console.error("TripBuilder: failed to generate", err);
      setError("Something went wrong building your itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmWithExpert() {
    if (!result) return;
    const allListingTitles = [
      ...result.hotels.map((h) => h.title),
      ...result.dayPlans.flat().map((a) => a.title),
    ];
    trackEvent("trip_builder_confirm_expert", {});
    const link = buildItineraryConfirmLink({ dates, travelers, days, listingTitles: allListingTitles });
    window.open(link, "_blank");
  }

  const areaName = area ? AREAS.find((a) => a.key === area)?.name : "Anywhere in Zanzibar";
  const hasEnoughActivities = result && result.dayPlans.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-1.5 justify-center">
          <Compass className="w-4 h-4" /> Free Trip Builder
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Build My Zanzibar Trip</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Answer a few quick questions and get an instant day-by-day plan, built only from real, verified listings
          on this site - no made-up places, no guessed prices.
        </p>
      </div>

      {step === "form" && (
        <form onSubmit={handleGenerate} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">How many days?</label>
            <div className="grid grid-cols-3 gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDays(d.value)}
                  className={
                    "py-2.5 rounded-full text-sm font-semibold border transition " +
                    (days === d.value
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-700 border-slate-300 hover:border-teal-400")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Where are you staying? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white"
            >
              <option value="">Anywhere in Zanzibar</option>
              {AREAS.map((a) => (
                <option key={a.key} value={a.key}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">What do you want to do?</label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map((i) => (
                <button
                  key={i.key}
                  type="button"
                  onClick={() => toggleInterest(i.key)}
                  className={
                    "py-2.5 px-3 rounded-xl text-sm font-semibold border text-left transition " +
                    (selectedInterests.includes(i.key)
                      ? "bg-teal-50 text-teal-800 border-teal-500"
                      : "bg-white text-slate-700 border-slate-300 hover:border-teal-400")
                  }
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Travel dates <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="e.g. 12-18 Sept"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Travelers <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                placeholder="e.g. 2 adults"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || selectedInterests.length === 0}
            className="w-full bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3.5 rounded-full disabled:opacity-50"
          >
            {loading ? "Building your itinerary..." : "Build My Itinerary"}
          </button>
          {selectedInterests.length === 0 && (
            <p className="text-xs text-amber-600 text-center">Choose at least one interest to continue.</p>
          )}
        </form>
      )}

      {step === "results" && result && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {areaName} · {days <= 3 ? "1-3" : days <= 5 ? "4-6" : "7+"} days
              </p>
            </div>
            <button
              onClick={() => setStep("form")}
              className="text-sm font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          {result.hotels.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold text-slate-900 mb-3 inline-flex items-center gap-2">
                <HotelIcon className="w-5 h-5 text-teal-700" /> Where to Stay
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.hotels.map((h) => (
                  <GenericCard key={h.id} item={h} sectionKey="hotels" />
                ))}
              </div>
            </div>
          )}

          {!hasEnoughActivities ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-10">
              <p className="text-slate-700 font-medium">
                We don't have enough listings matching those interests{area ? ` in ${areaName}` : ""} yet.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try removing the area filter, choosing different interests, or ask a Zanzibar Expert directly below -
                they know options that may not be listed yet.
              </p>
            </div>
          ) : (
            result.dayPlans.map((day, i) => (
              <div key={i} className="mb-10">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Day {i + 1}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {day.map((item) => (
                    <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
            <p className="font-bold text-slate-900 mb-1">Want this confirmed and adjusted for you?</p>
            <p className="text-sm text-slate-600 mb-4">
              A real local Zanzibar expert can check availability, confirm pricing, and fine-tune this plan - no bot.
            </p>
            <button
              onClick={handleConfirmWithExpert}
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3 rounded-full"
            >
              <MessageCircle className="w-4 h-4" /> Confirm with Zanzibar Expert
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            <Link to="/things-to-do" className="hover:underline">Browse all Things to Do</Link> for more options.
          </p>
        </div>
      )}
    </div>
  );
}
