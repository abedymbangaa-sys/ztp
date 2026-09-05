import { useState } from "react";
import { Link } from "react-router-dom";
import { AREAS } from "../data/areas";
import { useSEO } from "../lib/useSEO";
import { trackEvent } from "../lib/analytics";
import { Compass, RefreshCw, ArrowRight } from "lucide-react";
import { useT } from "../lib/i18n";

// Priority 4 - "Where Should I Stay?". A short quiz that maps a visitor's
// priority + travel type to one or two areas from src/data/areas.js, and
// explains WHY using that same file's real whoItSuits/description text -
// never a new claim invented just for this page.
//
// Each option maps to area keys ordered by fit (best match first). Where
// two areas both fit reasonably (e.g. nightlife -> north coast covers both
// Nungwi and Kendwa already), we still only recommend from the areas that
// actually exist in AREAS - no area is invented for the sake of a "perfect"
// answer.
const PRIORITY_OPTIONS = [
  { key: "nightlife", label: "Nightlife & sunset bars", matches: ["north"] },
  { key: "kitesurf", label: "Kite-surfing", matches: ["east"] },
  { key: "history", label: "History & culture", matches: ["stone-town"] },
  { key: "quiet-luxury", label: "Quiet, away from crowds", matches: ["south", "pemba"] },
  { key: "wildlife", label: "Wildlife & nature", matches: ["south", "central"] },
  { key: "swimmable-beach", label: "A beach that's swimmable at any tide", matches: ["north"] },
];

const TRAVELER_OPTIONS = [
  { key: "couple", label: "Couple / honeymoon" },
  { key: "family", label: "Family with children" },
  { key: "solo", label: "Solo" },
  { key: "friends", label: "Friends / group" },
];

// Light nudges only - these never override the priority match, they just
// reorder ties. Backed by the same whoItSuits text already on each area.
const TRAVELER_NUDGE = {
  couple: ["north", "east", "pemba"],
  family: ["north", "stone-town"],
  solo: ["east", "stone-town"],
  friends: ["north"],
};

function rankAreas(priorityKey, travelerKey) {
  const priority = PRIORITY_OPTIONS.find((p) => p.key === priorityKey);
  if (!priority) return [];
  const nudge = TRAVELER_NUDGE[travelerKey] || [];
  return [...priority.matches].sort((a, b) => {
    const ai = nudge.indexOf(a);
    const bi = nudge.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function WhereShouldIStay() {
  const t = useT();
  const [priorityKey, setPriorityKey] = useState(null);
  const [travelerKey, setTravelerKey] = useState(null);
  const [step, setStep] = useState("priority"); // "priority" | "traveler" | "result"

  useSEO({
    title: "Where Should I Stay in Zanzibar? | Zanzibar Paradise Tours",
    description:
      "Answer two quick questions and find the right Zanzibar area for your trip - Stone Town, Nungwi, Kendwa, Paje, the south coast or Pemba.",
    canonical: "https://visitzanzibarparadise.com/where-should-i-stay",
  });

  function choosePriority(key) {
    setPriorityKey(key);
    setStep("traveler");
  }

  function chooseTraveler(key) {
    setTravelerKey(key);
    setStep("result");
    trackEvent("where_should_i_stay_result", { priority: priorityKey, traveler: key });
  }

  function restart() {
    setPriorityKey(null);
    setTravelerKey(null);
    setStep("priority");
  }

  const rankedKeys = step === "result" ? rankAreas(priorityKey, travelerKey) : [];
  const rankedAreas = rankedKeys.map((k) => AREAS.find((a) => a.key === k)).filter(Boolean);
  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.key === priorityKey)?.label;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-1.5 justify-center">
          <Compass className="w-4 h-4" /> {t("Where Should I Stay?")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{t("Find the right part of Zanzibar")}</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          {t("Two quick questions - we'll point you to the area that actually fits, and explain why.")}
        </p>
      </div>

      {step === "priority" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="font-semibold text-slate-900 mb-4">{t("What matters most for this trip?")}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => choosePriority(p.key)}
                className="text-left py-3 px-4 rounded-xl border border-slate-300 hover:border-teal-500 hover:bg-teal-50 transition font-medium text-slate-700"
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "traveler" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <button
            type="button"
            onClick={() => setStep("priority")}
            className="text-xs font-semibold text-slate-400 hover:text-teal-700 mb-4"
          >
            ← {t("Back")}
          </button>
          <p className="font-semibold text-slate-900 mb-4">{t("Who's travelling?")}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {TRAVELER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => chooseTraveler(opt.key)}
                className="text-left py-3 px-4 rounded-xl border border-slate-300 hover:border-teal-500 hover:bg-teal-50 transition font-medium text-slate-700"
              >
                {t(opt.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "result" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500">
              {t("Because you want")} <span className="font-semibold text-slate-700">{priorityLabel ? t(priorityLabel).toLowerCase() : ""}</span>
            </p>
            <button
              type="button"
              onClick={restart}
              className="text-sm font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t("Start over")}
            </button>
          </div>

          {rankedAreas.length === 0 ? (
            <p className="text-slate-500 text-center py-10">
              {t("We couldn't match that combination yet - browse")}{" "}
              <Link to="/collections" className="text-teal-700 font-semibold hover:underline">{t("all areas")}</Link> {t("instead.")}
            </p>
          ) : (
            <div className="space-y-5">
              {rankedAreas.map((area, i) => (
                <div
                  key={area.key}
                  className={
                    "bg-white rounded-2xl overflow-hidden border " +
                    (i === 0 ? "border-teal-500 shadow-md" : "border-slate-200")
                  }
                >
                  <div className="sm:flex">
                    <div className="sm:w-56 h-40 sm:h-auto shrink-0">
                      <img src={area.heroImage} alt={area.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 flex-1">
                      {i === 0 && (
                        <span className="inline-block bg-teal-700 text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2">
                          {t("Best match")}
                        </span>
                      )}
                      <h2 className="text-lg font-bold text-slate-900">{area.name}</h2>
                      <p className="text-teal-700 text-sm font-semibold mb-2">{t(area.tagline)}</p>
                      <p className="text-sm text-slate-600 mb-2">{t(area.description)}</p>
                      <p className="text-xs text-slate-400 mb-3">
                        <span className="font-semibold text-slate-500">{t("Best for:")}</span> {t(area.whoItSuits)}
                      </p>
                      <Link
                        to={`/area/${area.key}`}
                        className="inline-flex items-center gap-1.5 text-teal-700 font-semibold text-sm hover:underline"
                      >
                        {t("See places to stay in")} {area.name} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center mt-8">
            <p className="font-bold text-slate-900 mb-1">{t("Not sure yet, or splitting your trip across areas?")}</p>
            <p className="text-sm text-slate-600 mb-4">
              {t("The Trip Builder can put together a full day-by-day plan across more than one area.")}
            </p>
            <Link
              to="/trip-builder"
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3 rounded-full"
            >
              <Compass className="w-4 h-4" /> {t("Build My Zanzibar Trip")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
