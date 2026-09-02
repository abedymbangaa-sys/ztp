import { Tag } from "lucide-react";
import { TAG_OPTIONS } from "../lib/tags";
import { useT } from "../lib/i18n";

// "Amenities & Features" - the tags a business already picked (halal-friendly,
// eco-certified, family-friendly, beachfront, quiet-private, budget, luxury)
// are used for filtering on the category page and shown as small badges on
// cards, but weren't shown anywhere on the detail page itself. Same
// graceful-degradation rule as the other detail-page cards: nothing set,
// nothing rendered.
export default function AmenitiesCard({ item }) {
  const t = useT();
  const chips = TAG_OPTIONS.filter((tg) => (item.tags || []).includes(tg.key));

  if (chips.length === 0) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
        <Tag className="w-4 h-4 text-teal-700" /> {t("Amenities & Features")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.key}
            className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-100"
          >
            <c.icon className="w-3.5 h-3.5" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
