import { ThumbsUp, ThumbsDown } from "lucide-react";
import { SUITABILITY_OPTIONS } from "../lib/suitability";

// "Good for / Not ideal for" - honest suitability guidance, separate from
// the marketing description. Same graceful-degradation rule as LocalLens
// and AtAGlance: nothing filled in -> nothing rendered.
export default function SuitabilityCard({ item }) {
  const goodFor = SUITABILITY_OPTIONS.filter((s) => (item.good_for || []).includes(s.key));
  const notIdealFor = SUITABILITY_OPTIONS.filter((s) => (item.not_ideal_for || []).includes(s.key));

  if (goodFor.length === 0 && notIdealFor.length === 0) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
      {goodFor.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <ThumbsUp className="w-4 h-4 text-teal-700" /> Good for
          </p>
          <div className="flex flex-wrap gap-1.5">
            {goodFor.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {notIdealFor.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <ThumbsDown className="w-4 h-4 text-slate-400" /> Not ideal for
          </p>
          <div className="flex flex-wrap gap-1.5">
            {notIdealFor.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
