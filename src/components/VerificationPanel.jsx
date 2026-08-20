import { useState } from "react";
import { Check, X, Flag, ChevronDown, HelpCircle } from "lucide-react";
import {
  VERIFICATION_CHECKS,
  isCoreVerified,
  formatVerifiedDate,
  NOT_YET_CHECKED_LABEL,
} from "../lib/verificationStandard";
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
  // Collapsed by default on small screens once there's real content to
  // hide (>3 checks would otherwise push the sidebar quite tall) - still
  // an ordinary toggle button, never hiding a check the business hasn't
  // earned, just how much detail is visible at once.
  const [expanded, setExpanded] = useState(false);
  const [howWeVerifyOpen, setHowWeVerifyOpen] = useState(false);
  const collapsible = VERIFICATION_CHECKS.length > 3;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {verified ? t("Verified Zanzibar Standard") : t("Verification pending")}
          </h3>
          {anyCheckDone ? (
            <p className="mt-0.5 text-xs text-slate-500">
              {dateLabel
                ? `${t("Last reviewed")}: ${dateLabel}`
                : t("Verification date not available")}
              {item.verification_source ? ` · ${item.verification_source}` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">
              {t("Our team hasn't completed checks on this listing yet.")}
            </p>
          )}
          <button
            type="button"
            onClick={() => setHowWeVerifyOpen((v) => !v)}
            className="mt-1 flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            aria-expanded={howWeVerifyOpen}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t("How we verify")}
          </button>
          {howWeVerifyOpen && (
            <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
              {t(
                "Our local team reviews each business against a fixed checklist - confirming identity and contact details, checking the location in person or by map, and reviewing photos, safety and eco practices where relevant. A check only shows as done once we've actually confirmed it, never automatically."
              )}
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

      <ul
        className={
          "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-hidden transition-all " +
          (collapsible && !expanded ? "max-h-[9.5rem] sm:max-h-none" : "max-h-none")
        }
      >
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
                {done ? (
                  <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <X className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  {t(check.label)}
                </div>
                <p className={"mt-0.5 text-xs " + (done ? "text-slate-500" : "text-slate-400 italic")}>
                  {done ? t(check.description) : t(NOT_YET_CHECKED_LABEL)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="sm:hidden mt-2 flex w-full items-center justify-center gap-1 text-xs font-semibold text-teal-700 py-1.5"
          aria-expanded={expanded}
        >
          {expanded ? t("Show less") : t("Show all checks")}
          <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (expanded ? "rotate-180" : "")} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
