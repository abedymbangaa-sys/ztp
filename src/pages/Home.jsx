import { useEffect, useState, Suspense, lazy } from "react";
import { Link, useLocation } from "react-router-dom";
import { useListings, useCategories, useSettings } from "../data/hooks";
import GenericCard from "../components/GenericCard";
import { SectionIcon } from "../lib/icons";
import StatsCounter from "../components/StatsCounter";
import WebsiteReviews from "../components/WebsiteReviews";
import TravelerStories from "../components/TravelerStories";
import DealsSection from "../components/DealsSection";
import SearchAutocomplete from "../components/SearchAutocomplete";
import TripBuilderModal from "../components/TripBuilderModal";
import { AREAS } from "../data/areas";
import { ShieldCheck, MapPin, MessageCircle, BadgeCheck, Compass } from "lucide-react";
import { useT } from "../lib/i18n";
// Leaflet + react-leaflet is a heavy library (~150kB). Lazy-loading it
// means visitors who never scroll down to the map never download it.
const ZanzibarMap = lazy(() => import("../components/ZanzibarMap"));
import AdvertiseSection from "../components/AdvertiseSection";
import AdvertiseFormModal from "../components/AdvertiseFormModal";
import PaymentInstructions from "../components/PaymentInstructions";
import { COLLECTIONS } from "../data/collections";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=85&auto=format&fit=crop";

export default function Home() {
  const location = useLocation();
  const t = useT();
  const { categories } = useCategories();
  const { listings: hotels, loading: hotelsLoading } = useListings("hotels");
  const { listings: allApproved } = useListings();
  const { settings, loading: settingsLoading } = useSettings();
  const adPrice = Number(settings.ad_price_usd) || 15;

  // While settings are still loading, we don't know yet whether the admin
  // has set a custom hero image — so we deliberately show NO image (just
  // the gradient background already on the section) rather than flashing
  // the generic Unsplash default first and then swapping to the real one
  // a few seconds later. Once settings have loaded, we show the admin's
  // image if set, or fall back to the default only then.
  const heroImageUrl = settingsLoading ? null : settings.hero_image_url || DEFAULT_HERO_IMAGE;
  const topHotels = hotels.slice(0, 6);

  // Fixes a real polish issue: on slower connections, a plain <img> paints
  // progressively (visibly blocky/incomplete) while text is already
  // sitting on top of it. Rather than fade the <img> in immediately on
  // mount (which finishes before slow image bytes even arrive), we only
  // reveal it once the browser reports the image fully loaded - until
  // then, visitors see the clean solid gradient behind it with fully
  // readable text, never a half-loaded photo. This is the same pattern
  // TripAdvisor/Booking.com use for hero images.
  const [heroLoaded, setHeroLoaded] = useState(false);

  const [adFormOpen, setAdFormOpen] = useState(false);
  const [pendingAd, setPendingAd] = useState(null); // ad row awaiting payment confirmation
  const [tripBuilderOpen, setTripBuilderOpen] = useState(false);

  // Trust strip shows a real "Verified on [date]" - the most recent
  // last_verified_at across all approved listings - never a fabricated or
  // hardcoded date. If nothing has a verification date yet, the strip
  // simply omits that item rather than showing something untrue.
  const mostRecentVerifiedDate = allApproved.reduce((latest, item) => {
    if (!item.last_verified_at) return latest;
    const d = new Date(item.last_verified_at);
    return !latest || d > latest ? d : latest;
  }, null);
  const verifiedDateLabel = mostRecentVerifiedDate
    ? mostRecentVerifiedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

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
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt="Zanzibar coastline"
            fetchpriority="high"
            onLoad={() => setHeroLoaded(true)}
            className={
              "absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-700 ease-out " +
              (heroLoaded ? "opacity-100" : "opacity-0")
            }
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
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

          <SearchAutocomplete
            listings={allApproved}
            placeholder={t("Search hotels, tours, beaches...")}
            className="max-w-xl mx-auto mb-10"
          />

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button
              onClick={() => setTripBuilderOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 transition text-slate-900 font-bold px-7 py-3.5 rounded-full shadow-lg inline-flex items-center justify-center gap-2"
            >
              <Compass className="w-5 h-5" /> Build My Zanzibar Trip
            </button>
            <Link
              to="/things-to-do"
              className="bg-white text-teal-900 font-bold px-7 py-3.5 rounded-full hover:bg-amber-50 transition shadow-lg"
            >
              {t("Explore Experiences")}
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

          {/* Trust strip - every claim here is either a fixed, true fact
              (local team, direct contact, no fees) or computed live from
              the database (verified date), never a static "trust us"
              placeholder. Wraps to 2 lines on small screens instead of
              overflowing. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-200/90">
            {verifiedDateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-amber-300" /> Verified on {verifiedDateLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-300" /> Local team
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-amber-300" /> Direct contact
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" /> Free for travelers, always
            </span>
          </div>
        </div>
      </section>

      <TripBuilderModal open={tripBuilderOpen} onClose={() => setTripBuilderOpen(false)} />

      {/* Explore by area - internal links for visitors comparing where to
          stay, and a crawl path search engines can follow to each area's
          indexable landing page. */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Explore Zanzibar by Area</h2>
          <p className="text-slate-500 mt-1">Not sure where to stay? Start with a region.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {AREAS.map((a) => (
            <Link
              key={a.key}
              to={`/area/${a.key}`}
              className="relative rounded-2xl overflow-hidden h-32 sm:h-40 group"
            >
              <img
                src={a.heroImage}
                alt={a.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-bold">{a.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <StatsCounter />

      <WebsiteReviews />

      <TravelerStories />

      <DealsSection />

      {/* Local collections teaser - report section 5 asks the homepage to
          surface curated lists, not just raw categories. Shows the first
          3; the full set lives at /collections. */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Curated by us</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Zanzibar Collections</h2>
          </div>
          <Link to="/collections" className="text-teal-700 font-semibold hover:underline hidden md:block">
            View All →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COLLECTIONS.slice(0, 3).map((c) => (
            <Link
              key={c.key}
              to={`/collections/${c.key}`}
              className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-teal-300 transition"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-1">{c.title}</h3>
              <p className="text-teal-700 text-sm font-semibold mb-3">{c.tagline}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

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
          {hotelsLoading && topHotels.length === 0
            ? // Skeleton cards while the first load is in flight, so this
              // section never sits empty/blank before data arrives.
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full h-44 bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            : topHotels.map((h) => <GenericCard key={h.id} item={h} sectionKey="hotels" />)}
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
