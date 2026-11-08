// Shared helpers for Zanzibar Leo events (used by the /zanzibar-leo page and
// the homepage LocalPulse strip). All "today" logic uses Zanzibar time
// (Africa/Dar_es_Salaam, UTC+3, no daylight saving) - NOT the visitor's own
// time zone and not UTC - so an event never flips to "past" at the wrong hour.

const TZ = "Africa/Dar_es_Salaam";

export const EVENT_TYPES = {
  sports: "Sports",
  nightlife: "Music / Nightlife",
  festival: "Music / Festival",
  holiday: "Public holiday",
};

export function eventTypeLabel(key) {
  if (!key) return "";
  return EVENT_TYPES[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// "YYYY-MM-DD" for today in Zanzibar.
export function todayZanzibar() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatEventDate(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "16:00:00" -> "4:00 PM (Zanzibar time)". Returns "" when no start time
// is known - we never show an end time or a guessed time.
export function formatEventTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"} (Zanzibar time)`;
}

export function lastDay(ev) {
  return ev.end_date || ev.event_date;
}

export function isPastEvent(ev, today = todayZanzibar()) {
  return lastDay(ev) < today;
}

export function compareEvents(a, b) {
  const ka = `${a.event_date} ${a.start_time || "99:99"}`;
  const kb = `${b.event_date} ${b.start_time || "99:99"}`;
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

// Does the event overlap the date window [from, to]?
export function overlaps(ev, from, to) {
  return ev.event_date <= to && lastDay(ev) >= from;
}
