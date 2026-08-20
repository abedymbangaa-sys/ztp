import { useEffect, useState } from "react";
import { Waves, TrendingUp, TrendingDown } from "lucide-react";

// Zanzibar's rough center point - close enough for tide timing purposes
// (tide timing barely shifts across the island, unlike wave height).
const ZANZIBAR_LAT = -6.1659;
const ZANZIBAR_LON = 39.2026;

// Small, self-contained "Tide Today" card. Uses Open-Meteo's free Marine
// API (no key, no signup - https://open-meteo.com) which reports sea
// level height every 15 minutes. We derive simple high/low turning points
// from that curve ourselves, since Open-Meteo returns raw heights rather
// than named tide events.
export default function TideWidget() {
  const [state, setState] = useState({ loading: true, error: false, points: [], current: null });

  useEffect(() => {
    let cancelled = false;
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${ZANZIBAR_LAT}&longitude=${ZANZIBAR_LON}` +
      `&hourly=sea_level_height_msl&timezone=Africa%2FDar_es_Salaam&forecast_days=2`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const times = data?.hourly?.time || [];
        const heights = data?.hourly?.sea_level_height_msl || [];
        const points = times.map((t, i) => ({ time: t, height: heights[i] }));

        // Find the next couple of turning points (local max/min) from now.
        const now = new Date();
        const upcoming = points.filter((p) => new Date(p.time) >= now);
        const turns = [];
        for (let i = 1; i < upcoming.length - 1 && turns.length < 2; i++) {
          const [a, b, c] = [upcoming[i - 1].height, upcoming[i].height, upcoming[i + 1].height];
          if ((b > a && b > c) || (b < a && b < c)) {
            turns.push({ ...upcoming[i], type: b > a && b > c ? "high" : "low" });
          }
        }

        const rising = upcoming.length > 1 && upcoming[1].height > upcoming[0].height;
        setState({ loading: false, error: false, points: turns, current: { rising } });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: true, points: [], current: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading || state.error) return null; // fail quietly, don't break the page layout

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mb-8 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-teal-50 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
      <div className="flex items-center gap-2 text-teal-800 font-semibold">
        <Waves className="w-5 h-5" />
        Tide Today
        {state.current?.rising ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> Rising
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3 h-3" /> Falling
          </span>
        )}
      </div>
      <div className="flex gap-6 text-sm text-slate-700">
        {state.points.map((p, i) => (
          <div key={i}>
            <span className="font-semibold capitalize">{p.type} tide</span> ~ {fmtTime(p.time)}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-400 ml-auto">Estimate · open-meteo.com</span>
    </div>
  );
}
