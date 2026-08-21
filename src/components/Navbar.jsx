import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useLanguage, SUPPORTED_LANGUAGES } from "../lib/LanguageContext";
import { useT } from "../lib/i18n";

// Main links shown directly on the navbar
const MAIN_LINKS = [
  { to: "/", label: "Home" },
  { to: "/things-to-do", label: "Things to Do" },
  { to: "/hotels", label: "Hotels" },
  { to: "/tours", label: "Tours" },
];

// The rest are placed inside the "Explore More" dropdown so the navbar
// doesn't get cramped or overflow the screen on desktop widths
const MORE_LINKS = [
  { to: "/before-you-go", label: "Before You Go" },
  { to: "/guides", label: "Travel Guides" },
  { to: "/beaches", label: "Beaches" },
  { to: "/restaurants", label: "Restaurants" },
  { to: "/attractions", label: "Attractions" },
  { to: "/heritage", label: "Heritage" },
  { to: "/blog", label: "Blog" },
  { to: "/kwa-watanzania", label: "Kwa Watanzania" },
  { to: "/itinerary", label: "Itinerary" },
  { to: "/#advertise", label: "Advertise" },
];

const ALL_LINKS = [...MAIN_LINKS, ...MORE_LINKS];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = useT();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-700 whitespace-nowrap">
          {MAIN_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-teal-700">
              {t(l.label)}
            </Link>
          ))}

          <div className="relative" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
            <button className="flex items-center gap-1 hover:text-teal-700">
              {t("Explore More")} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-2 min-w-[160px]">
                {MORE_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} className="block px-4 py-2 hover:bg-slate-50 hover:text-teal-700">
                    {t(l.label)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select language"
            className="hidden sm:block text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-2.5 py-1.5 bg-white hover:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <Link
            to="/partner/login"
            className="hidden lg:block text-sm font-semibold text-teal-700 hover:underline whitespace-nowrap"
          >
            {t("Own a business? Log in")}
          </Link>
          <a
            href="https://wa.me/255635442732"
            target="_blank"
            rel="noreferrer"
            className="bg-teal-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full hover:bg-teal-800 transition whitespace-nowrap"
          >
            <span className="sm:hidden">{t("Chat Now")}</span>
            <span className="hidden sm:inline">{t("Chat with a Zanzibar Expert")}</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -mr-2 text-slate-700"
            aria-label="Open menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-1 text-slate-700 font-medium">
          <div className="flex items-center gap-2 py-2.5 border-b border-slate-100">
            <span className="text-sm text-slate-500">{t("Language:")}</span>
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={
                  "text-xs font-semibold px-2.5 py-1 rounded-full border " +
                  (language === l.code
                    ? "bg-teal-700 text-white border-teal-700"
                    : "text-slate-600 border-slate-300")
                }
              >
                {l.label}
              </button>
            ))}
          </div>
          {ALL_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="py-2.5 border-b border-slate-100"
            >
              {t(l.label)}
            </Link>
          ))}
          <Link to="/partner/login" onClick={() => setOpen(false)} className="py-2.5 text-teal-700 font-semibold">
            {t("Own a business? Log in")}
          </Link>
        </nav>
      )}
    </header>
  );
}
