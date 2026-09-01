import { Link } from "react-router-dom";
import { useListings } from "../data/hooks";
import { filterListingsForCollection } from "../data/collections";
import GenericCard from "../components/GenericCard";
import { useSEO } from "../lib/useSEO";
import { Wallet, Gem, Compass } from "lucide-react";

const TIERS = [
  {
    key: "budget",
    label: "Budget Zanzibar",
    icon: Wallet,
    blurb: "Real value without cutting the experience short - selected for genuine value for money, not just the lowest sticker price.",
    match: { tags: ["budget"] },
  },
  {
    key: "mid-range",
    label: "Mid-Range Zanzibar",
    icon: Compass,
    blurb: "Comfortable, well-run places that aren't chasing either extreme - the largest group of listings on the site.",
    // Mid-range isn't a tag a business picks (unlike budget/luxury) - it's
    // simply everything NOT tagged as either extreme, computed here rather
    // than added to collections.js since it's a negative rule specific to
    // this page.
    match: null,
  },
  {
    key: "luxury",
    label: "Luxury Zanzibar",
    icon: Gem,
    blurb: "For travellers who want Zanzibar at its most polished - selected for high-end finish, service standard and privacy.",
    match: { tags: ["luxury"] },
  },
];

export default function ZanzibarByBudget() {
  const { listings, loading, error } = useListings();

  useSEO({
    title: "Zanzibar by Budget - Budget, Mid-Range & Luxury | Zanzibar Paradise Tours",
    description: "Browse Zanzibar hotels, tours and restaurants by budget tier - budget, mid-range or luxury - using real listings, not estimated prices.",
    canonical: "https://visitzanzibarparadise.com/zanzibar-by-budget",
  });

  const budgetIds = new Set(filterListingsForCollection(listings, { tags: ["budget"] }).map((l) => l.id));
  const luxuryIds = new Set(filterListingsForCollection(listings, { tags: ["luxury"] }).map((l) => l.id));
  const midRange = listings.filter((l) => !budgetIds.has(l.id) && !luxuryIds.has(l.id));

  const grouped = {
    budget: filterListingsForCollection(listings, { tags: ["budget"] }),
    "mid-range": midRange,
    luxury: filterListingsForCollection(listings, { tags: ["luxury"] }),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Plan around what you want to spend</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Zanzibar by Budget</h1>
        <p className="text-slate-600">
          Every listing sets its own price range, shown on its card - we don't estimate a daily total for you, since
          that changes with the season, the operator, and how you travel. What we can do is group real listings by
          tier, so you're browsing the right ones from the start.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          For visa fees and other fixed costs that apply to every visitor, see the{" "}
          <Link to="/before-you-go" className="text-teal-700 font-semibold hover:underline">Before You Go guide</Link>.
        </p>
      </div>

      {error && <p className="text-center text-slate-500 py-10">{error}</p>}

      {!error &&
        TIERS.map((tier) => {
          const items = grouped[tier.key] || [];
          return (
            <section key={tier.key} className="mb-14">
              <div className="flex items-center gap-3 mb-1">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 text-teal-700">
                  <tier.icon className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900">{tier.label}</h2>
              </div>
              <p className="text-slate-500 text-sm mb-5 max-w-2xl">{tier.blurb}</p>

              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                      <div className="w-full h-40 bg-slate-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-slate-400">No listings tagged for this tier yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.slice(0, 6).map((item) => (
                    <GenericCard key={item.id} item={item} sectionKey={item.category_key} />
                  ))}
                </div>
              )}

              {items.length > 6 && (
                <Link
                  to={tier.key === "mid-range" ? "/things-to-do" : `/collections/${tier.key === "budget" ? "budget" : "luxury"}`}
                  className="inline-block mt-4 text-teal-700 font-semibold text-sm hover:underline"
                >
                  See all {items.length} →
                </Link>
              )}
            </section>
          );
        })}
    </div>
  );
}
