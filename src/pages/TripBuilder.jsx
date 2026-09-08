import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { AREAS } from "../data/areas";
import { buildItineraryConfirmLink } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";
import GenericCard from "../components/GenericCard";
import { Compass, MapPin, Hotel as HotelIcon, RefreshCw, MessageCircle, Sparkles } from "lucide-react";
import { useT } from "../lib/i18n";

const DAY_OPTIONS = [
  { value: 3, label: "1-3 days" },
  { value: 5, label: "4-6 days" },
  { value: 8, label: "7+ days" },
];

// Priority 2 asks for traveller type and budget as explicit selectors, not
// free text. Both map to real columns already used elsewhere on the site
// (good_for / tags) - see suitability.js and tags.js - so this reuses the
// same fields Compare and the Collections already read, nothing new.
const TRAVELER_TYPES = [
  { key: "couple", label: "Couple", goodFor: ["couples"] },
  { key: "family", label: "Family", goodFor: ["families-with-kids"] },
  { key: "solo", label: "Solo", goodFor: ["solo-travelers"] },
  { key: "friends", label: "Friends", goodFor: ["groups"] },
  { key: "honeymoon", label: "Honeymoon", goodFor: ["couples"], tags: ["luxury"] },
];

const BUDGET_TIERS = [
  { key: "budget", label: "Budget", tags: ["budget"] },
  { key: "mid-range", label: "Mid-range", tags: [] },
  { key: "luxury", label: "Luxury", tags: ["luxury"] },
];

// "Zanzibar Mood Planner" - a fast lane into the same rule-based engine
// below, not a separate feature. Each mood pre-fills interests/traveler
// type/budget with a sensible combination and jumps straight to results,
// for someone who wants a plan in one tap rather than answering every
// question. The full form is still there underneath for anyone who wants
// to fine-tune instead.
const MOODS = [
  {
    key: "free",
    label: "I want to feel free",
    tagline: "Open beaches, no fixed plan, room to wander.",
    interests: ["beaches", "unique"],
    travelerTypeKey: "",
    budgetTierKey: "mid-range",
  },
  {
    key: "romance",
    label: "I want romance",
    tagline: "Sunset dinners, private stays, just the two of you.",
    interests: ["beaches", "food"],
    travelerTypeKey: "honeymoon",
    budgetTierKey: "luxury",
  },
  {
    key: "culture",
    label: "I want culture deep",
    tagline: "Stone Town history, heritage sites, real local food.",
    interests: ["culture", "food"],
    travelerTypeKey: "",
    budgetTierKey: "",
  },
  {
    key: "rest",
    label: "I want pure rest",
    tagline: "Quiet beachfront, slow mornings, nothing on the clock.",
    interests: ["beaches"],
    travelerTypeKey: "",
    budgetTierKey: "",
  },
  {
    key: "adventure",
    label: "I want adventure without crowds",
    tagline: "Nature, caves and tours away from the busy spots.",
    interests: ["nature", "tours"],
    travelerTypeKey: "solo",
    budgetTierKey: "",
  },
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
//
// travelerType/budgetTier PRIORITIZE matching hotels to the front rather
// than excluding non-matches - a couple travelling budget-conscious should
// still see hotels if none happen to be tagged "budget", just with the
// best-fitting ones shown first.
function scoreHotel(item, travelerType, budgetTier) {
  let score = 0;
  if (travelerType?.goodFor?.some((k) => (item.good_for || []).includes(k))) score += 2;
  if (travelerType?.tags?.some((t) => (item.tags || []).includes(t))) score += 1;
  if (budgetTier?.key === "mid-range") {
    const isExtreme = (item.tags || []).some((t) => t === "budget" || t === "luxury");
    if (!isExtreme) score += 2;
  } else if (budgetTier?.tags?.some((t) => (item.tags || []).includes(t))) {
    score += 2;
  }
  return score;
}

function buildItinerary(listings, days, travelerType, budgetTier) {
  const hotels = [...listings.filter((l) => l.category_key === "hotels")].sort(
    (a, b) => scoreHotel(b, travelerType, budgetTier) - scoreHotel(a, travelerType, budgetTier)
  );
  const activities = listings.filter((l) => l.category_key !== "hotels");

  const dayPlans = Array.from({ length: days }, () => []);
  activities.forEach((item, i) => {
    dayPlans[i % days].push(item);
  });

  return { hotels: hotels.slice(0, 3), dayPlans: dayPlans.filter((d) => d.length > 0) };
}

export default function TripBuilder() {
  const t = useT();
  const [step, setStep] = useState("form"); // "form" | "results"
  const [days, setDays] = useState(5);
  const [area, setArea] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(["beaches", "tours"]);
  const [travelerTypeKey, setTravelerTypeKey] = useState("");
  const [budgetTierKey, setBudgetTierKey] = useState("");
  const [travelers, setTravelers] = useState("");
  const [dates, setDates] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [moodKey, setMoodKey] = useState("");

  useSEO({
    title: "Build My Zanzibar Trip — Free Itinerary Builder | Zanzibar Paradise Tours",
    description:
      "Answer a few quick questions and get an instant day-by-day Zanzibar itinerary built from real, verified hotels, tours and attractions.",
    canonical: "https://visitzanzibarparadise.com/trip-builder",
  });

  function toggleInterest(key) {
    setSelectedInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleGenerate(e, overrides = {}) {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    setError(null);
    setMoodKey(overrides.moodKey || "");

    // Mood quick-picks call this directly with fresh values instead of
    // relying on state (which wouldn't have updated yet in the same tick).
    const interests = overrides.interests || selectedInterests;
    const effectiveTravelerTypeKey = overrides.travelerTypeKey ?? travelerTypeKey;
    const effectiveBudgetTierKey = overrides.budgetTierKey ?? budgetTierKey;
    const effectiveArea = overrides.area ?? area;

    const categoryKeys = Array.from(
      new Set(interests.flatMap((key) => INTERESTS.find((i) => i.key === key)?.categories || []))
    );

    try {
      let query = supabase.from("listings").select("*").eq("status", "approved");
      if (effectiveArea) query = query.eq("area", effectiveArea);

      const { data: hotelsData, error: hotelsError } = await query.eq("category_key", "hotels");
      if (hotelsError) throw hotelsError;

      let activityQuery = supabase.from("listings").select("*").eq("status", "approved");
      if (effectiveArea) activityQuery = activityQuery.eq("area", effectiveArea);
      if (categoryKeys.length > 0) activityQuery = activityQuery.in("category_key", categoryKeys);
      const { data: activitiesData, error: activitiesError } = await activityQuery.neq("category_key", "hotels");
      if (activitiesError) throw activitiesError;

      const combined = [...(hotelsData || []), ...(activitiesData || [])];
      const travelerType = TRAVELER_TYPES.find((t) => t.key === effectiveTravelerTypeKey);
      const budgetTier = BUDGET_TIERS.find((b) => b.key === effectiveBudgetTierKey);
      const plan = buildItinerary(combined, days, travelerType, budgetTier);
      setResult(plan);
      setStep("results");
      trackEvent("trip_builder_generated", {
        days,
        area: effectiveArea || "any",
        interests: interests.join(","),
        traveler_type: effectiveTravelerTypeKey || "unspecified",
        budget_tier: effectiveBudgetTierKey || "unspecified",
        mood: overrides.moodKey || "none",
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error("TripBuilder: failed to generate", err);
      setError("Something went wrong building your itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleMoodPick(mood) {
    setSelectedInterests(mood.interests);
    setTravelerTypeKey(mood.travelerTypeKey);
    setBudgetTierKey(mood.budgetTierKey);
    setMoodKey(mood.key);
    trackEvent("mood_planner_pick", { mood: mood.key });
    handleGenerate(null, {
      interests: mood.interests,
      travelerTypeKey: mood.travelerTypeKey,
      budgetTierKey: mood.budgetTierKey,
      moodKey: mood.key,
    });
  }

  function handleConfirmWithExpert() {
    if (!result) return;
    const allListingTitles = [
      ...result.hotels.map((h) => h.title),
      ...result.dayPlans.flat().map((a) => a.title),
    ];
    trackEvent("trip_builder_confirm_expert", {});
    const link = buildItineraryConfirmLink({
      dates,
      travelers,
      days,
      listingTitles: allListingTitles,
      travelerTypeLabel: TRAVELER_TYPES.find((t) => t.key === travelerTypeKey)?.label,
      budgetTierLabel: BUDGET_TIERS.find((b) => b.key === budgetTierKey)?.label,
    });
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
        <>
          <div className="mb-6">
            <p className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-700" /> Or just pick a mood — we'll do the rest
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MOODS.map((mood) => (
                <button
                  key={mood.key}
                  type="button"
                  disabled={loading}
                  onClick={() => handleMoodPick(mood)}
                  className="text-left bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition rounded-xl px-4 py-3 disabled:opacity-60"
                >
                  <span className="block text-sm font-bold text-slate-900">{t(mood.label)}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{t(mood.tagline)}</span>
                </button>
              ))}
            </div>
            {loading && moodKey && (
              <p className="text-xs text-teal-700 mt-2 font-semibold">Building your {MOODS.find((m) => m.key === moodKey)?.label.toLowerCase()} plan...</p>
            )}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400 font-semibold">OR ANSWER A FEW QUESTIONS</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
          </div>

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
              {t("Where are you staying?")} <span className="text-slate-400 font-normal">{t("(optional)")}</span>
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t("Who's travelling?")} <span className="text-slate-400 font-normal">{t("(optional)")}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAVELER_TYPES.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTravelerTypeKey((prev) => (prev === opt.key ? "" : opt.key))}
                  className={
                    "py-2 px-4 rounded-full text-sm font-semibold border transition " +
                    (travelerTypeKey === opt.key
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-700 border-slate-300 hover:border-teal-400")
                  }
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t("Approximate budget")} <span className="text-slate-400 font-normal">{t("(optional)")}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_TIERS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBudgetTierKey((prev) => (prev === b.key ? "" : b.key))}
                  className={
                    "py-2 px-4 rounded-full text-sm font-semibold border transition " +
                    (budgetTierKey === b.key
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-700 border-slate-300 hover:border-teal-400")
                  }
                >
                  {t(b.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {t("Travel dates")} <span className="text-slate-400 font-normal">{t("(optional)")}</span>
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
                {t("Number of travelers")} <span className="text-slate-400 font-normal">{t("(optional)")}</span>
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                placeholder="e.g. 2"
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
        </>
      )}

      {step === "results" && result && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              {moodKey && (
                <p className="text-xs font-bold text-teal-700 inline-flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" /> {MOODS.find((m) => m.key === moodKey)?.label}
                </p>
              )}
              <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {areaName} · {days <= 3 ? "1-3" : days <= 5 ? "4-6" : "7+"} days
                {travelerTypeKey && ` · ${TRAVELER_TYPES.find((t) => t.key === travelerTypeKey)?.label}`}
                {budgetTierKey && ` · ${BUDGET_TIERS.find((b) => b.key === budgetTierKey)?.label}`}
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
