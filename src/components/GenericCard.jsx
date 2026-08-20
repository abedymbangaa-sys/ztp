import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, MessageCircle, Clock, Star, Tag } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useT } from "../lib/i18n";
import { TAG_OPTIONS } from "../lib/tags";
import { buildWhatsAppLink } from "../lib/whatsapp";
import { normalizePhone } from "../lib/phone";
import { trackEvent } from "../lib/analytics";

export default function GenericCard({ item, sectionKey }) {
  const { language } = useLanguage();
  const t = useT();
  const description = (language !== "en" && item[`description_${language}`]) || item.description;
  const itemTags = TAG_OPTIONS.filter((t) => (item.tags || []).includes(t.key));

  const ownerNumber = normalizePhone(item.whatsapp_number);
  const whatsappUrl = ownerNumber
    ? buildWhatsAppLink(item.title, item.location, ownerNumber)
    : null;

  return (
    // Note: this was previously a single <Link> wrapping the whole card.
    // It's now a <div> so the small "Ask on WhatsApp" button below can be
    // a real <a> without nesting inside another link (invalid HTML).
    // Image/content still opens the detail page; only the footer row
    // changed.
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
      <Link to={`/${sectionKey}/${item.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {item.is_verified && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5" />
              {t("Verified")}
            </span>
          )}
        </div>
        <div className="p-5 pb-3">
          {item.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.location}</span>
            </div>
          )}
          <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
          {(item.price_range || item.duration || item.review_count > 0) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-2">
              {item.price_range && (
                <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                  <Tag className="w-3.5 h-3.5" />
                  {item.price_range}
                </span>
              )}
              {item.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration}
                </span>
              )}
              {item.review_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-slate-800">{item.review_avg}</span>
                  <span>({item.review_count})</span>
                </span>
              )}
            </div>
          )}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {itemTags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[11px] font-medium px-2 py-0.5 rounded-full"
                >
                  <tag.icon className="w-3 h-3" strokeWidth={2} />
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
        </div>
      </Link>

      {/* Footer row: small WhatsApp shortcut (only if the listing has a
          number) + View Details. Kept small/secondary on purpose so cards
          don't get taller - the full 4-button action area lives on the
          detail page. */}
      <div className="px-5 pb-5 flex items-center gap-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp owner of ${item.title}`}
            className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full transition"
            onClick={() =>
              trackEvent("click_whatsapp_owner", {
                listing_id: item.id,
                listing_name: item.title,
                listing_category: sectionKey,
                listing_location: item.location,
              })
            }
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t("Ask on WhatsApp")}
          </a>
        )}
        <Link
          to={`/${sectionKey}/${item.id}`}
          className="inline-flex items-center gap-1.5 bg-teal-700 group-hover:bg-teal-800 transition text-white text-xs font-semibold px-3.5 py-1.5 rounded-full ml-auto"
        >
          {t("View Details")} →
        </Link>
      </div>
    </div>
  );
}
