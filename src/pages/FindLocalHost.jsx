import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { buildHostChatLink } from "../lib/whatsapp";
import { trackEvent } from "../lib/analytics";
import { MessageCircle, RefreshCw, Sparkles } from "lucide-react";

const STYLES = [
  { key: "quiet_beach", label: "Quiet beach" },
  { key: "party", label: "Party" },
  { key: "culture", label: "Culture" },
  { key: "family", label: "Family" },
  { key: "romantic", label: "Romantic" },
  { key: "adventure", label: "Adventure" },
];

const BUDGETS = [
  { key: "budget", label: "Budget" },
  { key: "mid-range", label: "Mid-range" },
  { key: "luxury", label: "Luxury" },
];

const DAYS = [
  { key: "3", label: "1-3 days" },
  { key: "5", label: "4-6 days" },
  { key: "8", label: "7+ days" },
];

const PREFERENCES = [
  { key: "halal", label: "Halal food" },
  { key: "kids_friendly", label: "Kid-friendly" },
  { key: "no_crowds", label: "No crowds" },
  { key: "spice_lover", label: "Spice lover" },
];

// Scores every published host against the quiz answers so the best
// matches float to the top. Style match matters most (it's the core of
// what someone is looking for), preferences and budget are secondary
// signals - this mirrors the weighting already used in TripBuilder's
// listing-matching logic (interests > traveler type > budget).
function scoreHost(host, answers) {
  let score = 0;
  if (answers.style && host.style_tags?.includes(answers.style)) score += 3;
  if (answers.budget && host.budget_tiers?.includes(answers.budget)) score += 1;
  answers.preferences.forEach((p) => {
    if (host.preference_tags?.includes(p)) score += 1;
  });
  return score;
}

export default function FindLocalHost() {
  useSEO({
    title: "Find My Local Host | Zanzibar Paradise Tours",
    description:
      "Answer a few quick questions and get matched with a real local host in Zanzibar who knows exactly what you're after.",
    canonical: "https://visitzanzibarparadise.com/find-host",
  });

  const [step, setStep] = useState(0); // 0 = quiz, 1 = results
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [preferences, setPreferences] = useState([]);

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    supabase
      .from("hosts")
      .select("*")
      .eq("is_published", true)
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
        } else {
          setHosts(data || []);
        }
        setLoading(false);
      });
  }, []);

  const togglePreference = (key) => {
    setPreferences((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const canSubmit = style && budget && days;

  const handleSubmit = () => {
    trackEvent("host_match_submitted", { style, budget, days, preferences });
    setStep(1);
  };

  const handleReset = () => {
    setStyle("");
    setBudget("");
    setDays("");
    setPreferences([]);
    setStep(0);
  };

  const matches = hosts
    .map((h) => ({ ...h, _score: scoreHost(h, { style, budget, preferences }) }))
    .filter((h) => h._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  const styleLabel = STYLES.find((s) => s.key === style)?.label;
  const budgetLabel = BUDGETS.find((b) => b.key === budget)?.label;
  const daysLabel = DAYS.find((d) => d.key === days)?.label;
  const preferenceLabels = PREFERENCES.filter((p) => preferences.includes(p.key)).map(
    (p) => p.label
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" /> Local Host Match
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Find My Local Host
        </h1>
        <p className="text-slate-600 mt-2">
          Answer a few quick questions and chat directly with a real local who knows Zanzibar
          inside out.
        </p>
      </div>

      {step === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <p className="font-semibold text-slate-800 mb-2">What's your style?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(s.key)}
                  className={
                    "text-sm font-semibold px-3 py-2.5 rounded-xl border transition " +
                    (style === s.key
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "bg-white border-slate-300 text-slate-700 hover:border-teal-400")
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 mb-2">Budget</p>
            <div className="grid grid-cols-3 gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBudget(b.key)}
                  className={
                    "text-sm font-semibold px-3 py-2.5 rounded-xl border transition " +
                    (budget === b.key
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "bg-white border-slate-300 text-slate-700 hover:border-teal-400")
                  }
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 mb-2">Days in Zanzibar</p>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDays(d.key)}
                  className={
                    "text-sm font-semibold px-3 py-2.5 rounded-xl border transition " +
                    (days === d.key
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "bg-white border-slate-300 text-slate-700 hover:border-teal-400")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 mb-2">
              Anything else? <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePreference(p.key)}
                  className={
                    "text-sm font-semibold px-3 py-2.5 rounded-xl border transition " +
                    (preferences.includes(p.key)
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "bg-white border-slate-300 text-slate-700 hover:border-teal-400")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full bg-teal-700 hover:bg-teal-800 transition text-white font-bold py-3 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Find My Host
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-600 text-sm">
              Matched on: <span className="font-semibold text-slate-800">{styleLabel}</span>,{" "}
              {budgetLabel}, {daysLabel}
              {preferenceLabels.length ? `, ${preferenceLabels.join(", ")}` : ""}
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              <RefreshCw className="w-4 h-4" /> Start over
            </button>
          </div>

          {loading && <p className="text-slate-500 text-sm">Loading hosts...</p>}
          {loadError && <p className="text-red-600 text-sm">{loadError}</p>}

          {!loading && matches.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-slate-700 font-semibold mb-1">No exact match yet</p>
              <p className="text-slate-500 text-sm">
                We're still growing our local host network. Try a different style, or{" "}
                <a href="https://wa.me/255635442732" className="text-teal-700 font-semibold">
                  chat with the Zanzibar Expert
                </a>{" "}
                instead.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {matches.map((host) => {
              const chatLink = buildHostChatLink(host, {
                styleLabel,
                budgetLabel,
                daysLabel,
                preferenceLabels,
              });
              return (
                <div
                  key={host.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4"
                >
                  {host.photo_url ? (
                    <img
                      src={host.photo_url}
                      alt={host.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {host.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{host.name}</p>
                    {host.bio && <p className="text-sm text-slate-500 mb-1">{host.bio}</p>}
                    {host.recommends_text && (
                      <p className="text-sm text-slate-700 italic mb-2">
                        "{host.recommends_text}"
                      </p>
                    )}
                    {host.video_url && (
                      <video
                        src={host.video_url}
                        controls
                        playsInline
                        className="w-full max-h-40 rounded-lg mb-2"
                      />
                    )}
                    {chatLink && (
                      <a
                        href={chatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent("host_whatsapp_click", {
                            host_id: host.id,
                            host_name: host.name,
                          })
                        }
                        className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white text-sm font-semibold px-4 py-2 rounded-full"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat with {host.name.split(" ")[0]}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
