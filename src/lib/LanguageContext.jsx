import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { applyTranslationCookie, loadGoogleTranslate } from "./googleTranslate";

const LanguageContext = createContext({ language: "en", setLanguage: () => {} });

// "it" and "de" also have hand-written translations for the main menus and
// buttons (src/lib/i18n.js). Everything else on the page (listings, blog,
// guides, FAQ...) is translated automatically by Google Translate for every
// non-English language - see src/lib/googleTranslate.js.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "es", label: "ES", name: "Español" },
  { code: "nl", label: "NL", name: "Nederlands" },
  { code: "pl", label: "PL", name: "Polski" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "ar", label: "AR", name: "العربية" },
  { code: "sw", label: "SW", name: "Kiswahili" },
];

const CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

function readStoredLanguage() {
  try {
    const v = localStorage.getItem("zpt_language");
    return CODES.includes(v) ? v : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }) {
  const [language] = useState(readStoredLanguage);

  // On every load: make sure the translator matches the saved language.
  useEffect(() => {
    if (language === "en") {
      // cookie left over from an old session but language is English
      if (applyTranslationCookie("en")) window.location.reload();
      return;
    }
    const changed = applyTranslationCookie(language);
    if (changed) {
      window.location.reload();
      return;
    }
    loadGoogleTranslate(CODES.filter((c) => c !== "en").join(","));
    document.documentElement.lang = language;
  }, [language]);

  // Changing language reloads the page so the translation starts from a clean state.
  const setLanguage = useCallback(
    (code) => {
      if (!CODES.includes(code) || code === language) return;
      try {
        localStorage.setItem("zpt_language", code);
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
      applyTranslationCookie(code);
      window.location.reload();
    },
    [language]
  );

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
