import { DollarSign, Clock, MapPin, Car, Users, PackageCheck, XCircle, ShieldCheck, Star, BadgeCheck } from "lucide-react";
import { formatLocation } from "../lib/locations";
import { formatVerifiedDate } from "../lib/verificationStandard";
import { useListingRatingSummary } from "../data/hooks";
import { useT } from "../lib/i18n";

// Compact "At a glance" facts strip near the top of a listing detail
// page. Every row is real, admin-entered data - a field that hasn't
// been filled in is either hidden entirely (price, duration, start
// time, group size, inclusions) or shown as a truthful "Ask the
// business" (pickup) rather than invented, per the site's verification
// standard. If nothing at all is available, the whole card renders
// nothing instead of an empty box.
export default function AtAGlance({ item }) {
  const t = useT();
  const { average, count, loading: ratingLoading } = useListingRatingSummary(item?.id);

  if (!item) return null;

  const rows = [];

  if (item.price_range) {
    rows.push({ icon: DollarSign, label: t("Price"), value: item.price_range });
  }
  if (item.duration) {
    rows.push({ icon: Clock, label: t("Duration"), value: item.duration });
  }
  if (item.start_time) {
    rows.push({ icon: Clock, label: t("Starting time"), value: item.start_time });
  }
  if (item.location) {
    rows.push({ icon: MapPin, label: t("Location"), value: formatLocation(item.location) });
  }
  if (item.pickup_available === true) {
    rows.push({ icon: Car, label: t("Pickup"), value: t("Available") });
  } else if (item.pickup_available === false) {
    rows.push({ icon: Car, label: t("Pickup"), value: t("Not offered") });
  } else if (item.whatsapp_number) {
    // Explicitly unknown (NULL) - truthful placeholder rather than a
    // guess, and only shown if there's actually a way to ask.
    rows.push({ icon: Car, label: t("Pickup"), value: t("Ask the business"), muted: true });
  }
  if (item.group_size) {
    rows.push({ icon: Users, label: t("Group size"), value: item.group_size });
  }
  if (item.key_inclusions) {
    rows.push({ icon: PackageCheck, label: t("Inclusions"), value: item.key_inclusions });
  }
  if (item.key_exclusions) {
    rows.push({ icon: XCircle, label: t("Not included"), value: item.key_exclusions });
  }
  if (item.weather_policy) {
    rows.push({ icon: ShieldCheck, label: t("Cancellation policy"), value: item.weather_policy });
  }
  if (!ratingLoading && count > 0) {
    rows.push({ icon: Star, label: t("Rating"), value: `${average} (${count} ${count === 1 ? t("review") : t("reviews")})` });
  }
  if (item.last_verified_at) {
    rows.push({ icon: BadgeCheck, label: t("Last verified"), value: formatVerifiedDate(item.last_verified_at) });
  }

  if (rows.length === 0) return null;

  return (
    <div className="mb-6 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-3">{t("At a glance")}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2.5">
            <row.icon className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <dt className="text-xs text-slate-400">{row.label}</dt>
              <dd className={"text-sm font-medium " + (row.muted ? "text-slate-400 italic" : "text-slate-800")}>
                {row.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
