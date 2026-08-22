import { Link } from "react-router-dom";
import { COLLECTIONS } from "../data/collections";
import { Compass } from "lucide-react";

// /collections - index of curated lists (report section 8.4 / 5.7). Each
// card links to /collections/:key which does the actual filtering against
// live listings.
export default function Collections() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Curated by us</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-teal-700" />
          Zanzibar Collections
        </h1>
        <p className="text-slate-600">
          Hand-picked lists built around a specific kind of trip - not every listing, just the ones that
          genuinely fit.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.key}
            to={`/collections/${c.key}`}
            className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-teal-300 transition"
          >
            <h2 className="font-bold text-lg text-slate-900 mb-1">{c.title}</h2>
            <p className="text-teal-700 text-sm font-semibold mb-3">{c.tagline}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
