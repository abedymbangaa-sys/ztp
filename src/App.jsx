import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./lib/LanguageContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import SiteReviewPrompt from "./components/SiteReviewPrompt";
// Code-splitting: these pages are visited by a small minority of users
// (business owners, admin) so they should NOT be part of the main bundle
// that every tourist downloads just to browse listings. React.lazy()
// makes Vite generate a separate .js file for each, only fetched when
// the person actually navigates to that route.
const SectionListing = lazy(() => import("./pages/SectionListing"));
const SectionDetail = lazy(() => import("./pages/SectionDetail"));
const AdDetail = lazy(() => import("./pages/AdDetail"));
const PartnerSignup = lazy(() => import("./pages/PartnerSignup"));
const PartnerLogin = lazy(() => import("./pages/PartnerLogin"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const ItineraryDetail = lazy(() => import("./pages/ItineraryDetail"));
const ThingsToDo = lazy(() => import("./pages/ThingsToDo"));
const ForTanzanians = lazy(() => import("./pages/ForTanzanians"));
const About = lazy(() => import("./pages/About"));
const BeforeYouGo = lazy(() => import("./pages/BeforeYouGo"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const DataSource = lazy(() => import("./pages/DataSource"));
const Area = lazy(() => import("./pages/Area"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/partner/signup" element={<PartnerSignup />} />
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/itinerary/:slug" element={<ItineraryDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/before-you-go" element={<BeforeYouGo />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/data-source" element={<DataSource />} />
            <Route path="/things-to-do" element={<ThingsToDo />} />
            <Route path="/kwa-watanzania" element={<ForTanzanians />} />
            <Route path="/ad/:id" element={<AdDetail />} />
            {/* Must come before the generic /:sectionKey and /:sectionKey/:id
                routes below, otherwise "/area/stone-town" would be matched
                as sectionKey="area", id="stone-town" and render the wrong
                page (SectionDetail instead of the area landing page). */}
            <Route path="/area/:areaKey" element={<Area />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:slug" element={<GuideDetail />} />
            <Route path="/:sectionKey" element={<SectionListing />} />
            <Route path="/:sectionKey/:id" element={<SectionDetail />} />
          </Routes>
        </Suspense>
        <Footer />
        <SiteReviewPrompt />
      </LanguageProvider>
    </BrowserRouter>
  );
}
