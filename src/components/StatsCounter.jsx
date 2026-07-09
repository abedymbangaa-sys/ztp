import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Building2, MapPinned, Users, ShieldCheck } from "lucide-react";

export default function StatsCounter() {
  const [stats, setStats] = useState({ listings: 0, categories: 0, partners: 0 });

  useEffect(() => {
    async function load() {
      const [{ count: listingsCount }, { count: categoriesCount }, { count: partnersCount }] =
        await Promise.all([
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("categories").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("partners").select("*", { count: "exact", head: true }).eq("status", "approved"),
        ]);
      setStats({
        listings: listingsCount || 0,
        categories: categoriesCount || 0,
        partners: partnersCount || 0,
      });
    }
    load();
  }, []);

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
