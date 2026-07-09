import { useRelatedListings } from "../data/hooks";
import GenericCard from "./GenericCard";

// "You might also like" - shown at the bottom of a listing's detail page,
// pulling other approved listings from the same category (hotels, beaches,
// etc). Renders nothing while loading or if there's nothing to show, so it
// never leaves an awkward empty section on the page.
export default function RelatedListings({ categoryKey, excludeId, title = "You might also like" }) {
  const { related, loading } = useRelatedListings(categoryKey, excludeId, 4);

  if (loading || related.length === 0) return null;

  return (
    <div className="mt-14 pt-10 border-t border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((item) => (
          <GenericCard key={item.id} item={item} sectionKey={categoryKey} />
        ))}
      </div>
    </div>
  );
}
