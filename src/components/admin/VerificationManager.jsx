import { useState, useEffect } from "react";
import { X, BadgeCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { VERIFICATION_CHECKS, CORE_CHECK_KEYS, formatVerifiedDate } from "../../lib/verificationStandard";

/**
 * Admin modal for setting the graded "Verified Zanzibar Standard" checks
 * on a single listing. Updates the listings row directly (same table the
 * rest of the app already reads from) and keeps the existing is_verified
 * boolean (used by the card badge and detail page title) in sync
 * automatically: true once identity + location + photos are all checked.
 */
export default function VerificationManager({ open, onClose, listing, onSaved }) {
  const [checks, setChecks] = useState({});
  const [verifiedBy, setVerifiedBy] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!listing) return;
    const next = {};
    VERIFICATION_CHECKS.forEach((c) => {
      next[c.key] = Boolean(listing[c.key]);
    });
    setChecks(next);
    setVerifiedBy(listing.verified_by || "");
    setSource(listing.verification_source || "");
    setNotes(listing.verification_notes || "");
  }, [listing]);

  if (!open || !listing) return null;

  function toggle(key) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    const anyChecked = Object.values(checks).some(Boolean);
    const coreVerified = CORE_CHECK_KEYS.every((key) => checks[key]);

    const { error } = await supabase
      .from("listings")
      .update({
        ...checks,
        verified_by: verifiedBy.trim() || null,
        verification_source: source.trim() || null,
        verification_notes: notes.trim() || null,
        last_verified_at: anyChecked ? new Date().toISOString() : null,
        is_verified: coreVerified,
      })
      .eq("id", listing.id);

    setSaving(false);
    if (!error) {
      onSaved?.();
      onClose();
    } else {
      console.error("Could not save verification", error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-slate-900">Verified Zanzibar Standard</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-slate-500">{listing.title}</p>

          <div className="space-y-2">
            {VERIFICATION_CHECKS.map((check) => (
              <label
                key={check.key}
                className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checks[check.key])}
                  onChange={() => toggle(check.key)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-800">{check.label}</div>
                  <div className="text-xs text-slate-500">{check.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Verified by</label>
              <input
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="e.g. Wachu Digital Growth team"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Site visit, phone confirmation"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Internal notes (not public)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {listing.last_verified_at && (
            <p className="text-xs text-slate-400">Last saved: {formatVerifiedDate(listing.last_verified_at)}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold py-3 rounded-full"
          >
            {saving ? "Saving..." : "Save verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
