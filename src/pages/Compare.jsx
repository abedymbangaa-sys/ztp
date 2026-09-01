import { Link, useSearchParams } from "react-router-dom";
import { useListings, useCategories } from "../data/hooks";
import { useCompareList } from "../lib/CompareContext";
import { useSEO } from "../lib/useSEO";
import { TAG_OPTIONS } from "../lib/tags";
import { SUITABILITY_OPTIONS } from "../lib/suitability";
import { formatLocation } from "../lib/locations";
import { normalizePhone } from "../lib/phone";
import { buildWhatsAppLink } from "../lib/whatsapp";
import { SectionIcon } from "../lib/icons";
import ImageWithFallback from "../components/ImageWithFallback";
import { BadgeCheck, MessageCircle, X } from "lucide-react";

// Priority 3 - "Compare Before You Choose". Reads the section + ids straight
// from the URL (?section=hotels&ids=1,2,3) so the compare bar link, a saved
// bookmark, or a shared link all work the same way without needing the
// CompareContext to still hold the selection.
//
// Every row here maps to a real column already on the listings table
// (price_range, tags, good_for, review_count, whatsapp_number...). Nothing
// is computed or guessed - a blank cell shows "Not provided" rather than
// being hidden or filled in, per the brief's "do not invent business
// information" rule.
export default function Compare() {
  const [searchParams] = useSearchParams();
  const sectionKey = searchParams.get("section") || "";
  const ids = (searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { categories } = useCategories();
  const { listings, loading, error } = useListings(sectionKey);
  const { toggleCompare, isComparing } = useCompareList();
  const config = categories.find((c) => c.key === sectionKey);

  const items = ids
    .map((id) => listings.find((l) => String(l.id) === String(id)))
    .filter(Boolean);

  useSEO({
    title: config ? `Compare ${config.title} | Zanzibar Paradise Tours` : "Compare | Zanzibar Paradise Tours",
    description: "Compare hotels, tours and places in Zanzibar side by side - real details only, no invented prices or ratings.",
  });

  function removeFromCompare(item) {
    toggleCompare(item.id, sectionKey);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-2">
          {sectionKey && <SectionIcon sectionKey={sectionKey} className="w-4 h-4" />} Compare
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          {config ? `Compare ${config.title}` : "Compare"}
        </h1>
        <p className="text-slate-500 mt-1">
          Side by side, using only what each business has told us - no ratings or prices we've made up.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-slate-500 py-16">{error}</p>
      ) : items.length < 2 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-700 font-medium mb-2">Nothing to compare yet.</p>
          <p className="text-slate-500 text-sm mb-4">
            Go to a category, tap the <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 align-middle">⚖</span> icon
            on 2-3 listings, then tap "Compare Now".
          </p>
          {sectionKey && (
            <Link
              to={`/${sectionKey}`}
              className="inline-block bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-6 py-2.5 rounded-full"
            >
              Browse {config?.title || sectionKey}
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="w-40"></th>
                {items.map((item) => (
                  <th key={item.id} className="text-left align-top pb-4 px-3 min-w-[220px]">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => removeFromCompare(item)}
                        aria-label={`Remove ${item.title} from compare`}
                        className="absolute -top-2 -right-2 z-10 bg-white shadow rounded-full w-6 h-6 flex items-center justify-center text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-32 rounded-xl overflow-hidden mb-2">
                        <ImageWithFallback
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Link to={`/${sectionKey}/${item.id}`} className="font-bold text-slate-900 hover:text-teal-700 leading-snug block">
                        {item.title}
                      </Link>
                      {item.is_verified && (
                        <span className="inline-flex items-center gap-1 text-teal-700 text-xs font-semibold mt-1">
                          <BadgeCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <CompareRow
                label="Location"
                items={items}
                render={(item) => formatLocation(item.location) || "Not provided"}
              />
              <CompareRow
                label="Price range"
                items={items}
                render={(item) => item.price_range || "Contact provider for current price"}
              />
              {sectionKey !== "hotels" && (
                <CompareRow
                  label="Duration"
                  items={items}
                  render={(item) => item.duration || "Not provided"}
                />
              )}
              <CompareRow
                label="Reviews"
                items={items}
                render={(item) => (item.review_count > 0 ? `${item.review_count} review${item.review_count === 1 ? "" : "s"}` : "No reviews yet")}
              />
              <CompareRow
                label="Best for"
                items={items}
                render={(item) => {
                  const chips = SUITABILITY_OPTIONS.filter((s) => (item.good_for || []).includes(s.key));
                  return chips.length ? (
                    <div className="flex flex-wrap gap-1">
                      {chips.map((c) => (
                        <span key={c.key} className="bg-teal-50 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {c.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "Not specified"
                  );
                }}
              />
              <CompareRow
                label="Amenities"
                items={items}
                render={(item) => {
                  const chips = TAG_OPTIONS.filter((t) => (item.tags || []).includes(t.key));
                  return chips.length ? (
                    <div className="flex flex-wrap gap-1">
                      {chips.map((c) => (
                        <span key={c.key} className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {c.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "Not specified"
                  );
                }}
              />
              <CompareRow
                label="Description"
                items={items}
                render={(item) => (
                  <p className="text-slate-600 line-clamp-4">{item.description || "Not provided"}</p>
                )}
              />
              <CompareRow
                label="Contact"
                items={items}
                render={(item) => {
                  const num = normalizePhone(item.whatsapp_number);
                  const url = num ? buildWhatsAppLink(item.title, item.location, num) : null;
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 transition text-white text-xs font-semibold px-3 py-2 rounded-full"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  ) : (
                    "Not provided"
                  );
                }}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, items, render }) {
  return (
    <tr className="border-t border-slate-200">
      <td className="py-4 pr-3 font-semibold text-slate-500 align-top whitespace-nowrap">{label}</td>
      {items.map((item) => (
        <td key={item.id} className="py-4 px-3 align-top text-slate-700">
          {render(item)}
        </td>
      ))}
    </tr>
  );
}
