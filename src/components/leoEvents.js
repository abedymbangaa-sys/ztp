import { CalendarDays, Clock, MapPin, Ticket, BadgeCheck, Info, ExternalLink, Banknote, ShieldCheck } from "lucide-react";
import { AREAS } from "../data/areas";
import { trackEvent } from "../lib/analytics";
import { formatEventDate, formatEventTime, eventTypeLabel } from "../lib/leoEvents";

function areaName(key) {
  return AREAS.find((a) => a.key === key)?.name || "Zanzibar";
}

// One event card, used on /zanzibar-leo and (compact) on the homepage
// LocalPulse strip. Every line is optional so a half-filled event never
// shows "undefined" or an invented value.
export default function EventCard({ ev, compact = false, past = false }) {
  const time = formatEventTime(ev.start_time);
  const dateLabel =
    formatEventDate(ev.event_date) +
    (ev.end_date && ev.end_date !== ev.event_date ? ` – ${formatEventDate(ev.end_date)}` : "");

  return (
    <div className={"bg-white border border-slate-200 rounded-xl p-4 " + (past ? "opacity-75" : "")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {ev.event_type && (
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700 mb-0.5">
              {eventTypeLabel(ev.event_type)}
            </p>
          )}
          <p className="font-semibold text-slate-800 break-words">{ev.title}</p>
        </div>
        {ev.verification === "verified" && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 bg-teal-50 text-teal-700">
            <BadgeCheck className="w-3.5 h-3.5" /> Confirmed by organizer
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1 text-xs text-slate-600">
        <p className="flex items-start gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span>{dateLabel}</span>
        </p>
        {time && (
          <p className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span>Starts {time}</span>
          </p>
        )}
        <p className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="break-words">
            {ev.venue || areaName(ev.area_key)}
            {ev.venue && ev.area_key ? ` · ${areaName(ev.area_key)} area` : ""}
          </span>
        </p>
        {ev.price_info && (
          <p className="flex items-start gap-1.5">
            <Banknote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span className="break-words">{ev.price_info}</span>
          </p>
        )}
      </div>

      {!compact && ev.description && <p className="text-sm text-slate-600 mt-3 break-words">{ev.description}</p>}

      {ev.notice && (
        <p className="mt-3 flex gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{ev.notice}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {ev.ticket_url && !past && (
          <a
            href={ev.ticket_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => trackEvent?.("leo_view_tickets", { title: ev.title })}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-full"
          >
            <Ticket className="w-3.5 h-3.5" /> View tickets
          </a>
        )}
        {ev.source_checked && ev.source_url && (
          <a
            href={ev.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Details checked against the source{" "}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {!compact && (ev.organizer_name || ev.organizer_url) && (
        <p className="text-xs text-slate-500 mt-2">
          Organizer:{" "}
          {ev.organizer_url ? (
            <a
              href={ev.organizer_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-teal-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              {ev.organizer_name || "Organizer page"} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="font-semibold">{ev.organizer_name}</span>
          )}
        </p>
      )}
    </div>
  );
}
