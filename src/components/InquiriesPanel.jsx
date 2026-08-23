import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Loader2 } from "lucide-react";

// Simple read-only list of contact-form submissions (and any other rows
// landing in `inquiries`), newest first. Drop <InquiriesPanel /> into any
// Admin Dashboard tab.
export default function InquiriesPanel() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (mounted) {
          setInquiries(data || []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return <p className="text-slate-500 text-center py-16">No inquiries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inq) => (
        <div key={inq.id} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-slate-900">{inq.visitor_name}</span>
              <span className="text-sm text-slate-500">{inq.visitor_email}</span>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {new Date(inq.created_at).toLocaleString()}
            </span>
          </div>
          {inq.message && <p className="text-sm text-slate-700">{inq.message}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={
                "inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full " +
                (inq.status === "closed"
                  ? "bg-slate-100 text-slate-500"
                  : inq.status === "contacted"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-teal-100 text-teal-700")
              }
            >
              {inq.status || "new"}
            </span>
            {inq.utm_source && (
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                via {inq.utm_source}
                {inq.utm_campaign ? ` · ${inq.utm_campaign}` : ""}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
