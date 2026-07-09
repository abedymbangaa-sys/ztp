import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ language: "en", setLanguage: () => {} });

// Kept intentionally small — this is for translating a few key listing
// fields (description), not a full site-wide i18n system.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "de", label: "DE", name: "Deutsch" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("zpt_language") || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("zpt_language", language);
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
