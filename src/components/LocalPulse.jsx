import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sun, CloudSun, CloudRain, Cloud, Radio, UtensilsCrossed, Sunset, Users, Info } from "lucide-react";

const ZANZIBAR_LAT = -6.1659;
const ZANZIBAR_LON = 39.2026;

const CATEGORY_ICON = {
  food: UtensilsCrossed,
  sunset: Sunset,
  crowd: Users,
  weather: Cloud,
  general: Info,
};

// Open-Meteo weather codes, simplified to 3 buckets - see
// https://open-meteo.com/en/docs (WMO Weather interpretation codes).
function weatherIcon(code) {
  if (code === 0 || code === 1) return Sun;
  if ([2, 3, 45, 48].includes(code)) return CloudSun;
  return CloudRain;
}

// "Real-Time Local Pulse" - a small, honest live section: today's weather
// (from a free public API, no key needed) plus whatever short "what's
// happening now" notes an admin has posted. Renders nothing if there is
// genuinely nothing to show, rather than an empty shell.
export default function LocalPulse() {
  const [weather, setWeather] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${ZANZIBAR_LAT}&longitude=${ZANZIBAR_LON}` +
        `&current=temperature_2m,weather_code&timezone=Africa%2FDar_es_Salaam`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.current) return;
        setWeather({ temp: Math.round(data.current.temperature_2m), code: data.current.weather_code });
      })
      .catch(() => {});

    supabase
      .from("local_pulse")
      .select("*")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setItems(data || []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (!weather && items.length === 0) return null; // nothing real to show

  const WeatherIcon = weather ? weatherIcon(weather.code) : Sun;

  return (
    <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 mb-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-teal-800 font-bold text-sm shrink-0">
          <Radio className="w-4 h-4" />
          Right Now in Zanzibar
        </div>

        {weather && (
          <div className="flex items-center gap-1.5 text-sm text-slate-700 shrink-0">
            <WeatherIcon className="w-4 h-4 text-amber-500" />
            {weather.temp}°C
          </div>
        )}

        {items.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 flex-1 min-w-0">
            {items.map((item) => {
              const Icon = CATEGORY_ICON[item.category] || Info;
              return (
                <span key={item.id} className="inline-flex items-start gap-1.5">
                  <Icon className="w-3.5 h-3.5 mt-0.5 text-teal-600 shrink-0" />
                  {item.message}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
