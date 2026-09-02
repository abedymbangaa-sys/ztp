import { useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "../lib/useSEO";
import { HelpCircle, ChevronDown } from "lucide-react";

// Priority 12 - "Common tourist questions" SEO page. Every answer here
// restates something already stated elsewhere on the site (BeforeYouGo,
// the tide widget, the verification standard) rather than introducing new
// factual claims - this page's job is to be the page Google shows for the
// question, not a new source of information.
const FAQS = [
  {
    q: "Do I need a visa for Zanzibar?",
    a: "Most visitors need a Tanzanian visa, which also covers Zanzibar. It can usually be arranged online in advance or on arrival, and the standard single-entry tourist visa costs around $50 USD. Requirements vary by nationality and can change, so confirm with an official Tanzanian government source or your embassy before you travel.",
  },
  {
    q: "Do I need travel insurance for Zanzibar?",
    a: "Yes - all international visitors are required to have Zanzibar Insurance Corporation (ZIC) travel insurance, purchased online in advance or on arrival, even if you already have insurance from home. You may be refused entry without it.",
  },
  {
    q: "What currency should I bring to Zanzibar?",
    a: "The local currency is the Tanzanian Shilling (TZS), but US Dollars are widely accepted for hotels, tours and visa fees. Carry some cash for small shops and markets - cards are mainly accepted at larger hotels and restaurants.",
  },
  {
    q: "Is Zanzibar safe for tourists?",
    a: "Generally yes, with normal travel precautions: agree prices upfront (especially for taxis), keep valuables out of sight, book tours and guides through licensed operators rather than unsolicited street offers, and don't drink tap water.",
  },
  {
    q: "When is the best time to visit Zanzibar?",
    a: "It depends on what you want from your trip - dry season, rainy season and shoulder months each trade off differently on crowds, prices and weather. See our full Best Time to Visit Zanzibar guide for the month-by-month breakdown.",
    link: { to: "/guides/best-time-to-visit-zanzibar", label: "Read the full guide" },
  },
  {
    q: "Which Zanzibar beaches are swimmable at low tide?",
    a: "It varies by coast. North coast beaches (Nungwi, Kendwa) generally stay swimmable at any tide. East coast beaches (Paje, Bwejuu, Jambiani) have a large tidal range and can empty out a long way at low tide - check tide times before planning a swim there.",
  },
  {
    q: "How do I get from the airport to my hotel?",
    a: "Most hotels and tour operators can arrange an airport pickup - it's worth confirming this directly with them before you land. Licensed taxis are also available at the airport; agree the price before you get in, since meters aren't standard.",
  },
  {
    q: "Do I need a local SIM card in Zanzibar?",
    a: "It's not essential but makes things easier - local SIMs (Vodacom, Airtel, Tigo, Zantel) are inexpensive and available at the airport and in Stone Town. Bring your passport, as registration is required by law. Hotel WiFi exists but speeds vary.",
  },
  {
    q: "What does \"Verified\" mean on a Visit Zanzibar Paradise listing?",
    a: "A Verified badge means our team has checked that the business's identity and contact details are real and reachable, that its location matches where it actually operates, and that its photos are current and belong to that specific business.",
    link: { to: "/how-we-verify", label: "See how we verify" },
  },
  {
    q: "Can I book a hotel or tour directly on this website?",
    a: "No - Visit Zanzibar Paradise is a directory and trip-planning tool, not a booking platform. Every listing links you to the business directly by WhatsApp, phone, email or website, so you book and pay the provider yourself with no added commission.",
  },
  {
    q: "How many days do I need in Zanzibar?",
    a: "Three days is enough to properly enjoy one area (beach or Stone Town). Five days lets you combine Stone Town with one coastal area. A full week lets you add a second coastal area or a day trip south for dolphins and Jozani Forest.",
    link: { to: "/guides/zanzibar-itinerary-3-5-7-days", label: "See the full itinerary guide" },
  },
  {
    q: "Nungwi or Kendwa - which should I choose?",
    a: "Nungwi is bigger and busier, with more hotels, restaurants and dive schools within walking distance. Kendwa is smaller and quieter, known for its sunsets and the Kendwa Rocks full-moon parties. They're about ten minutes apart by tuk-tuk.",
    link: { to: "/guides/nungwi-vs-kendwa", label: "Read the full comparison" },
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  useSEO({
    title: "Zanzibar Travel FAQ - Common Tourist Questions | Zanzibar Paradise Tours",
    description: "Visa, insurance, safety, tides, SIM cards and more - straight answers to the questions most visitors ask before a Zanzibar trip.",
    canonical: "https://visitzanzibarparadise.com/faq",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide inline-flex items-center gap-1.5 justify-center">
          <HelpCircle className="w-4 h-4" /> Before You Ask
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Zanzibar Travel FAQ</h1>
        <p className="text-slate-500 mt-2">The questions most visitors have before their trip.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : i)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 font-semibold text-slate-900"
              >
                {item.q}
                <ChevronDown className={"w-4 h-4 shrink-0 text-slate-400 transition-transform " + (open ? "rotate-180" : "")} />
              </button>
              {open && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                  {item.a}
                  {item.link && (
                    <Link to={item.link.to} className="block mt-2 text-teal-700 font-semibold hover:underline">
                      {item.link.label} →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center mt-10">
        <p className="font-bold text-slate-900 mb-1">Still have a question?</p>
        <p className="text-sm text-slate-600 mb-4">Message us directly and we'll point you in the right direction.</p>
        <a
          href="https://wa.me/255635442732"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3 rounded-full"
        >
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
