import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { trackEvent } from "../lib/analytics";
import { AREAS } from "../data/areas";
import { listingPath } from "../lib/slug";
import {
  Radio, Sun, CloudSun, CloudRain, Waves, Wind, CalendarDays, MapPin, BadgeCheck,
  ExternalLink, Sparkles, Bell, Loader2, Info, ShieldCheck,
} from "lucide-react";

const LAT = -6.1659;
const LON = 39.2026;

export const LEO_INTERESTS = [
  { key: "food", label: "Food" },
  { key: "culture", label: "Culture" },
  { key: "beach", label: "Beach" },
  { key: "kids", label: "Kids" },
];

// Which directory categories count for each interest (for "new recommendations").
const INTEREST_CATEGORIES = {
  food: ["restaurants"],
  culture: ["heritage", "attractions"],
  beach: ["beaches"],
};

function weatherIcon(code) {
  if (code === 0 || code === 1) return Sun;
  if ([2, 3, 45, 48].includes(code)) return CloudSun;
  return CloudRain;
}

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function areaName(key) {
  return AREAS.find((a) => a.key === key)?.name || "Zanzibar";
}

function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-sm font-semibold px-3.5 py-1.5 rounded-full border transition whitespace-nowrap " +
        (active
          ? "bg-teal-700 border-teal-700 text-white"
          : "bg-white border-slate-300 text-slate-600 hover:border-teal-400")
      }
    >
      {children}
    </button>
  );
}

// ---- 1. Direct info: needs no trust - read straight from a public API ----
function ConditionsCard() {
  const [state, setState] = useState({ loading: true, weather: null, sea: null });

  useEffect(() => {
    let cancelled = false;
    const tz = "timezone=Africa%2FDar_es_Salaam";
    const w = fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,weather_code,wind_speed_10m&${tz}`
    ).then((r) => r.json()).catch(() => null);
    const s = fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
        `&current=wave_height,sea_surface_temperature&${tz}`
    ).then((r) => r.json()).catch(() => null);

    Promise.all([w, s]).then(([wd, sd]) => {
      if (cancelled) return;
      setState({
        loading: false,
        weather: wd?.current ? wd.current : null,
        sea: sd?.current ? sd.current : null,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const { weather, sea, loading } = state;
  const WIcon = weather ? weatherIcon(weather.weather_code) : Sun;
  const updated = weather?.time || sea?.time;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-teal-800 font-bold mb-1">
        <ShieldCheck className="w-5 h-5" /> Conditions right now
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Live readings, no opinion involved. Source: Open-Meteo (weather &amp; marine models for Zanzibar
        {updated ? `, reading from ${new Date(updated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} local time` : ""}).
      </p>

      {loading ? (
        <p className="text-sm text-slate-400">Loading conditions...</p>
      ) : !weather && !sea ? (
        <p className="text-sm text-slate-500">Live conditions are unavailable right now. Please check again shortly.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {weather && (
            <div className="bg-slate-50 rounded-xl p-3">
              <WIcon className="w-5 h-5 text-amber-500 mb-1" />
              <p className="text-xl font-bold text-slate-800">{Math.round(weather.temperature_2m)}°C</p>
              <p className="text-xs text-slate-500">Air temperature</p>
            </div>
          )}
          {weather && (
            <div className="bg-slate-50 rounded-xl p-3">
              <Wind className="w-5 h-5 text-sky-500 mb-1" />
              <p className="text-xl font-bold text-slate-800">{Math.round(weather.wind_speed_10m)} km/h</p>
              <p className="text-xs text-slate-500">Wind</p>
            </div>
          )}
          {sea?.wave_height != null && (
            <div className="bg-slate-50 rounded-xl p-3">
              <Waves className="w-5 h-5 text-teal-600 mb-1" />
              <p className="text-xl font-bold text-slate-800">{Number(sea.wave_height).toFixed(1)} m</p>
              <p className="text-xs text-slate-500">Wave height (open sea)</p>
            </div>
          )}
          {sea?.sea_surface_temperature != null && (
            <div className="bg-slate-50 rounded-xl p-3">
              <Waves className="w-5 h-5 text-cyan-600 mb-1" />
              <p className="text-xl font-bold text-slate-800">{Math.round(sea.sea_surface_temperature)}°C</p>
              <p className="text-xs text-slate-500">Sea temperature</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4 flex gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          These are model readings, not an official warning. Before any boat, snorkelling or diving trip, ask
          your operator about the day's sea conditions and follow their safety briefing.
        </span>
      </p>
    </section>
  );
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Icon className="w-5 h-5 text-teal-700" /> {children}
      </h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function EventRow({ ev }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 break-words">{ev.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(ev.event_date)}
              {ev.end_date && ev.end_date !== ev.event_date ? ` – ${formatDate(ev.end_date)}` : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {ev.area_key ? areaName(ev.area_key) : "Zanzibar"}
            </span>
          </p>
        </div>
        <span
          className={
            "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 " +
            (ev.verification === "verified" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700")
          }
        >
          {ev.verification === "verified" ? <BadgeCheck className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
          {ev.verification === "verified" ? "Verified" : "Not yet verified"}
        </span>
      </div>
      {ev.description && <p className="text-sm text-slate-600 mt-2 break-words">{ev.description}</p>}
      {(ev.organizer_name || ev.organizer_url) && (
        <p className="text-xs text-slate-500 mt-2">
          Organizer:{" "}
          {ev.organizer_url ? (
            <a
              href={ev.organizer_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
              onClick={() => trackEvent?.("leo_event_organizer_click", { title: ev.title })}
            >
              {ev.organizer_name || "Organizer link"} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="font-semibold">{ev.organizer_name}</span>
          )}
        </p>
      )}
    </div>
  );
}

// ---- Subscribe (WhatsApp or email digest) ----
function SubscribeBox({ area, interest }) {
  const [channel, setChannel] = useState("whatsapp");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    let value = contact.trim();
    if (channel === "whatsapp") {
      value = value.replace(/[^0-9]/g, "");
      if (value.length < 9) return setError("Enter your WhatsApp number with country code, e.g. 447700900123.");
    } else if (!/^\S+@\S+\.\S+$/.test(value)) {
      return setError("Enter a valid email address.");
    }
    setSaving(true);
    const { error: err } = await supabase.from("leo_subscribers").insert({
      channel,
      contact: value,
      area_key: area || null,
      interest: interest || null,
    });
    setSaving(false);
    if (err) return setError("Could not subscribe right now. Please try again.");
    trackEvent?.("leo_subscribe", { channel });
    setDone(true);
  }

  return (
    <section className="bg-teal-800 text-white rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-1">
        <Bell className="w-5 h-5" /> Get the weekly Zanzibar Leo digest
      </h2>
      <p className="text-sm text-teal-100 mb-4">
        One short message a week with events and new local picks{area ? ` for ${areaName(area)}` : ""}
        {interest ? ` (${LEO_INTERESTS.find((i) => i.key === interest)?.label.toLowerCase()})` : ""}.
        No spam, and no need to send us requests.
      </p>
      {done ? (
        <p className="bg-white/15 rounded-lg px-4 py-3 text-sm font-semibold">
          You're on the list. We'll send the digest to your {channel === "whatsapp" ? "WhatsApp" : "email"}.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <Chip active={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</Chip>
            <Chip active={channel === "email"} onClick={() => setChannel("email")}>Email</Chip>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              inputMode={channel === "whatsapp" ? "tel" : "email"}
              placeholder={channel === "whatsapp" ? "WhatsApp number, e.g. 447700900123" : "you@example.com"}
              className="flex-1 min-w-0 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Subscribe
            </button>
          </div>
          {error && <p className="text-sm text-amber-200">{error}</p>}
        </form>
      )}
    </section>
  );
}

export default function ZanzibarLeo() {
  useSEO({
    title: "Zanzibar Leo – What's On in Zanzibar This Week | Zanzibar Paradise Tours",
    description:
      "Live weather and sea conditions, this week's events and new local recommendations for Zanzibar, by area and interest.",
    canonical: "https://visitzanzibarparadise.com/zanzibar-leo",
  });

  const [area, setArea] = useState("");
  const [interest, setInterest] = useState("");
  const [pulse, setPulse] = useState([]);
  const [events, setEvents] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      supabase
        .from("local_pulse")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("leo_events")
        .select("*")
        .eq("is_published", true)
        .or(`end_date.gte.${today},and(end_date.is.null,event_date.gte.${today})`)
        .order("event_date", { ascending: true })
        .limit(60),
      supabase
        .from("listings")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(60),
    ]).then(([p, e, l]) => {
      if (cancelled) return;
      setPulse(p.data || []);
      setEvents(e.data || []);
      setRecent(l.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const matches = (row) =>
    (!area || !row.area_key || row.area_key === area) && (!interest || !row.interest || row.interest === interest);

  const pulseShown = useMemo(() => pulse.filter(matches).slice(0, 6), [pulse, area, interest]);
  const eventsShown = useMemo(() => events.filter(matches), [events, area, interest]);

  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const thisWeek = eventsShown.filter((ev) => ev.event_date <= weekEnd);
  const later = eventsShown.filter((ev) => ev.event_date > weekEnd);

  const recommendations = useMemo(() => {
    return recent
      .filter((l) => {
        if (area && l.area !== area) return false;
        if (interest === "kids") {
          const hay = JSON.stringify([l.tags, l.good_for]).toLowerCase();
          return hay.includes("famil") || hay.includes("kid") || hay.includes("child");
        }
        if (interest) return (INTEREST_CATEGORIES[interest] || []).includes(l.category_key);
        return true;
      })
      .slice(0, 6);
  }, [recent, area, interest]);

  return (
    <main className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-teal-800 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          <p className="inline-flex items-center gap-2 text-xs font-semibold bg-white/15 rounded-full px-3 py-1 mb-3">
            <Radio className="w-3.5 h-3.5" /> Updated regularly
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Zanzibar Leo</h1>
          <p className="text-teal-50 max-w-2xl">
            "Leo" means today. See what's happening on the island this week, then pick your area and what you
            love to see only what matters to you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-6">
        <ConditionsCard />

        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Area</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!area} onClick={() => setArea("")}>All Zanzibar</Chip>
              {AREAS.map((a) => (
                <Chip key={a.key} active={area === a.key} onClick={() => setArea(a.key)}>{a.name}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Interest</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!interest} onClick={() => setInterest("")}>Everything</Chip>
              {LEO_INTERESTS.map((i) => (
                <Chip key={i.key} active={interest === i.key} onClick={() => setInterest(i.key)}>{i.label}</Chip>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
        ) : (
          <>
            <section>
              <SectionTitle icon={Radio} sub="Short notes from our local team. Each shows when it was posted.">
                Local notes
              </SectionTitle>
              {pulseShown.length === 0 ? (
                <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-4">
                  No notes for this selection right now. Check back soon.
                </p>
              ) : (
                <div className="space-y-2">
                  {pulseShown.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-slate-700 break-words">{p.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {p.area_key ? areaName(p.area_key) + " · " : ""}
                        Source: {p.source || "Zanzibar Paradise Tours team"} · Updated {timeAgo(p.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle icon={CalendarDays} sub="Always check the organizer before you travel. Dates can change.">
                Events
              </SectionTitle>
              {eventsShown.length === 0 ? (
                <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-4">
                  No events listed for this selection yet. Subscribe below and we'll tell you when something is added.
                </p>
              ) : (
                <div className="space-y-4">
                  {thisWeek.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-teal-800 mb-2">This week</p>
                      <div className="space-y-2">{thisWeek.map((ev) => <EventRow key={ev.id} ev={ev} />)}</div>
                    </div>
                  )}
                  {later.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-slate-600 mb-2">Coming up</p>
                      <div className="space-y-2">{later.map((ev) => <EventRow key={ev.id} ev={ev} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section>
              <SectionTitle icon={Sparkles} sub="Newest places added to the directory.">
                New local recommendations
              </SectionTitle>
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-4">
                  Nothing new for this selection yet.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {recommendations.map((l) => (
                    <Link
                      key={l.id}
                      to={listingPath(l, l.category_key)}
                      className="bg-white border border-slate-200 hover:border-teal-400 rounded-xl px-4 py-3 transition"
                    >
                      <p className="font-semibold text-slate-800 text-sm break-words">{l.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {l.area ? areaName(l.area) : l.location} · Added {timeAgo(l.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <SubscribeBox area={area} interest={interest} />
      </div>
    </main>
  );
}
