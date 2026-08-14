import { Stamp, ShieldCheck, CircleDollarSign, Sun, Briefcase, Shirt, MessageCircle, Car } from "lucide-react";

function SectionIcon({ icon: Icon }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" strokeWidth={2.2} />
    </div>
  );
}

const SWAHILI_PHRASES = [
  { sw: "Jambo / Hujambo", en: "Hello / How are you", note: "Friendly greeting, works anywhere" },
  { sw: "Karibu", en: "Welcome", note: "You'll hear this constantly — it's genuine" },
  { sw: "Asante (sana)", en: "Thank you (very much)", note: "Always appreciated" },
  { sw: "Bei gani?", en: "What's the price?", note: "Useful at markets and with taxis" },
  { sw: "Pole pole", en: "Slowly, slowly", note: "The island's unofficial motto — take it easy" },
  { sw: "Hakuna matata", en: "No problem / No worries", note: "Yes, it's a real phrase, not just from the movie" },
  { sw: "Tafadhali", en: "Please", note: "Goes a long way when asking for anything" },
  { sw: "Kwaheri", en: "Goodbye", note: "Simple send-off" },
];

export default function BeforeYouGo() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Before You Go: Zanzibar Travel Essentials</h1>
      <p className="text-slate-500 mb-10">
        Everything international travelers need to sort out before landing in Zanzibar — visa, insurance, money, and
        practical tips, in one place.
      </p>

      <div className="space-y-10 text-slate-700 leading-relaxed">

        {/* VISA */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={Stamp} />
            <h2 className="text-xl font-bold text-slate-900">Visa</h2>
          </div>
          <p className="mb-3">
            Zanzibar is part of Tanzania, so most international visitors — including travelers from Europe, the
            UK, and North America — need a visa to enter. You have two main options:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>eVisa (recommended):</strong> Apply online before you travel through the official Tanzania
              Immigration eVisa portal. This lets you skip the queue on arrival.
            </li>
            <li>
              <strong>Visa on arrival:</strong> Available for many nationalities at Abeid Amani Karume
              International Airport and other official entry points.
            </li>
          </ul>
          <p className="mt-3">
            The standard single-entry tourist visa costs around <strong>$50 USD</strong>. Requirements can change,
            so always check the official Tanzania Immigration website or your country's Tanzania embassy for the
            latest rules before you travel.
          </p>
        </section>

        {/* INSURANCE */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={ShieldCheck} />
            <h2 className="text-xl font-bold text-slate-900">Mandatory Travel Insurance</h2>
          </div>
          <p className="mb-3">
            This catches a lot of first-time visitors off guard: <strong>all international travelers to Zanzibar
            are required to purchase Zanzibar Insurance Corporation (ZIC) travel insurance</strong>, either in
            advance online or on arrival — even if you already hold travel insurance from your home country.
          </p>
          <p>
            You may be refused entry without it, so budget for this as a fixed cost of your trip and try to
            arrange it before you fly if an online option is available.
          </p>
        </section>

        {/* MONEY */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={CircleDollarSign} />
            <h2 className="text-xl font-bold text-slate-900">Money & Currency</h2>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li>The local currency is the <strong>Tanzanian Shilling (TZS)</strong>, but <strong>US Dollars</strong>{" "}
              are widely accepted for hotels, tours, and visa fees.</li>
            <li>If you're coming from Europe, it's usually easiest to change Euros or Pounds into USD before you
              arrive, or withdraw USD/TZS from ATMs once in Zanzibar.</li>
            <li>Carry some cash for small shops, local markets, and tips — cards are mainly accepted at larger
              hotels and restaurants.</li>
            <li>Exchanging money in Stone Town banks or official bureaus typically gives a better rate than the
              airport.</li>
          </ul>
        </section>

        {/* BEST TIME */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={Sun} />
            <h2 className="text-xl font-bold text-slate-900">Best Time to Visit</h2>
          </div>
          <p>
            Zanzibar is warm and tropical year-round, but the long rains typically fall from March to May, and
            short rains around November. Most travelers find June–October and December–February the most
            reliable for sunshine. If you're booking a tour during the rainy season, ask your operator how they
            handle weather delays — a good operator will explain their reschedule or refund policy upfront.
          </p>
        </section>

        {/* DRESS CODE */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={Shirt} />
            <h2 className="text-xl font-bold text-slate-900">Dress Code: Stone Town vs. the Beach</h2>
          </div>
          <p className="mb-3">
            Zanzibar is predominantly Muslim, and what's comfortable on a resort beach isn't always appropriate
            a few kilometers away in town. A simple rule: <strong>cover up off the beach.</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-900 mb-2">Stone Town & villages</p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm">
                <li>Shoulders and knees covered for both men and women</li>
                <li>Loose, lightweight clothing works best in the heat</li>
                <li>Swimwear should stay at the beach or pool, not in the streets</li>
                <li>A light scarf is handy if you plan to visit a mosque</li>
              </ul>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-900 mb-2">Resort beaches</p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm">
                <li>Swimwear is fine directly on hotel/resort beach fronts</li>
                <li>Public or village-adjacent beaches call for more modesty</li>
                <li>Bring a cover-up or sarong for walking between beach and town</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SWAHILI LEXICON */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={MessageCircle} />
            <h2 className="text-xl font-bold text-slate-900">Mini Swahili Lexicon</h2>
          </div>
          <p className="mb-4">
            English and Swahili are both widely understood in tourist areas, but a few local phrases go a long
            way — Zanzibaris warm up fast to visitors who make the effort.
          </p>
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {SWAHILI_PHRASES.map((p) => (
              <div key={p.sw} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3">
                <span className="font-semibold text-teal-700 w-full sm:w-40 shrink-0">{p.sw}</span>
                <span className="text-slate-700 sm:w-40 shrink-0">{p.en}</span>
                <span className="text-slate-400 text-sm">{p.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SAFETY & GETTING AROUND */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={Car} />
            <h2 className="text-xl font-bold text-slate-900">Getting Around & Safety</h2>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Dala-dala (shared minibus):</strong> The cheapest way to get around and a genuine local
              experience, but slower and crowded — best if you're not in a hurry and want to travel like a local.
            </li>
            <li>
              <strong>Taxi:</strong> More comfortable and direct. Agree the price with the driver before you get
              in, since meters aren't standard — your hotel or listing host can usually tell you a fair rate.
            </li>
            <li>
              <strong>Private transfer / tour driver:</strong> The easiest option for airport pickups and day
              trips, especially arranged through a verified operator on this site.
            </li>
            <li>
              Zanzibar is generally safe for tourists, but use normal precautions: agree prices upfront, keep
              valuables out of sight, and stick to licensed guides and operators rather than unsolicited street
              offers.
            </li>
            <li>
              Tap water isn't recommended for drinking — bottled or filtered water is cheap and widely available.
            </li>
          </ul>
        </section>

        {/* PRACTICAL TIPS */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <SectionIcon icon={Briefcase} />
            <h2 className="text-xl font-bold text-slate-900">Quick Practical Tips</h2>
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li>Zanzibar is predominantly Muslim — modest dress is appreciated outside of resort beaches,
              especially in Stone Town and villages.</li>
            <li>WhatsApp is the fastest way to reach local hotels, guides, and tour operators directly — most
              listings on this site connect you straight to a business's WhatsApp.</li>
            <li>Look for businesses with a verified badge on this platform — it means we've confirmed their
              details, which helps you avoid unlicensed touts.</li>
            <li>Average stay for international visitors is around a week — plan a mix of beach time, a Stone
              Town day, and at least one cultural or spice tour to get the full picture of the island.</li>
          </ul>
        </section>

        <p className="text-sm text-slate-400 pt-4 border-t border-slate-100">
          Travel requirements can change without notice. This page is a general guide — always confirm visa,
          insurance, and entry requirements with official Tanzanian government sources or your airline before you
          travel.
        </p>
      </div>
    </div>
  );
}
