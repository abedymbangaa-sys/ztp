import { Volume2, Footprints, Sparkles } from "lucide-react";

const NOISE_LABELS = {
  quiet: "Quiet",
  moderate: "Moderate",
  lively: "Lively",
};

// "Zanzibar Local Lens" - a small, honest insider-info card, separate from
// the marketing description. Only renders fields that are actually filled
// in - a listing with none of these set shows nothing, rather than an
// empty or placeholder-filled box.
export default function LocalLens({ item }) {
  const hasAny = item.lens_noise_level || item.lens_walk_note || item.lens_local_tip;
  if (!hasAny) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-teal-700" /> Zanzibar Local Lens
      </p>
      <div className="space-y-3">
        {item.lens_noise_level && (
          <div className="flex items-start gap-2.5">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{NOISE_LABELS[item.lens_noise_level]}</span> atmosphere
            </p>
          </div>
        )}
        {item.lens_walk_note && (
          <div className="flex items-start gap-2.5">
            <Footprints className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">{item.lens_walk_note}</p>
          </div>
        )}
        {item.lens_local_tip && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
            <p className="text-sm text-teal-800 leading-relaxed">💡 {item.lens_local_tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
