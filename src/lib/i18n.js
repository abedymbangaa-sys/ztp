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

  // Amenities card (listing detail page)
  "Amenities & Features": { it: "Servizi e Caratteristiche", de: "Ausstattung & Merkmale" },

  // Compare page
  "Compare": { it: "Confronta", de: "Vergleichen" },
  "Side by side, using only what each business has told us - no ratings or prices we've made up.": {
    it: "A confronto, usando solo ciò che ogni attività ci ha comunicato - nessuna valutazione o prezzo inventato.",
    de: "Im direkten Vergleich, nur mit Angaben der Unternehmen selbst - keine erfundenen Bewertungen oder Preise.",
  },
  "Nothing to compare yet.": { it: "Ancora nulla da confrontare.", de: "Noch nichts zum Vergleichen." },
  "Price range": { it: "Fascia di prezzo", de: "Preisspanne" },
  "Contact provider for current price": { it: "Contatta il fornitore per il prezzo attuale", de: "Aktuellen Preis beim Anbieter erfragen" },
  "Duration": { it: "Durata", de: "Dauer" },
  "Not provided": { it: "Non fornito", de: "Nicht angegeben" },
  "Reviews": { it: "Recensioni", de: "Bewertungen" },
  "No reviews yet": { it: "Nessuna recensione ancora", de: "Noch keine Bewertungen" },
  "Best for": { it: "Ideale per", de: "Ideal für" },
  "Not specified": { it: "Non specificato", de: "Nicht angegeben" },
  "Amenities": { it: "Servizi", de: "Ausstattung" },
  "Description": { it: "Descrizione", de: "Beschreibung" },
  "Contact": { it: "Contatto", de: "Kontakt" },

  // Where Should I Stay
  "Where Should I Stay?": { it: "Dove Dovrei Alloggiare?", de: "Wo Sollte Ich Wohnen?" },
  "Find the right part of Zanzibar": { it: "Trova la zona giusta di Zanzibar", de: "Finde den richtigen Teil Sansibars" },
  "Two quick questions - we'll point you to the area that actually fits, and explain why.": {
    it: "Due semplici domande - ti indicheremo la zona più adatta e il perché.",
    de: "Zwei kurze Fragen - wir zeigen dir das passende Gebiet und erklären warum.",
  },
  "What matters most for this trip?": { it: "Cosa conta di più per questo viaggio?", de: "Was ist dir bei dieser Reise am wichtigsten?" },
  "Who's travelling?": { it: "Chi viaggia?", de: "Wer reist?" },
  "Back": { it: "Indietro", de: "Zurück" },
  "Start over": { it: "Ricomincia", de: "Neu starten" },
  "Best match": { it: "Miglior corrispondenza", de: "Beste Übereinstimmung" },

  // Zanzibar by Budget
  "Zanzibar by Budget": { it: "Zanzibar per Budget", de: "Sansibar nach Budget" },
  "Plan around what you want to spend": { it: "Pianifica in base al tuo budget", de: "Plane nach deinem Budget" },
  "Budget Zanzibar": { it: "Zanzibar Economico", de: "Sansibar Günstig" },
  "Mid-Range Zanzibar": { it: "Zanzibar Fascia Media", de: "Sansibar Mittelklasse" },
  "Luxury Zanzibar": { it: "Zanzibar di Lusso", de: "Sansibar Luxus" },

  // FAQ
  "Zanzibar Travel FAQ": { it: "Domande Frequenti su Zanzibar", de: "Häufige Fragen zu Sansibar" },
  "Before You Ask": { it: "Prima di Chiedere", de: "Bevor Du Fragst" },
  "The questions most visitors have before their trip.": {
    it: "Le domande più comuni dei visitatori prima del viaggio.",
    de: "Die häufigsten Fragen von Besuchern vor der Reise.",
  },
  "Still have a question?": { it: "Hai ancora una domanda?", de: "Noch eine Frage?" },
  "Ask on WhatsApp": { it: "Chiedi su WhatsApp", de: "Auf WhatsApp fragen" },

  // Best in Area
  "No listings tagged for this tier yet.": { it: "Nessun annuncio ancora in questa fascia.", de: "Noch keine Einträge in dieser Kategorie." },
  "Browse all": { it: "Sfoglia tutti", de: "Alle durchsuchen" },
  "Area not found": { it: "Zona non trovata", de: "Gebiet nicht gefunden" },

  // Trip Builder additions
  "Approximate budget": { it: "Budget indicativo", de: "Ungefähres Budget" },
  "Number of travelers": { it: "Numero di viaggiatori", de: "Anzahl der Reisenden" },
  "(optional)": { it: "(facoltativo)", de: "(optional)" },
  "Couple": { it: "Coppia", de: "Paar" },
  "Family": { it: "Famiglia", de: "Familie" },
  "Solo": { it: "Da solo", de: "Alleine" },
  "Friends": { it: "Amici", de: "Freunde" },
  "Honeymoon": { it: "Luna di miele", de: "Flitterwochen" },
  "Budget": { it: "Economico", de: "Günstig" },
  "Mid-range": { it: "Fascia media", de: "Mittelklasse" },
  "Luxury": { it: "Lusso", de: "Luxus" },

  // Where Should I Stay - quiz option labels
  "Nightlife & sunset bars": { it: "Vita notturna e bar al tramonto", de: "Nachtleben & Sunset-Bars" },
  "Kite-surfing": { it: "Kitesurf", de: "Kitesurfen" },
  "History & culture": { it: "Storia e cultura", de: "Geschichte & Kultur" },
  "Quiet, away from crowds": { it: "Tranquillo, lontano dalla folla", de: "Ruhig, abseits der Menschenmassen" },
  "Wildlife & nature": { it: "Fauna e natura", de: "Tierwelt & Natur" },
  "A beach that's swimmable at any tide": { it: "Una spiaggia balneabile con ogni marea", de: "Ein Strand, der bei jeder Gezeit zum Schwimmen einlädt" },
  "Couple / honeymoon": { it: "Coppia / luna di miele", de: "Paar / Flitterwochen" },
  "Family with children": { it: "Famiglia con bambini", de: "Familie mit Kindern" },
  "Friends / group": { it: "Amici / gruppo", de: "Freunde / Gruppe" },
  "Because you want": { it: "Perché vuoi", de: "Weil du möchtest" },
  "We couldn't match that combination yet - browse": { it: "Non abbiamo ancora una corrispondenza per questa combinazione - sfoglia", de: "Für diese Kombination gibt es noch keine Übereinstimmung - durchsuche" },
  "all areas": { it: "tutte le zone", de: "alle Gebiete" },
  "instead.": { it: "invece.", de: "stattdessen." },
  "Best for:": { it: "Ideale per:", de: "Ideal für:" },
  "See places to stay in": { it: "Vedi dove alloggiare a", de: "Unterkünfte in" },
  "Not sure yet, or splitting your trip across areas?": { it: "Non sei ancora sicuro, o vuoi dividere il viaggio tra più zone?", de: "Noch unsicher, oder möchtest du die Reise auf mehrere Gebiete aufteilen?" },
  "The Trip Builder can put together a full day-by-day plan across more than one area.": {
    it: "Il Trip Builder può creare un piano giorno per giorno su più zone.",
    de: "Der Trip Builder kann einen kompletten Tagesplan über mehrere Gebiete hinweg erstellen.",
  },
  "Build My Zanzibar Trip": { it: "Crea il Mio Viaggio a Zanzibar", de: "Meine Sansibar-Reise Erstellen" },
  "Plan around what you want to spend": { it: "Pianifica in base a quanto vuoi spendere", de: "Plane nach deinem Budget" },
  "Every listing sets its own price range, shown on its card - we don't estimate a daily total for you, since that changes with the season, the operator, and how you travel. What we can do is group real listings by tier, so you're browsing the right ones from the start.": {
    it: "Ogni annuncio indica la propria fascia di prezzo, mostrata sulla scheda - non stimiamo un totale giornaliero, perché varia con la stagione, l'operatore e il tuo stile di viaggio. Quello che possiamo fare è raggruppare gli annunci reali per fascia, così parti già dai quelli giusti.",
    de: "Jeder Eintrag zeigt seine eigene Preisspanne auf der Karte - wir schätzen keinen Tagesbetrag, da dieser je nach Saison, Anbieter und Reisestil variiert. Wir gruppieren echte Einträge nach Kategorie, damit du gleich die richtigen siehst.",
  },
  "For visa fees and other fixed costs that apply to every visitor, see the": {
    it: "Per i costi del visto e altre spese fisse valide per tutti i visitatori, consulta la",
    de: "Für Visagebühren und andere feste Kosten, die für alle Besucher gelten, siehe den",
  },
  "Before You Go guide": { it: "guida Prima di Partire", de: "Vor-der-Reise-Leitfaden" },
  "Budget Zanzibar": { it: "Zanzibar Economico", de: "Sansibar Günstig" },
  "Mid-Range Zanzibar": { it: "Zanzibar Fascia Media", de: "Sansibar Mittelklasse" },
  "Luxury Zanzibar": { it: "Zanzibar di Lusso", de: "Sansibar Luxus" },
  "Real value without cutting the experience short - selected for genuine value for money, not just the lowest sticker price.": {
    it: "Un ottimo rapporto qualità-prezzo senza rinunciare all'esperienza - selezionati per il valore reale, non solo per il prezzo più basso.",
    de: "Echter Wert, ohne beim Erlebnis zu sparen - ausgewählt für echtes Preis-Leistungs-Verhältnis, nicht nur den niedrigsten Preis.",
  },
  "Comfortable, well-run places that aren't chasing either extreme - the largest group of listings on the site.": {
    it: "Posti confortevoli e ben gestiti, senza puntare a un estremo o all'altro - il gruppo più numeroso di annunci sul sito.",
    de: "Komfortable, gut geführte Orte ohne Extreme - die größte Gruppe von Einträgen auf der Seite.",
  },
  "For travellers who want Zanzibar at its most polished - selected for high-end finish, service standard and privacy.": {
    it: "Per chi vuole Zanzibar al suo meglio - selezionati per rifiniture di alto livello, standard di servizio e privacy.",
    de: "Für Reisende, die Sansibar von seiner besten Seite erleben wollen - ausgewählt für Premium-Ausstattung, Service und Privatsphäre.",
  },
  "No listings tagged for this tier yet.": { it: "Nessun annuncio ancora in questa fascia.", de: "Noch keine Einträge in dieser Kategorie." },
  "See all": { it: "Vedi tutti", de: "Alle ansehen" },

  // Best In Area
  "Best": { it: "I Migliori", de: "Die Besten" },
  "in": { it: "a", de: "in" },
  "Real, contactable": { it: "Reali e contattabili,", de: "Echte, kontaktierbare" },
  "in and around": { it: "a e nei dintorni di", de: "in und um" },
  "reach out directly, no booking fees added.": { it: "contatta direttamente, senza commissioni di prenotazione.", de: "direkt kontaktieren, keine Buchungsgebühren." },
  "No": { it: "Nessun", de: "Kein(e)" },
  "listed in": { it: "elencato a", de: "gelistet in" },
  "yet.": { it: "ancora.", de: "bisher." },
  "More businesses are joining regularly - check back soon.": { it: "Nuove attività si aggiungono regolarmente - torna a controllare presto.", de: "Regelmäßig kommen neue Unternehmen hinzu - schau bald wieder vorbei." },
  "Browse all": { it: "Sfoglia tutti", de: "Alle durchsuchen" },
  "Try Again": { it: "Riprova", de: "Erneut versuchen" },
  "Area not found": { it: "Zona non trovata", de: "Gebiet nicht gefunden" },
  "Message us directly and we'll point you in the right direction.": {
    it: "Scrivici direttamente e ti indicheremo la strada giusta.",
    de: "Schreib uns direkt und wir zeigen dir die richtige Richtung.",
  },
  "Browse by Beach & Village": { it: "Sfoglia per Spiaggia e Villaggio", de: "Nach Strand & Dorf durchsuchen" },
  "Best Hotels": { it: "Migliori Hotel", de: "Beste Hotels" },
  "Best Tours": { it: "Migliori Tour", de: "Beste Touren" },
  "Best Restaurants": { it: "Migliori Ristoranti", de: "Beste Restaurants" },
  "Where are you staying?": { it: "Dove alloggi?", de: "Wo übernachtest du?" },
  "Travel dates": { it: "Date del viaggio", de: "Reisedaten" },

  // AREAS data - taglines, descriptions, whoItSuits (shown on /area/:key and Where Should I Stay results)
  "Zanzibar's UNESCO old town — history, spice markets and rooftop sunsets": {
    it: "La città vecchia UNESCO di Zanzibar — storia, mercati delle spezie e tramonti dal tetto",
    de: "Sansibars UNESCO-Altstadt — Geschichte, Gewürzmärkte und Sonnenuntergänge von der Dachterrasse",
  },
  "Stone Town is Zanzibar's historic heart: narrow alleys, carved wooden doors, the old slave market, spice markets, and rooftop restaurants over the harbour. It's the best base for culture, food and day-trip boats to Prison Island.": {
    it: "Stone Town è il cuore storico di Zanzibar: vicoli stretti, porte in legno intagliato, l'antico mercato degli schiavi, mercati delle spezie e ristoranti sul tetto affacciati sul porto. È la base migliore per cultura, cibo e gite in barca a Prison Island.",
    de: "Stone Town ist Sansibars historisches Herz: enge Gassen, geschnitzte Holztüren, der alte Sklavenmarkt, Gewürzmärkte und Dachrestaurants über dem Hafen. Die beste Basis für Kultur, Essen und Bootsausflüge zur Prison Island.",
  },
  "First-time visitors, culture and history lovers, foodies, short layovers before/after the beach.": {
    it: "Visitatori alla prima esperienza, amanti della cultura e della storia, buongustai, brevi soste prima/dopo la spiaggia.",
    de: "Erstbesucher, Kultur- und Geschichtsliebhaber, Feinschmecker, kurze Zwischenstopps vor/nach dem Strand.",
  },
  "Nungwi & Kendwa — Zanzibar's most famous beaches and sunset swims": {
    it: "Nungwi e Kendwa — le spiagge più famose di Zanzibar e bagni al tramonto",
    de: "Nungwi & Kendwa — Sansibars berühmteste Strände und Sonnenuntergangs-Schwimmen",
  },
  "The north coast around Nungwi and Kendwa has the island's calmest, most swimmable beaches at every tide, plus the liveliest sunset bars and dhow trips. It's the most popular first stop for beach holidays.": {
    it: "La costa nord intorno a Nungwi e Kendwa ha le spiagge più calme e balneabili dell'isola con ogni marea, oltre ai bar al tramonto più animati e alle gite in dhow. È la prima tappa più popolare per le vacanze al mare.",
    de: "Die Nordküste um Nungwi und Kendwa hat die ruhigsten, bei jeder Gezeit schwimmbaren Strände der Insel sowie die lebhaftesten Sunset-Bars und Dhau-Ausflüge. Der beliebteste erste Halt für Strandurlaub.",
  },
  "Beach lovers, honeymooners, groups who want swimmable water at any tide, sunset/nightlife seekers.": {
    it: "Amanti del mare, coppie in luna di miele, gruppi che vogliono acqua balneabile con ogni marea, chi cerca tramonti e vita notturna.",
    de: "Strandliebhaber, Flitterwöchner, Gruppen, die bei jeder Gezeit schwimmen möchten, Sonnenuntergangs- und Nachtleben-Fans.",
  },
  "Paje, Bwejuu & Jambiani — kite-surfing, quiet villages, white sand": {
    it: "Paje, Bwejuu e Jambiani — kitesurf, villaggi tranquilli, sabbia bianca",
    de: "Paje, Bwejuu & Jambiani — Kitesurfen, ruhige Dörfer, weißer Sand",
  },
  "The east coast (Paje, Bwejuu, Jambiani, Michamvi) is quieter and more laid-back than the north, with wide white beaches, seaweed farms, and some of the best kite-surfing conditions in East Africa.": {
    it: "La costa est (Paje, Bwejuu, Jambiani, Michamvi) è più tranquilla e rilassata rispetto al nord, con ampie spiagge bianche, coltivazioni di alghe e alcune delle migliori condizioni per il kitesurf dell'Africa orientale.",
    de: "Die Ostküste (Paje, Bwejuu, Jambiani, Michamvi) ist ruhiger und entspannter als der Norden, mit breiten weißen Stränden, Algenfarmen und einigen der besten Kitesurf-Bedingungen Ostafrikas.",
  },
  "Kite-surfers, budget/backpacker travellers, couples wanting quiet villages over nightlife.": {
    it: "Kitesurfisti, viaggiatori con budget limitato/zaino in spalla, coppie che preferiscono villaggi tranquilli alla vita notturna.",
    de: "Kitesurfer, Budget-/Backpacker-Reisende, Paare, die ruhige Dörfer statt Nachtleben bevorzugen.",
  },
  "Kizimkazi dolphins, Jozani Forest and quieter shores": {
    it: "Delfini di Kizimkazi, Foresta di Jozani e spiagge più tranquille",
    de: "Kizimkazi-Delfine, Jozani-Wald und ruhigere Küsten",
  },
  "The south of Zanzibar is home to Kizimkazi's dolphin tours, Jozani-Chwaka Bay National Park (home to the red colobus monkey), and a handful of low-key beach lodges away from the crowds.": {
    it: "Il sud di Zanzibar ospita le gite in barca per vedere i delfini a Kizimkazi, il Parco Nazionale Jozani-Chwaka Bay (casa della scimmia colobo rosso) e alcuni lodge sulla spiaggia lontani dalla folla.",
    de: "Der Süden Sansibars beherbergt die Delfintouren von Kizimkazi, den Jozani-Chwaka-Bay-Nationalpark (Heimat des Rotstummel-Stummelaffen) und einige ruhige Strand-Lodges abseits der Menschenmassen.",
  },
  "Nature lovers, wildlife/dolphin-tour travellers, people wanting fewer crowds.": {
    it: "Amanti della natura, viaggiatori interessati a delfini e fauna selvatica, chi cerca meno folla.",
    de: "Naturliebhaber, Wildlife-/Delfintour-Reisende, Menschen, die weniger Menschenmassen möchten.",
  },
  "Spice farms, Jozani Forest and the island's green interior": {
    it: "Piantagioni di spezie, Foresta di Jozani e l'entroterra verde dell'isola",
    de: "Gewürzplantagen, Jozani-Wald und das grüne Inselinnere",
  },
  "Central Zanzibar is spice-farm country - the source of the island's nickname 'Spice Island' - along with forest reserves and cultural stops between Stone Town and the coasts.": {
    it: "Zanzibar centrale è terra di piantagioni di spezie - da cui il soprannome 'Isola delle Spezie' - oltre a riserve forestali e tappe culturali tra Stone Town e le coste.",
    de: "Zentral-Sansibar ist Gewürzplantagen-Land - Ursprung des Spitznamens 'Gewürzinsel' - mit Waldreservaten und kulturellen Stopps zwischen Stone Town und den Küsten.",
  },
  "Day-trippers based in Stone Town or the coasts, culture and nature travellers, not an overnight base for most visitors.": {
    it: "Escursionisti in giornata con base a Stone Town o sulle coste, viaggiatori interessati a cultura e natura, non una base per pernottare per la maggior parte dei visitatori.",
    de: "Tagesausflügler mit Basis in Stone Town oder an den Küsten, Kultur- und Naturreisende, für die meisten Besucher keine Übernachtungsbasis.",
  },
  "Zanzibar's quiet sister island — untouched reefs and forest": {
    it: "L'isola sorella tranquilla di Zanzibar — barriere coralline e foreste incontaminate",
    de: "Sansibars ruhige Schwesterinsel — unberührte Riffe und Wald",
  },
  "Pemba, north of Zanzibar's main island, is greener, quieter and far less visited - known for pristine diving reefs, clove plantations, and a slower pace than Unguja.": {
    it: "Pemba, a nord dell'isola principale di Zanzibar, è più verde, tranquilla e molto meno visitata - nota per barriere coralline incontaminate, piantagioni di chiodi di garofano e un ritmo più lento rispetto a Unguja.",
    de: "Pemba, nördlich der Hauptinsel Sansibars, ist grüner, ruhiger und deutlich weniger besucht - bekannt für unberührte Tauchriffe, Gewürznelkenplantagen und ein langsameres Tempo als Unguja.",
  },
  "Divers, travellers wanting an off-the-beaten-path escape, longer stays rather than day trips.": {
    it: "Sub, viaggiatori in cerca di una fuga fuori dai sentieri battuti, soggiorni lunghi piuttosto che gite in giornata.",
    de: "Taucher, Reisende, die abseits der ausgetretenen Pfade suchen, längere Aufenthalte statt Tagesausflüge.",
  },
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
