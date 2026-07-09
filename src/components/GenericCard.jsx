import { Link } from "react-router-dom";
import { MapPin, BadgeCheck } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { TAG_OPTIONS } from "../lib/tags";

export default function GenericCard({ item, sectionKey }) {
  const { language } = useLanguage();
  const description = (language !== "en" && item[`description_${language}`]) || item.description;
  const itemTags = TAG_OPTIONS.filter((t) => (item.tags || []).includes(t.key));

  return (
    <Link
      to={`/${sectionKey}/${item.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100"
    >
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
            Verified
          </span>
        )}
      </div>
      <div className="p-5">
        {item.location && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{item.location}</span>
          </div>
        )}
        <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
        {itemTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {itemTags.map((t) => (
              <span
                key={t.key}
                className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[11px] font-medium px-2 py-0.5 rounded-full"
              >
                <t.icon className="w-3 h-3" strokeWidth={2} />
                {t.label}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
        <span className="inline-flex items-center gap-1.5 mt-4 bg-teal-700 group-hover:bg-teal-800 transition text-white text-sm font-semibold px-4 py-2 rounded-full">
          View Details →
        </span>
      </div>
    </Link>
  );
}
