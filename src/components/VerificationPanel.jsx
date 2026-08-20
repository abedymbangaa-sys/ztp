import { Check, X, Flag } from "lucide-react";
import { VERIFICATION_CHECKS, isCoreVerified, formatVerifiedDate } from "../lib/verificationStandard";
import { useT } from "../lib/i18n";

/**
 * Full "Verified Zanzibar Standard" panel for a listing detail page.
 * Reads the graded check columns directly off the listing row.
 * Renders nothing but a light "not yet reviewed" note if no checks
 * have been done yet, so it never looks broken on older listings.
 */
export default function VerificationPanel({ item, onReportIssue }) {
  const t = useT();
  const verified = isCoreVerified(item);
  const dateLabel = formatVerifiedDate(item.last_verified_at);
  const anyCheckDone = VERIFICATION_CHECKS.some((c) => item[c.key]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {verified ? t("Verified Zanzibar Standard") : t("Verification pending")}
          </h3>
          {anyCheckDone ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {dateLabel ? `${t("Verified on")} ${dateLabel}` : t("Verified by our team")}
              {item.verification_source ? ` · ${item.verification_source}` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">
              {t("Our team hasn't completed checks on this listing yet.")}
            </p>
          )}
        </div>
        {onReportIssue && (
          <button
            type="button"
            onClick={onReportIssue}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-400 hover:text-teal-700"
          >
            <Flag className="w-3.5 h-3.5" />
            {t("Report incorrect information")}
          </button>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {VERIFICATION_CHECKS.map((check) => {
          const done = Boolean(item[check.key]);
          const Icon = check.icon;
          return (
            <li
              key={check.key}
              className={"flex items-start gap-2.5 rounded-xl px-3 py-2.5 " + (done ? "bg-teal-50" : "bg-slate-50")}
            >
              <span
                className={
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full " +
                  (done ? "bg-teal-700" : "bg-slate-300")
                }
              >
                {done ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : <X className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
                  {t(check.label)}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{t(check.description)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
