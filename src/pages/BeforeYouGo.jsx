import { Stamp, ShieldCheck, CircleDollarSign, Sun, Briefcase } from "lucide-react";

function SectionIcon({ icon: Icon }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" strokeWidth={2.2} />
    </div>
  );
}

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

        {/* WHEN TO GO */}
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
