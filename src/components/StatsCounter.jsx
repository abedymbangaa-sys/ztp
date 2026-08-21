import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Building2, MapPinned, Users, ShieldCheck } from "lucide-react";

const STATS_TIMEOUT_MS = 9000;

export default function StatsCounter() {
  const [stats, setStats] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let mounted = true;
    setLoadState("loading");

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), STATS_TIMEOUT_MS)
    );

    Promise.race([
      Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("categories").select("*", { count: "exact", head: true }).eq("is_active", true),
        // Real, not-rejected partners - not just status === "approved".
        // Partners added directly in Supabase (rather than through the
        // /partner/signup flow) may never have had their status field set
        // to "approved" - some may even have status left NULL, which
        // status.neq(...) alone would silently exclude (SQL: NULL <> 'x'
        // is NULL, not true). This counts every genuine partner record
        // that isn't explicitly rejected, whether its status is set or
        // blank, so the number stays accurate without a hardcoded floor.
        supabase
          .from("partners")
          .select("*", { count: "exact", head: true })
          .or("status.neq.rejected,status.is.null"),
      ]),
      timeoutPromise,
    ])
      .then(([{ count: listingsCount }, { count: categoriesCount }, { count: partnersCount }]) => {
        if (!mounted) return;
        setStats({
          listings: listingsCount || 0,
          categories: categoriesCount || 0,
          partners: partnersCount || 0,
        });
        setLoadState("ready");
      })
      .catch(() => {
        if (mounted) setLoadState("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  // While loading (or on a failed/timed-out fetch), never show "0" or
  // "0+" - a real stat of zero and "not loaded yet" must never look the
  // same. Skeleton pulse boxes stand in until real numbers arrive; on
  // error, the section just doesn't render rather than showing a
  // stuck/incorrect count.
  if (loadState === "error") return null;

  if (loadState === "loading" || !stats) {
    return (
      <section className="bg-teal-800 text-white" aria-busy="true" aria-label="Loading site statistics">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-teal-700" />
              <div className="h-7 w-14 mx-auto rounded bg-teal-700 mb-2" />
              <div className="h-3 w-20 mx-auto rounded bg-teal-700" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Real counts only - no artificial floor. If the true partner count is
  // lower than what's shown elsewhere on the site, that's a data-entry
  // gap to fix in the partners table, not something to paper over here.
  const items = [
    { icon: MapPinned, label: "Verified Listings", value: `${stats.listings}+` },
    { icon: Building2, label: "Types of Attractions", value: stats.categories },
    { icon: Users, label: "Business Partners", value: `${stats.partners}+` },
    { icon: ShieldCheck, label: "Verified by Our Team", value: "100%" },
  ];
  return (
    <section className="bg-teal-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((it, i) => (
          <div key={i} className="text-center">
            <it.icon className="w-7 h-7 mx-auto mb-2 text-teal-300" />
            <p className="text-2xl md:text-3xl font-extrabold">{it.value}</p>
            <p className="text-teal-200 text-xs md:text-sm mt-1">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
