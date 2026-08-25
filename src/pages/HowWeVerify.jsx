import { Link } from "react-router-dom";
import { VERIFICATION_CHECKS } from "../lib/verificationStandard";

// Explains what the homepage's "X% Verified by Our Team" stat actually
// means and how a listing earns it. Written once here and linked from
// that stat (see StatsCounter.jsx) instead of leaving a bare percentage
// with no explanation - a visitor who wonders "verified how, and why
// isn't it 100%?" now has a real, honest answer instead of guessing.
export default function HowWeVerify() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">How We Verify Listings</h1>
      <p className="text-slate-500 mb-10">
        What the "Verified by Our Team" number on our homepage actually means.
      </p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Every listing on Zanzibar Paradise Tours goes through the same fixed checklist below. A check
          only counts as done once someone on our team has actually confirmed it — never automatically,
          and never just because a business claims it.
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">The checklist</h2>
        <ul className="space-y-3">
          {VERIFICATION_CHECKS.map((check) => (
            <li key={check.key} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <check.icon className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">{check.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{check.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-bold text-slate-900 pt-4">Why the number isn't 100%</h2>
        <p>
          The percentage you see counts only listings where our team has personally confirmed identity,
          location and photos. New listings — especially ones we've added from publicly available
          information rather than a business's own submission — start unverified and move into the
          verified count as our (small, local) team works through the checklist. We'd rather show you an
          honest, current number than an inflated one.
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">What verification doesn't cover</h2>
        <p>
          Verification means we reviewed selected business information against the checklist above. It
          does not guarantee availability, prices, payment terms, or the quality of service on any given
          day. Always confirm final details directly with the business before booking.
        </p>

        <p className="pt-4">
          You can see exactly which checks a specific business has passed on its own listing page, under
          "How we verify."
        </p>

        <p>
          <Link to="/about" className="text-teal-700 font-semibold hover:underline">
            ← More about Zanzibar Paradise Tours
          </Link>
        </p>
      </div>
    </div>
  );
}
