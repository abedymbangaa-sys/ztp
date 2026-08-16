import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useT } from "../lib/i18n";

// Reusable search box that shows a dropdown of matching listings as the
// person types (title or location match), while still supporting a normal
// "Search" submit that goes to the full Hotels listing page with ?q=.
export default function SearchAutocomplete({ listings = [], placeholder = "Search...", className = "" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  const suggestions =
    query.trim().length > 0
      ? listings
          .filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              (item.location || "").toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 6)
      : [];

  function handleSubmit(e) {
    e.preventDefault();
    setOpen(false);
    navigate(query.trim() ? `/hotels?q=${encodeURIComponent(query.trim())}` : "/hotels");
  }

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl ring-1 ring-white/20 p-1.5 sm:p-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 px-5 py-3 text-sm sm:text-base focus:outline-none"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 transition text-slate-900 font-bold px-6 sm:px-7 py-3 rounded-full text-sm sm:text-base whitespace-nowrap shadow-md"
        >
          {t("Search")}
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 text-left">
          {suggestions.map((item) => (
            <Link
              key={item.id}
              to={`/${item.category_key}/${item.id}`}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
            >
              <img
                src={item.image_url || "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=100&q=80"}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.location}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
