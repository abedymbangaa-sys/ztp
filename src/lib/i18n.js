import { useLanguage } from "./LanguageContext";
// Central dictionary for UI strings shown to visitors (nav, buttons, common
// labels). Listing-specific content (descriptions) is translated separately
// per-listing in Supabase (description_it / description_de columns) since
// that's business-owner-authored content, not app UI.
//
// Add a new string: put the English text as the key, then give the it/de
// version. Any string missing from a language automatically falls back to
// English, so partial coverage never breaks the page.
const STRINGS = {
  // Navbar
  "Home": { it: "Home", de: "Startseite" },
  "Things to Do": { it: "Cosa Fare", de: "Aktivitäten" },
  "Hotels": { it: "Hotel", de: "Hotels" },
  "Tours": { it: "Tour", de: "Touren" },
  "Explore More": { it: "Esplora Altro", de: "Mehr Entdecken" },
  "Before You Go": { it: "Prima di Partire", de: "Vor der Reise" },
  "Beaches": { it: "Spiagge", de: "Strände" },
  "Restaurants": { it: "Ristoranti", de: "Restaurants" },
  "Attractions": { it: "Attrazioni", de: "Attraktionen" },
  "Heritage": { it: "Patrimonio", de: "Kulturerbe" },
  "Blog": { it: "Blog", de: "Blog" },
  "Itinerary": { it: "Itinerario", de: "Reiseplan" },
  "Advertise": { it: "Pubblicizza", de: "Werben" },
  "Own a business? Log in": { it: "Hai un'attività? Accedi", de: "Unternehmer? Anmelden" },
  "WhatsApp Us": { it: "WhatsApp", de: "WhatsApp" },
  "Language:": { it: "Lingua:", de: "Sprache:" },
  // Home hero
  "Discover the": { it: "Scopri lo", de: "Entdecke das" },
  "Real": { it: "Vero", de: "Echte" },
  "Zanzibar": { it: "Zanzibar", de: "Sansibar" },
  "A trusted directory of hotels, tours, and attractions in Zanzibar — built by people who know this island well.": {
    it: "Una directory affidabile di hotel, tour e attrazioni a Zanzibar, creata da chi conosce bene quest'isola.",
    de: "Ein vertrauenswürdiges Verzeichnis für Hotels, Touren und Attraktionen auf Sansibar, erstellt von Menschen, die die Insel gut kennen.",
  },
  "Search hotels, tours, beaches...": { it: "Cerca hotel, tour, spiagge...", de: "Hotels, Touren, Strände suchen..." },
  "Search": { it: "Cerca", de: "Suchen" },
  "View Hotels": { it: "Vedi Hotel", de: "Hotels Ansehen" },
  // Cards / listings
  "Verified": { it: "Verificato", de: "Verifiziert" },
  "View Details": { it: "Vedi Dettagli", de: "Details Ansehen" },
  // Detail page
  "Back to": { it: "Torna a", de: "Zurück zu" },
  "Send Enquiry": { it: "Invia Richiesta", de: "Anfrage Senden" },
  "View on Google Maps": { it: "Vedi su Google Maps", de: "Auf Google Maps Ansehen" },
  "Own this business? Claim, edit or request removal": {
    it: "Sei il proprietario? Rivendica, modifica o richiedi la rimozione",
    de: "Gehört Ihnen dieses Unternehmen? Beanspruchen, bearbeiten oder Entfernung beantragen",
  },
  "Weather / Cancellation Policy": { it: "Politica Meteo / Cancellazione", de: "Wetter- / Stornierungsrichtlinie" },
  "Explore Nearby": { it: "Esplora nei Dintorni", de: "In der Nähe Entdecken" },
  "See all": { it: "Vedi tutto", de: "Alle Anzeigen" },
  // Filters (Location / Tags — added for the new FilterBar component)
  "Location": { it: "Posizione", de: "Standort" },
  "Tags": { it: "Tag", de: "Tags" },
  "Clear filters": { it: "Cancella filtri", de: "Filter löschen" },
  "e.g. Stone Town, Nungwi...": { it: "es. Stone Town, Nungwi...", de: "z.B. Stone Town, Nungwi..." },
  // Footer
  "About Us": { it: "Chi Siamo", de: "Über Uns" },
  "Data Source & Removal Notice": { it: "Fonte dei Dati e Rimozione", de: "Datenquelle & Entfernungshinweis" },
  "Privacy Policy": { it: "Informativa sulla Privacy", de: "Datenschutzrichtlinie" },
  "Terms of Service": { it: "Termini di Servizio", de: "Nutzungsbedingungen" },
  "Built by Wachu Digital Growth": { it: "Realizzato da Wachu Digital Growth", de: "Erstellt von Wachu Digital Growth" },
};

export function translate(key, language) {
  if (language === "en" || !language) return key;
  return STRINGS[key]?.[language] || key;
}

// Usage: const t = useT(); ... {t("Home")}
export function useT() {
  const { language } = useLanguage();
  return (key) => translate(key, language);
}
