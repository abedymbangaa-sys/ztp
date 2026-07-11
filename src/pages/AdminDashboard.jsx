import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { SectionIcon } from "../lib/icons";
import { sendNotificationEmail } from "../lib/email";
import { SinglePhotoUploader, MultiPhotoUploader } from "../components/ImageUploader";
import { TAG_OPTIONS } from "../lib/tags";

const TABS = [
  { key: "listings", label: "Listings" },
  { key: "claims", label: "Claims" },
  { key: "advertisements", label: "Advertisements" },
  { key: "inquiries", label: "Inquiries" },
  { key: "partners", label: "Partners" },
  { key: "reviews", label: "Reviews" },
  { key: "categories", label: "Categories" },
  { key: "blog", label: "Blog" },
  { key: "itinerary", label: "Itinerary" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("listings");
  const [isAdmin, setIsAdmin] = useState(null);
  const [listings, setListings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [claims, setClaims] = useState([]);
  const [ads, setAds] = useState([]);
  const [adPriceInput, setAdPriceInput] = useState("");
  const [adPriceSaving, setAdPriceSaving] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", excerpt: "", content: "", cover_image: "", language: "en" });
  const [postMessage, setPostMessage] = useState("");
  const [guides, setGuides] = useState([]);
  const [newGuide, setNewGuide] = useState({
    title: "",
    description: "",
    days_summary: "",
    price_usd: "",
    cover_image: "",
    pdf_url: "",
  });
  const [guideMessage, setGuideMessage] = useState("");
  const [newCat, setNewCat] = useState({ key: "", title: "", tag: "" });
  const emptyNewListing = {
    category_key: "hotels",
    title: "",
    location: "",
    description: "",
    image_url: "",
    gallery_images: [],
    whatsapp_number: "",
    maps_link: "",
    tags: [],
  };
  const [newListing, setNewListing] = useState(emptyNewListing);
  const [newListingSaving, setNewListingSaving] = useState(false);
  const [newListingMessage, setNewListingMessage] = useState("");
  const emptyNewAd = {
    business_name: "",
    category: "",
    description: "",
    image_url: "",
    gallery_images: [],
    whatsapp_number: "",
    maps_link: "",
  };
  const [newAd, setNewAd] = useState(emptyNewAd);
  const [newAdSaving, setNewAdSaving] = useState(false);
  const [newAdMessage, setNewAdMessage] = useState("");
  const [message, setMessage] = useState("");
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [adEditForm, setAdEditForm] = useState(null);
  const [adEditMessage, setAdEditMessage] = useState("");
  const [adEditSaving, setAdEditSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      navigate("/admin/login");
      return;
    }
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("*")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!adminRow) {
      navigate("/admin/login");
      return;
    }
    setIsAdmin(true);
    loadAll();
  }

  async function loadAll() {
    const { data: listingData } = await supabase
      .from("listings")
      .select("*, partners(business_name, email)")
      .order("created_at", { ascending: false });
    setListings(listingData || []);

    const { data: partnerData } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    setPartners(partnerData || []);

    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    setCategories(catData || []);

    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*, listings(title)")
      .order("created_at", { ascending: false });
    setReviews(reviewData || []);

    const { data: inquiryData } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setInquiries(inquiryData || []);

    const { data: claimData } = await supabase
      .from("listing_claims")
      .select("*")
      .order("created_at", { ascending: false });
    setClaims(claimData || []);

    const { data: adData } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });
    setAds(adData || []);

    const { data: settingsData } = await supabase.from("settings").select("*").eq("key", "ad_price_usd").single();
    setAdPriceInput(settingsData?.value || "15");

    const { data: postData } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setBlogPosts(postData || []);

    const { data: guideData } = await supabase
      .from("itinerary_guides")
      .select("*")
      .order("created_at", { ascending: false });
    setGuides(guideData || []);
  }

  async function updateListingStatus(id, status) {
    await supabase.from("listings").update({ status }).eq("id", id);
    const listing = listings.find((l) => l.id === id);
    if (listing?.partners?.email) {
      const isApproved = status === "approved";
      await sendNotificationEmail({
        toEmail: listing.partners.email,
        toName: listing.partners.business_name,
        subject: isApproved ? "Your Listing Has Been Approved!" : "About Your Listing",
        message: isApproved
          ? `Hello, your listing "${listing.title}" has been approved and is now live on Zanzibar Paradise Tours.`
          : `Hello, your listing "${listing.title}" has not been approved at this time. Contact us for more details.`,
      });
    }
    loadAll();
  }

  async function toggleVerified(id, currentValue) {
    await supabase.from("listings").update({ is_verified: !currentValue }).eq("id", id);
    loadAll();
  }

  async function deleteListing(id, title) {
    if (!confirm(`Delete listing "${title}" permanently? This cannot be undone.`)) return;
    await supabase.from("listings").delete().eq("id", id);
    loadAll();
  }

  async function updateClaimStatus(id, status) {
    await supabase
      .from("listing_claims")
      .update({ status, resolved_at: status === "resolved" || status === "rejected" ? new Date().toISOString() : null })
      .eq("id", id);
    loadAll();
  }

  function openEditListing(l) {
    setEditingListing(l);
    setEditForm({
      title: l.title || "",
      location: l.location || "",
      description: l.description || "",
      image_url: l.image_url || "",
      gallery_images: l.gallery_images || [],
      whatsapp_number: l.whatsapp_number || "",
      maps_link: l.maps_link || "",
      tags: l.tags || [],
      weather_policy: l.weather_policy || "",
    });
    setEditMessage("");
  }

  function closeEditListing() {
    setEditingListing(null);
    setEditForm(null);
    setEditMessage("");
  }

  async function saveEditListing(e) {
    e.preventDefault();
    if (!editingListing) return;
    setEditSaving(true);
    setEditMessage("");
    const payload = { ...editForm, gallery_images: (editForm.gallery_images || []).slice(0, 10) };
    const { error } = await supabase.from("listings").update(payload).eq("id", editingListing.id);
    setEditSaving(false);
    if (error) {
      setEditMessage("Error: " + error.message);
      return;
    }
    closeEditListing();
    loadAll();
  }

  async function saveAdPrice() {
    setAdPriceSaving(true);
    await supabase.from("settings").upsert({ key: "ad_price_usd", value: adPriceInput });
    setAdPriceSaving(false);
  }

  async function updateAdStatus(id, status) {
    await supabase.from("advertisements").update({ status }).eq("id", id);
    loadAll();
  }

  // Activates (or renews) a paid ad for 30 days from today. Use this once
  // you've confirmed the mobile money payment came through.
  async function activateAd(id) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("advertisements")
      .update({ status: "approved", active_until: thirtyDaysFromNow })
      .eq("id", id);
    loadAll();
  }

  // Admin-added listing: goes straight into the directory as "approved" -
  // no partner account or approval step needed, since the admin is the one
  // adding it (e.g. after onboarding a hotel manually via Instagram/email).
  async function handleAddListing(e) {
    e.preventDefault();
    setNewListingSaving(true);
    setNewListingMessage("");
    const { error } = await supabase.from("listings").insert({
      ...newListing,
      partner_id: null,
      status: "approved",
    });
    setNewListingSaving(false);
    if (error) {
      setNewListingMessage("Error: " + error.message);
      return;
    }
    setNewListingMessage("Listing published!");
    setNewListing(emptyNewListing);
    loadAll();
  }

  function toggleNewListingTag(key) {
    setNewListing((f) => ({
      ...f,
      tags: f.tags.includes(key) ? f.tags.filter((t) => t !== key) : [...f.tags, key],
    }));
  }

  // Admin-added advertisement: published live immediately for 30 days,
  // skipping the pending/payment-confirmation step used for self-submitted ads.
  async function handleAddAd(e) {
    e.preventDefault();
    setNewAdSaving(true);
    setNewAdMessage("");
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("advertisements").insert({
      ...newAd,
      status: "approved",
      active_until: thirtyDaysFromNow,
    });
    setNewAdSaving(false);
    if (error) {
      setNewAdMessage("Error: " + error.message);
      return;
    }
    setNewAdMessage("Advertisement published!");
    setNewAd(emptyNewAd);
    loadAll();
  }

  function openEditAd(ad) {
    setEditingAd(ad);
    setAdEditForm({
      business_name: ad.business_name || "",
      category: ad.category || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      gallery_images: ad.gallery_images || [],
      whatsapp_number: ad.whatsapp_number || "",
      maps_link: ad.maps_link || "",
    });
    setAdEditMessage("");
  }

  function closeEditAd() {
    setEditingAd(null);
    setAdEditForm(null);
    setAdEditMessage("");
  }

  async function saveEditAd(e) {
    e.preventDefault();
    if (!editingAd) return;
    setAdEditSaving(true);
    setAdEditMessage("");
    const payload = { ...adEditForm, gallery_images: (adEditForm.gallery_images || []).slice(0, 10) };
    const { error } = await supabase.from("advertisements").update(payload).eq("id", editingAd.id);
    setAdEditSaving(false);
    if (error) {
      setAdEditMessage("Error: " + error.message);
      return;
    }
    closeEditAd();
    loadAll();
  }

  async function deleteAd(id, businessName) {
    if (!confirm(`Delete advertisement "${businessName}" permanently? This cannot be undone.`)) return;
    await supabase.from("advertisements").delete().eq("id", id);
    loadAll();
  }

  async function updatePartnerStatus(id, status) {
    await supabase.from("partners").update({ status }).eq("id", id);
    const partner = partners.find((p) => p.id === id);
    if (partner?.email && status === "approved") {
      await sendNotificationEmail({
        toEmail: partner.email,
        toName: partner.business_name,
        subject: "Welcome to Zanzibar Paradise Tours!",
        message: `Hello ${partner.contact_name || ""}, your business account "${partner.business_name}" has been approved. You can now add your listings through your dashboard.`,
      });
    }
    loadAll();
  }

  async function updateReviewStatus(id, status) {
    await supabase.from("reviews").update({ status }).eq("id", id);
    loadAll();
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function addBlogPost(e) {
    e.preventDefault();
    setPostMessage("");
    if (!newPost.title || !newPost.content) return;
    const payload = {
      slug: slugify(newPost.title),
      title: newPost.title,
      excerpt: newPost.excerpt,
      content: newPost.content,
      cover_image: newPost.cover_image,
      language: newPost.language,
      status: "draft",
    };
    let { error } = await supabase.from("blog_posts").insert(payload);
    if (error && /language/i.test(error.message)) {
      // The `language` column hasn't been added to Supabase yet (migration
      // not run). Fall back to inserting without it so post creation still
      // works — it will just default to English until the migration runs.
      const { language, ...withoutLanguage } = payload;
      const retry = await supabase.from("blog_posts").insert(withoutLanguage);
      error = retry.error;
      if (!error) {
        setPostMessage(
          "Post added as Draft (saved as English — run migration_blog_language.sql in Supabase to enable Swahili posts)."
        );
        setNewPost({ title: "", excerpt: "", content: "", cover_image: "", language: "en" });
        loadAll();
        return;
      }
    }
    if (error) {
      setPostMessage("Error: " + error.message);
      return;
    }
    setPostMessage("Post added as Draft - click 'Publish' to make it public.");
    setNewPost({ title: "", excerpt: "", content: "", cover_image: "", language: "en" });
    loadAll();
  }

  async function togglePostStatus(id, current) {
    const next = current === "published" ? "draft" : "published";
    await supabase.from("blog_posts").update({ status: next }).eq("id", id);
    loadAll();
  }

  async function deletePost(id) {
    await supabase.from("blog_posts").delete().eq("id", id);
    loadAll();
  }

  async function addGuide(e) {
    e.preventDefault();
    setGuideMessage("");
    if (!newGuide.title || !newGuide.price_usd) return;
    const { error } = await supabase.from("itinerary_guides").insert({
      ...newGuide,
      price_usd: parseFloat(newGuide.price_usd),
      status: "draft",
    });
    if (error) {
      setGuideMessage("Error: " + error.message);
      return;
    }
    setGuideMessage("Guide added as Draft - click 'Publish' when ready.");
    setNewGuide({ title: "", description: "", days_summary: "", price_usd: "", cover_image: "", pdf_url: "" });
    loadAll();
  }

  async function toggleGuideStatus(id, current) {
    const next = current === "published" ? "draft" : "published";
    await supabase.from("itinerary_guides").update({ status: next }).eq("id", id);
    loadAll();
  }

  async function deleteGuide(id) {
    await supabase.from("itinerary_guides").delete().eq("id", id);
    loadAll();
  }

  async function addCategory(e) {
    e.preventDefault();
    setMessage("");
    if (!newCat.key || !newCat.title) return;
    const { error } = await supabase.from("categories").insert({
      key: newCat.key.toLowerCase().replace(/\s+/g, "-"),
      title: newCat.title,
      tag: newCat.tag,
      emoji: "📍",
      is_active: true,
    });
    if (error) {
      setMessage("Error: " + error.message);
      return;
    }
    setMessage(`Category "${newCat.title}" added!`);
    setNewCat({ key: "", title: "", tag: "" });
    loadAll();
  }

  async function toggleCategoryActive(id, current) {
    await supabase.from("categories").update({ is_active: !current }).eq("id", id);
    loadAll();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (isAdmin === null) return <div className="max-w-4xl mx-auto px-4 py-24 text-center">Loading...</div>;

  const pendingListings = listings.filter((l) => l.status === "pending");
  const pendingPartners = partners.filter((p) => p.status === "pending");
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const pendingAds = ads.filter((a) => a.status === "pending");
  const pendingClaims = claims.filter((c) => c.status === "pending" || c.status === "in_progress");
  const urgentRemovalClaims = claims.filter(
    (c) => c.request_type === "removal_request" && c.status === "pending"
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">
            {pendingListings.length} listings, {pendingPartners.length} partners and {pendingAds.length} ads
            are awaiting approval
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
          Log Out
        </button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "px-4 py-2.5 font-semibold text-sm border-b-2 transition whitespace-nowrap shrink-0 " +
              (tab === t.key ? "border-teal-700 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800")
            }
          >
            {t.label}
            {t.key === "listings" && pendingListings.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingListings.length}
              </span>
            )}
            {t.key === "advertisements" && pendingAds.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingAds.length}
              </span>
            )}
            {t.key === "claims" && pendingClaims.length > 0 && (
              <span
                className={
                  "ml-2 text-white text-xs px-2 py-0.5 rounded-full " +
                  (urgentRemovalClaims.length > 0 ? "bg-red-600 animate-pulse" : "bg-amber-500")
                }
                title={
                  urgentRemovalClaims.length > 0
                    ? `${urgentRemovalClaims.length} removal request(s) waiting — 48hr commitment`
                    : undefined
                }
              >
                {pendingClaims.length}
              </span>
            )}
            {t.key === "partners" && pendingPartners.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingPartners.length}
              </span>
            )}
            {t.key === "reviews" && pendingReviews.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingReviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="space-y-3">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-2">
            <h2 className="font-bold text-lg mb-4 text-slate-900">Add New Listing (published instantly)</h2>
            {newListingMessage && (
              <p className={"text-sm mb-3 " + (newListingMessage.startsWith("Error") ? "text-red-600" : "text-teal-700")}>
                {newListingMessage}
              </p>
            )}
            <form onSubmit={handleAddListing} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newListing.category_key}
                    onChange={(e) => setNewListing({ ...newListing, category_key: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.emoji} {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Listing Name</label>
                  <input
                    required
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                <input
                  required
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  placeholder="e.g. Nungwi, North Zanzibar"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <SinglePhotoUploader
                label="Main Photo"
                value={newListing.image_url}
                onChange={(url) => setNewListing({ ...newListing, image_url: url })}
              />
              <MultiPhotoUploader
                label="Extra Photos (optional)"
                value={newListing.gallery_images}
                onChange={(urls) => setNewListing({ ...newListing, gallery_images: urls })}
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amenities / Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => toggleNewListingTag(tag.key)}
                      className={
                        "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
                        (newListing.tags.includes(tag.key)
                          ? "bg-teal-700 border-teal-700 text-white"
                          : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
                      }
                    >
                      <tag.icon className="w-3.5 h-3.5" strokeWidth={2} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    required
                    value={newListing.whatsapp_number}
                    onChange={(e) => setNewListing({ ...newListing, whatsapp_number: e.target.value })}
                    placeholder="255700000000"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (optional)</label>
                  <input
                    value={newListing.maps_link}
                    onChange={(e) => setNewListing({ ...newListing, maps_link: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={newListingSaving}
                className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
              >
                {newListingSaving ? "Publishing..." : "Publish Listing"}
              </button>
            </form>
          </div>

          {listings.length === 0 && <p className="text-slate-500">No listings yet.</p>}
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SectionIcon sectionKey={l.category_key} className="w-5 h-5 text-teal-700 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-500">
                    {l.location} · Owner: {l.partners?.business_name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full " +
                    (l.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : l.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {l.status}
                </span>
                <button
                  onClick={() => toggleVerified(l.id, l.is_verified)}
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full border " +
                    (l.is_verified
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-500 border-slate-300 hover:border-teal-400")
                  }
                  title={l.is_verified ? "Click to remove Verified badge" : "Click to mark as Verified"}
                >
                  {l.is_verified ? "✓ Verified" : "Mark Verified"}
                </button>
                <button
                  onClick={() => openEditListing(l)}
                  className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200"
                >
                  Edit
                </button>
                {l.status !== "approved" && (
                  <button
                    onClick={() => updateListingStatus(l.id, "approved")}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    Approve
                  </button>
                )}
                {l.status !== "rejected" && (
                  <button
                    onClick={() => updateListingStatus(l.id, "rejected")}
                    className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-300"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => deleteListing(l.id, l.title)}
                  className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingListing && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEditListing}>
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Edit Listing</h2>
              <button onClick={closeEditListing} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
                &times;
              </button>
            </div>
            <form onSubmit={saveEditListing} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Listing Name</label>
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <SinglePhotoUploader
                  label="Main Photo"
                  value={editForm.image_url}
                  onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                />
              </div>
              <div>
                <MultiPhotoUploader
                  label="Extra Photos / Gallery (up to 10)"
                  value={editForm.gallery_images}
                  onChange={(urls) => setEditForm({ ...editForm, gallery_images: urls.slice(0, 10) })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  These show up as a swipeable gallery on the listing's detail page, just like the main photo.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                  placeholder="255700000000"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (optional)</label>
                <input
                  value={editForm.maps_link}
                  onChange={(e) => setEditForm({ ...editForm, maps_link: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Weather / Cancellation Policy <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.weather_policy || ""}
                  onChange={(e) => setEditForm({ ...editForm, weather_policy: e.target.value })}
                  placeholder="e.g. If it rains, we reschedule for free or refund in full within 24 hours."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amenities / Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() =>
                        setEditForm({
                          ...editForm,
                          tags: (editForm.tags || []).includes(t.key)
                            ? editForm.tags.filter((k) => k !== t.key)
                            : [...(editForm.tags || []), t.key],
                        })
                      }
                      className={
                        "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
                        ((editForm.tags || []).includes(t.key)
                          ? "bg-teal-700 border-teal-700 text-white"
                          : "bg-white border-slate-300 text-slate-600 hover:border-teal-600")
                      }
                    >
                      <t.icon className="w-3.5 h-3.5" strokeWidth={2} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {editMessage && <p className="text-sm text-red-600 font-medium">{editMessage}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEditListing}
                  className="bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-semibold px-6 py-2.5 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === "advertisements" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-2">
            <h2 className="font-bold text-lg mb-4 text-slate-900">Add New Advertisement (live instantly, 30 days)</h2>
            {newAdMessage && (
              <p className={"text-sm mb-3 " + (newAdMessage.startsWith("Error") ? "text-red-600" : "text-amber-700")}>
                {newAdMessage}
              </p>
            )}
            <form onSubmit={handleAddAd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
                  <input
                    required
                    value={newAd.business_name}
                    onChange={(e) => setNewAd({ ...newAd, business_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    required
                    value={newAd.category}
                    onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                    placeholder="e.g. Restaurant, Hotel, Tour"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <SinglePhotoUploader
                label="Main Photo"
                value={newAd.image_url}
                onChange={(url) => setNewAd({ ...newAd, image_url: url })}
              />
              <MultiPhotoUploader
                label="Extra Photos (optional)"
                value={newAd.gallery_images}
                onChange={(urls) => setNewAd({ ...newAd, gallery_images: urls })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    required
                    value={newAd.whatsapp_number}
                    onChange={(e) => setNewAd({ ...newAd, whatsapp_number: e.target.value })}
                    placeholder="255700000000"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (optional)</label>
                  <input
                    value={newAd.maps_link}
                    onChange={(e) => setNewAd({ ...newAd, maps_link: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={newAdSaving}
                className="bg-amber-600 hover:bg-amber-700 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50"
              >
                {newAdSaving ? "Publishing..." : "Publish Advertisement"}
              </button>
            </form>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Advertising Price ($/month)
              </label>
              <input
                type="number"
                min="0"
                value={adPriceInput}
                onChange={(e) => setAdPriceInput(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2 w-32"
              />
            </div>
            <button
              onClick={saveAdPrice}
              disabled={adPriceSaving}
              className="bg-amber-600 hover:bg-amber-700 transition text-white font-semibold px-5 py-2 rounded-full disabled:opacity-50 text-sm"
            >
              {adPriceSaving ? "Saving..." : "Save Price"}
            </button>
            <p className="text-xs text-slate-500 w-full">
              This is what shows on the homepage and payment screen — no code changes or redeploy needed.
            </p>
          </div>

          <p className="text-sm text-slate-500 mb-2">
            Paid ads only — these never affect the free directory listings. Approve an ad once you've
            confirmed their mobile money payment on WhatsApp.
          </p>
          {ads.length === 0 && <p className="text-slate-500">No advertisement submissions yet.</p>}
          {ads.map((ad) => {
            const isActive = ad.status === "approved" && (!ad.active_until || new Date(ad.active_until) > new Date());
            return (
              <div key={ad.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {ad.image_url && (
                      <img src={ad.image_url} alt={ad.business_name} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{ad.business_name}</p>
                      <p className="text-xs text-slate-500">{ad.category}</p>
                      <p className="text-xs text-slate-500 mt-0.5">WhatsApp: {ad.whatsapp_number}</p>
                      {isActive && ad.active_until && (
                        <p className="text-xs text-amber-600 font-semibold mt-1">
                          ★ Live until {new Date(ad.active_until).toLocaleDateString()}
                        </p>
                      )}
                      {ad.status === "pending" && (
                        <p className="text-xs text-amber-700 font-semibold mt-1">Awaiting payment confirmation</p>
                      )}
                      {ad.status === "rejected" && (
                        <p className="text-xs text-red-600 font-semibold mt-1">Rejected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={() => activateAd(ad.id)}
                      className="text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-full hover:bg-amber-600"
                    >
                      {isActive ? "Renew 30 days" : "Activate 30 days"}
                    </button>
                    {ad.status !== "rejected" && (
                      <button
                        onClick={() => updateAdStatus(ad.id, "rejected")}
                        className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => openEditAd(ad)}
                      className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id, ad.business_name)}
                      className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3">{ad.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {editingAd && adEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEditAd}>
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Edit Advertisement</h2>
              <button onClick={closeEditAd} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
                &times;
              </button>
            </div>
            <form onSubmit={saveEditAd} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Business / Destination Name</label>
                <input
                  required
                  value={adEditForm.business_name}
                  onChange={(e) => setAdEditForm({ ...adEditForm, business_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <input
                  value={adEditForm.category}
                  onChange={(e) => setAdEditForm({ ...adEditForm, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={adEditForm.description}
                  onChange={(e) => setAdEditForm({ ...adEditForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <SinglePhotoUploader
                  label="Main Photo"
                  value={adEditForm.image_url}
                  onChange={(url) => setAdEditForm({ ...adEditForm, image_url: url })}
                />
              </div>
              <div>
                <MultiPhotoUploader
                  label="Extra Photos / Gallery (up to 10)"
                  value={adEditForm.gallery_images}
                  onChange={(urls) => setAdEditForm({ ...adEditForm, gallery_images: urls.slice(0, 10) })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  value={adEditForm.whatsapp_number}
                  onChange={(e) => setAdEditForm({ ...adEditForm, whatsapp_number: e.target.value })}
                  placeholder="255700000000"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Google Maps Link (optional)</label>
                <input
                  value={adEditForm.maps_link}
                  onChange={(e) => setAdEditForm({ ...adEditForm, maps_link: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
                />
              </div>

              {adEditMessage && <p className="text-sm text-red-600">{adEditMessage}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={adEditSaving}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
                >
                  {adEditSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEditAd}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="space-y-3">
          {inquiries.length === 0 && <p className="text-slate-500">No inquiries yet.</p>}
          {inquiries.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{q.hotel_name}</p>
                  <p className="text-xs text-slate-500">{q.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  {q.used_fallback_number && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      No business number - went to you
                    </span>
                  )}
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="font-medium text-slate-800">{q.traveler_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Travelers</p>
                  <p className="font-medium text-slate-800">{q.travelers_count || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Budget</p>
                  <p className="font-medium text-slate-800">{q.budget || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Dates</p>
                  <p className="font-medium text-slate-800">{q.travel_dates || "—"}</p>
                </div>
              </div>
              {q.notes && (
                <p className="text-sm text-slate-600 mt-2 italic">"{q.notes}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "claims" && (
        <div className="space-y-3">
          {urgentRemovalClaims.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-semibold">
              ⚠️ {urgentRemovalClaims.length} removal request{urgentRemovalClaims.length > 1 ? "s" : ""} waiting —
              you've committed to acting within 48 hours. Handle these first.
            </div>
          )}
          {claims.length === 0 && <p className="text-slate-500">No claim/edit/removal requests yet.</p>}
          {[...claims]
            .sort((a, b) => {
              const urgentA = a.request_type === "removal_request" && a.status === "pending" ? 0 : 1;
              const urgentB = b.request_type === "removal_request" && b.status === "pending" ? 0 : 1;
              return urgentA - urgentB;
            })
            .map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.listing_title || "(listing deleted)"}</p>
                  <p className="text-xs text-slate-500">
                    {c.request_type === "claim"
                      ? "Claim ownership"
                      : c.request_type === "edit_request"
                      ? "Edit request"
                      : "Removal request"}
                    {" · "}
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap " +
                    (c.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : c.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : c.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-2">
                <div>
                  <p className="text-xs text-slate-400">Business</p>
                  <p className="font-medium text-slate-800">{c.business_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contact</p>
                  <p className="font-medium text-slate-800">{c.contact_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-800">{c.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-800">{c.email || "—"}</p>
                </div>
              </div>
              {c.message && <p className="text-sm text-slate-600 italic mb-3">"{c.message}"</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {c.status !== "in_progress" && (
                  <button
                    onClick={() => updateClaimStatus(c.id, "in_progress")}
                    className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700"
                  >
                    Mark In Progress
                  </button>
                )}
                {c.status !== "resolved" && (
                  <button
                    onClick={() => updateClaimStatus(c.id, "resolved")}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    Mark Resolved
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button
                    onClick={() => updateClaimStatus(c.id, "rejected")}
                    className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-300"
                  >
                    Dismiss
                  </button>
                )}
                {c.request_type === "removal_request" && c.listing_id && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove listing "${c.listing_title}" from the site entirely?`)) return;
                      await supabase.from("listings").delete().eq("id", c.listing_id);
                      await updateClaimStatus(c.id, "resolved");
                    }}
                    className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 ml-auto"
                  >
                    Delete Listing Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "partners" && (
        <div className="space-y-3">
          {partners.length === 0 && <p className="text-slate-500">No partners yet.</p>}
          {partners.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{p.business_name}</p>
                <p className="text-xs text-slate-500">{p.contact_name} · {p.phone} · {p.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full " +
                    (p.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : p.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {p.status}
                </span>
                {p.status !== "approved" && (
                  <button
                    onClick={() => updatePartnerStatus(p.id, "approved")}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    Approve
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button
                    onClick={() => updatePartnerStatus(p.id, "rejected")}
                    className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-300"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-slate-500">No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900">{r.reviewer_name}</p>
                  <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Regarding: {r.listings?.title || "—"}</p>
                {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full " +
                    (r.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : r.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {r.status}
                </span>
                {r.status !== "approved" && (
                  <button
                    onClick={() => updateReviewStatus(r.id, "approved")}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => updateReviewStatus(r.id, "rejected")}
                    className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-300"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "blog" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Andika Makala Mpya</h2>
            <form onSubmit={addBlogPost} className="space-y-3">
              <input
                placeholder="Kichwa cha Makala"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Lugha ya makala:</span>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={newPost.language === "en"}
                    onChange={() => setNewPost({ ...newPost, language: "en" })}
                  />
                  Kiingereza (watalii wa kimataifa)
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    checked={newPost.language === "sw"}
                    onChange={() => setNewPost({ ...newPost, language: "sw" })}
                  />
                  Kiswahili (kwa Watanzania)
                </label>
              </div>
              <input
                placeholder="Muhtasari mfupi (excerpt)"
                value={newPost.excerpt}
                onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Cover Photo Link (optional)"
                value={newPost.cover_image}
                onChange={(e) => setNewPost({ ...newPost, cover_image: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <textarea
                placeholder="Full post content"
                rows={6}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full"
              >
                Save as Draft
              </button>
            </form>
            {postMessage && <p className="text-sm text-teal-700 font-medium mt-3">{postMessage}</p>}
          </div>

          <div className="space-y-2">
            {blogPosts.length === 0 && <p className="text-slate-500">No posts yet.</p>}
            {blogPosts.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <span
                      className={
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase " +
                        (p.language === "sw" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")
                      }
                    >
                      {p.language === "sw" ? "SW" : "EN"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">/blog/{p.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span
                    className={
                      "text-xs font-semibold px-3 py-1 rounded-full " +
                      (p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600")
                    }
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                  <button
                    onClick={() => togglePostStatus(p.id, p.status)}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    {p.status === "published" ? "Hide" : "Publish"}
                  </button>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200"
                  >
                    Futa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "itinerary" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Add Itinerary Guide</h2>
            <form onSubmit={addGuide} className="space-y-3">
              <input
                placeholder="Guide Name (e.g. 5 Days Zanzibar)"
                value={newGuide.title}
                onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Days/Nights (e.g. 5 Days / 4 Nights)"
                value={newGuide.days_summary}
                onChange={(e) => setNewGuide({ ...newGuide, days_summary: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <textarea
                placeholder="Short description"
                rows={3}
                value={newGuide.description}
                onChange={(e) => setNewGuide({ ...newGuide, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price in Dollars ($)"
                value={newGuide.price_usd}
                onChange={(e) => setNewGuide({ ...newGuide, price_usd: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Cover Photo Link (optional)"
                value={newGuide.cover_image}
                onChange={(e) => setNewGuide({ ...newGuide, cover_image: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Full PDF Link (Google Drive, etc.)"
                value={newGuide.pdf_url}
                onChange={(e) => setNewGuide({ ...newGuide, pdf_url: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full"
              >
                Save as Draft
              </button>
            </form>
            {guideMessage && <p className="text-sm text-teal-700 font-medium mt-3">{guideMessage}</p>}
          </div>

          <div className="space-y-2">
            {guides.length === 0 && <p className="text-slate-500">No guides yet.</p>}
            {guides.map((g) => (
              <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-slate-900">{g.title} - ${g.price_usd}</p>
                  <p className="text-xs text-slate-500">{g.days_summary}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span
                    className={
                      "text-xs font-semibold px-3 py-1 rounded-full " +
                      (g.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600")
                    }
                  >
                    {g.status === "published" ? "Published" : "Draft"}
                  </span>
                  <button
                    onClick={() => toggleGuideStatus(g.id, g.status)}
                    className="text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
                  >
                    {g.status === "published" ? "Hide" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteGuide(g.id)}
                    className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200"
                  >
                    Futa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Add New Category</h2>
            <form onSubmit={addCategory} className="grid sm:grid-cols-3 gap-3">
              <input
                placeholder="key (e.g. sports)"
                value={newCat.key}
                onChange={(e) => setNewCat({ ...newCat, key: e.target.value })}
                className="border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Name (e.g. Sports)"
                value={newCat.title}
                onChange={(e) => setNewCat({ ...newCat, title: e.target.value })}
                className="border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <input
                placeholder="Tag (e.g. Sports & Fun)"
                value={newCat.tag}
                onChange={(e) => setNewCat({ ...newCat, tag: e.target.value })}
                className="border border-slate-300 rounded-lg px-4 py-2.5"
              />
              <button
                type="submit"
                className="sm:col-span-3 bg-teal-700 hover:bg-teal-800 transition text-white font-bold py-2.5 rounded-full"
              >
                Add Category
              </button>
            </form>
            {message && <p className="text-sm text-teal-700 font-medium mt-3">{message}</p>}
          </div>

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">key: {c.key}</p>
                </div>
                <button
                  onClick={() => toggleCategoryActive(c.id, c.is_active)}
                  className={
                    "text-xs font-semibold px-3 py-1.5 rounded-full " +
                    (c.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600")
                  }
                >
                  {c.is_active ? "Active" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
