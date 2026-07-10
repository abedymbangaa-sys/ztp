import { useEffect, useState, Suspense, lazy } from "react";
import { Link, useLocation } from "react-router-dom";
import { useListings, useCategories, useSettings } from "../data/hooks";
import GenericCard from "../components/GenericCard";
import { SectionIcon } from "../lib/icons";
import StatsCounter from "../components/StatsCounter";
import { useT } from "../lib/i18n";
// Leaflet + react-leaflet is a heavy library (~150kB). Lazy-loading it
// means visitors who never scroll down to the map never download it.
const ZanzibarMap = lazy(() => import("../components/ZanzibarMap"));
import AdvertiseSection from "../components/AdvertiseSection";
import AdvertiseFormModal from "../components/AdvertiseFormModal";
import PaymentInstructions from "../components/PaymentInstructions";

export default function Home() {
  const location = useLocation();
  const t = useT();
  const { categories } = useCategories();
  const { listings: hotels } = useListings("hotels");
  const { listings: allApproved } = useListings();
  const { settings } = useSettings();
  const adPrice = Number(settings.ad_price_usd) || 15;
  const topHotels = hotels.slice(0, 6);

  const [adFormOpen, setAdFormOpen] = useState(false);
  const [pendingAd, setPendingAd] = useState(null); // ad row awaiting payment confirmation

  useEffect(() => {
    if (location.hash === "#advertise") {
      const el = document.getElementById("advertise");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  return (
    <div>
      {/* Hero */}
      <section className="relative text-white overflow-hidden min-h-[640px] flex items-center bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900">
        <img
          src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=85&auto=format&fit=crop"
          alt="Zanzibar coastline"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-teal-950/45 to-slate-950/85" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32 text-center w-full">
          <p className="uppercase tracking-[0.35em] text-amber-300 text-xs sm:text-sm font-semibold mb-5">
            Welcome to Zanzibar
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl font-bold mb-6 leading-[0.98] tracking-tight drop-shadow-2xl">
            {t("Discover the")}
            <br />
            <span className="italic text-amber-200">{t("Real")}</span> {t("Zanzibar")}
          </h1>
          <p className="max-w-2xl mx-auto text-slate-100/90 text-base sm:text-xl mb-10 px-2 font-light">
            {t("A trusted directory of hotels, tours, and attractions in Zanzibar — built by people who know this island well.")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.elements.heroSearch.value.trim();
              window.location.href = q ? `/hotels?q=${encodeURIComponent(q)}` : "/hotels";
            }}
            className="max-w-xl mx-auto mb-10 flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl ring-1 ring-white/20 p-1.5 sm:p-2"
          >
            <input
              name="heroSearch"
              type="text"
              placeholder={t("Search hotels, tours, beaches...")}
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 px-5 py-3 text-sm sm:text-base focus:outline-none"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 transition text-slate-900 font-bold px-6 sm:px-7 py-3 rounded-full text-sm sm:text-base whitespace-nowrap shadow-md"
            >
              {t("Search")}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link
              to="/things-to-do"
              className="bg-amber-500 hover:bg-amber-400 transition text-slate-900 font-bold px-7 py-3.5 rounded-full shadow-lg"
            >
              {t("Things to Do")}
            </Link>
            <Link
              to="/hotels"
              className="bg-white text-teal-900 font-bold px-7 py-3.5 rounded-full hover:bg-amber-50 transition shadow-lg"
            >
              {t("View Hotels")}
            </Link>
            <a
              href="https://wa.me/255635442732"
              target="_blank"
              rel="noreferrer"
              className="border-2 border-white/80 font-bold px-7 py-3.5 rounded-full hover:bg-white/10 transition backdrop-blur-sm"
            >
              Ask Now
            </a>
          </div>
        </div>
      </section>

      <StatsCounter />

      <AdvertiseSection />

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Top Hotels</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Handpicked For You</h2>
          </div>
          <Link to="/hotels" className="text-teal-700 font-semibold hover:underline hidden md:block">
            View All →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topHotels.map((h) => (
            <GenericCard key={h.id} item={h} sectionKey="hotels" />
          ))}
        </div>
      </section>

      {/* Explore all categories */}
      <section className="max-w-6xl mx-auto px-4 py-4 pb-16">
        <div className="mb-8">
          <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Explore More</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Everything About Zanzibar</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Link
              key={c.key}
              to={`/${c.key}`}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-teal-300 transition"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-700">
                <SectionIcon sectionKey={c.key} className="w-6 h-6" />
              </span>
              <div>
                <p className="font-bold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-500">{c.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive map */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-8">
          <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Map</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Explore Zanzibar on the Map</h2>
        </div>
        <Suspense
          fallback={
            <div className="h-[420px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
              Loading map...
            </div>
          }
        >
          <ZanzibarMap listings={allApproved} />
        </Suspense>
      </section>

      {/* Advertise with us */}
      <section id="advertise" className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Do You Have a Business in Zanzibar?</h2>
          <p className="text-slate-600 mb-8">
            There are two ways to get in front of travelers here — pick whichever fits you.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">1. Free Directory Listing</h3>
              <p className="text-sm text-slate-600 mb-5">
                List your hotel, tour, restaurant or destination in our directory at no cost. No commissions,
                no fees — founding partners get free listings during this period.
              </p>
              <Link
                to="/partner/signup"
                className="inline-block bg-teal-700 text-white font-bold px-5 py-2.5 rounded-full hover:bg-teal-800 transition text-sm"
              >
                Sign Up Free
              </Link>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">2. Featured Advertising — ${adPrice}/month</h3>
              <p className="text-sm text-slate-600 mb-5">
                Get your business shown in the dedicated "Featured Businesses" spotlight seen by every visitor
                to the homepage — a paid extra, separate from the free listing above.
              </p>
              <button
                onClick={() => setAdFormOpen(true)}
                className="inline-block bg-amber-500 text-white font-bold px-5 py-2.5 rounded-full hover:bg-amber-600 transition text-sm"
              >
                Advertise Your Business
              </button>
            </div>
          </div>
        </div>
      </section>

      <AdvertiseFormModal
        open={adFormOpen}
        onClose={() => setAdFormOpen(false)}
        onSubmitted={(ad) => {
          setAdFormOpen(false);
          setPendingAd(ad);
        }}
      />

      {pendingAd && (
        <PaymentInstructions
          itemTitle={`Featured Ad (30 days) - ${pendingAd.business_name}`}
          price={adPrice}
          onClose={() => setPendingAd(null)}
        />
      )}
    </div>
  );
}
