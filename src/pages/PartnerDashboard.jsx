import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { SinglePhotoUploader, MultiPhotoUploader } from "../components/ImageUploader";
import { TAG_OPTIONS } from "../lib/tags";
import { MessageCircle, Phone, MapPin, HelpCircle, TrendingUp, Star, Copy, Check, MessageSquare, Share2 } from "lucide-react";
import StarRating from "../components/StarRating";
import { buildShareLinks } from "../lib/utm";

const emptyForm = {
  category_key: "hotels",
  title: "",
  location: "",
  description: "",
  image_url: "",
  gallery_images: [],
  whatsapp_number: "",
  maps_link: "",
  tags: [],
  weather_policy: "",
  price_range: "",
  duration: "",
  key_inclusions: "",
  key_exclusions: "",
  area: "",
};

// Same allowlist as src/lib/analytics.js LEAD_EVENT_TYPES - kept as labels
// here since the dashboard needs a friendly name + icon per type, not
// just the raw event_type string.
const LEAD_EVENT_META = {
  click_send_enquiry: { label: "WhatsApp", icon: MessageCircle },
  click_call_owner: { label: "Calls", icon: Phone },
  click_get_directions: { label: "Directions", icon: MapPin },
  click_ask_zanzibar_expert: { label: "Ask Expert", icon: HelpCircle },
};

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [leadEvents, setLeadEvents] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [respondSaving, setRespondSaving] = useState(false);
  const [respondError, setRespondError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewLinkOpenId, setReviewLinkOpenId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [shareLinksOpenId, setShareLinksOpenId] = useState(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      navigate("/partner/login");
      return;
    }

    const { data: partnerData } = await supabase
      .from("partners")
      .select("*")
      .eq("auth_user_id", userData.user.id)
      .single();
    setPartner(partnerData);

    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);
    setCategories(catData || []);

    let listingRows = [];
    if (partnerData) {
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });
      listingRows = listingData || [];
      setListings(listingRows);
    }

    if (listingRows.length > 0) {
      setLeadsLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: leadRows } = await supabase
        .from("lead_events")
        .select("listing_id, event_type")
        .in("listing_id", listingRows.map((l) => l.id))
        .gte("created_at", since);
      setLeadEvents(leadRows || []);
      setLeadsLoading(false);

      setReviewsLoading(true);
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("*")
        .in("listing_id", listingRows.map((l) => l.id))
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setReviews(reviewRows || []);
      setReviewsLoading(false);
    }

    setLoading(false);
  }

  function startRespond(reviewId, existingResponse) {
    setRespondingId(reviewId);
    setResponseText(existingResponse || "");
    setRespondError("");
  }

  async function submitResponse(reviewId) {
    setRespondSaving(true);
    setRespondError("");
    const { error } = await supabase.rpc("submit_owner_response", {
      p_review_id: reviewId,
      p_response: responseText.trim(),
    });
    setRespondSaving(false);
    if (error) {
      setRespondError(error.message);
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, owner_response: responseText.trim(), owner_response_at: new Date().toISOString() } : r
      )
    );
    setRespondingId(null);
    setResponseText("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (editingId) {
      // Editing an existing listing: save the changes directly. No need to
      // reset status to "pending" - price/duration corrections shouldn't
      // send an already-approved listing back through moderation.
      const { error } = await supabase
        .from("listings")
        .update({ ...form, area: form.area || null })
        .eq("id", editingId);
      setSaving(false);
      if (error) {
        setMessage("Error: " + error.message);
        return;
      }
      setMessage("Listing updated.");
      cancelEdit();
      loadData();
      return;
    }

    const { error } = await supabase.from("listings").insert({
      ...form,
      area: form.area || null,
      partner_id: partner.id,
      status: "pending",
    });

    setSaving(false);
    if (error) {
      setMessage("Error: " + error.message);
      return;
    }
    setMessage("Listing submitted - awaiting admin approval.");
    setForm(emptyForm);
    loadData();
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({
      category_key: listing.category_key || "hotels",
      title: listing.title || "",
      location: listing.location || "",
      description: listing.description || "",
      image_url: listing.image_url || "",
      gallery_images: listing.gallery_images || [],
      whatsapp_number: listing.whatsapp_number || "",
      maps_link: listing.maps_link || "",
      tags: listing.tags || [],
      weather_policy: listing.weather_policy || "",
      price_range: listing.price_range || "",
      duration: listing.duration || "",
      key_inclusions: listing.key_inclusions || "",
      key_exclusions: listing.key_exclusions || "",
      area: listing.area || "",
    });
    setMessage("");
    // Scroll the form into view since it's below the listings list.
    document.getElementById("partner-listing-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function toggleTag(key) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(key) ? f.tags.filter((t) => t !== key) : [...f.tags, key],
    }));
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center">Loading...</div>;

  // Per-listing and overall totals for the last 30 days, keyed by the
  // same event_type strings trackEvent() writes to lead_events.
  const leadsByListing = {};
  let totalLeads = 0;
  leadEvents.forEach((ev) => {
    if (!leadsByListing[ev.listing_id]) leadsByListing[ev.listing_id] = {};
    leadsByListing[ev.listing_id][ev.event_type] =
      (leadsByListing[ev.listing_id][ev.event_type] || 0) + 1;
    totalLeads += 1;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {partner?.business_name || "Partner"}
          </h1>
          <p className="text-slate-500 text-sm">
            Account status:{" "}
            <span
              className={
                partner?.status === "approved" ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"
              }
            >
              {partner?.status === "approved" ? "Approved" : "Awaiting Approval"}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
          Log Out
        </button>
      </div>

      {/* Lead Insights - shows the partner real proof their listing is
          working, using the same lead_events data the Admin Leads tab
          reads. Only their own listings' events, enforced by the
          "Partners can read their own lead events" RLS policy. */}
      {listings.length > 0 && (
        <div className="mb-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-lg">Lead Insights (last 30 days)</h2>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            How many travelers reached out through your listings.
          </p>

          {leadsLoading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : totalLeads === 0 ? (
            <p className="text-slate-500 text-sm">
              No enquiries yet in the last 30 days. Add a price range and clear photos - listings
              with both tend to get more WhatsApp messages.
            </p>
          ) : (
            <>
              <p className="text-3xl font-black text-slate-900 mb-4">
                {totalLeads}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  total {totalLeads === 1 ? "enquiry" : "enquiries"}
                </span>
              </p>
              <div className="space-y-3">
                {listings
                  .filter((l) => leadsByListing[l.id])
                  .map((l) => (
                    <div key={l.id} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                      <p className="font-semibold text-slate-800 text-sm mb-1.5">{l.title}</p>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(LEAD_EVENT_META).map(([eventType, meta]) => {
                          const count = leadsByListing[l.id][eventType];
                          if (!count) return null;
                          const Icon = meta.icon;
                          return (
                            <span
                              key={eventType}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full"
                            >
                              <Icon className="w-3.5 h-3.5" /> {count} {meta.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Guest Reviews - lets the partner respond to approved reviews on
          their own listings via submit_owner_response() (a SECURITY
          DEFINER function), which is what actually stops them from being
          able to edit the traveler's rating or text - a plain RLS UPDATE
          grant on reviews couldn't restrict that at the column level. */}
      {listings.length > 0 && (
        <div className="mb-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-lg">Guest Reviews</h2>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            Respond to reviews on your listings. Your reply is public and can't change the
            guest's rating or text.
          </p>

          {reviewsLoading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : reviews.length === 0 ? (
            <p className="text-slate-500 text-sm">No published reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => {
                const listing = listings.find((l) => l.id === r.listing_id);
                return (
                  <div key={r.id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-slate-400">{listing?.title}</p>
                      <StarRating rating={r.rating} />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{r.reviewer_name}</p>
                    {r.comment && <p className="text-slate-600 text-sm mt-1">{r.comment}</p>}

                    {r.owner_response && respondingId !== r.id && (
                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Your response</p>
                        <p className="text-sm text-slate-600">{r.owner_response}</p>
                        <button
                          onClick={() => startRespond(r.id, r.owner_response)}
                          className="text-xs font-semibold text-teal-700 hover:underline mt-2"
                        >
                          Edit response
                        </button>
                      </div>
                    )}

                    {respondingId === r.id ? (
                      <div className="mt-2">
                        <textarea
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Thank the guest or address their feedback..."
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                        {respondError && <p className="text-xs text-red-600 mt-1">{respondError}</p>}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => submitResponse(r.id)}
                            disabled={respondSaving || !responseText.trim()}
                            className="text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-full disabled:opacity-50"
                          >
                            {respondSaving ? "Saving..." : "Post Response"}
                          </button>
                          <button
                            onClick={() => setRespondingId(null)}
                            className="text-xs font-semibold text-slate-500 px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      !r.owner_response && (
                        <button
                          onClick={() => startRespond(r.id, null)}
                          className="text-xs font-semibold text-teal-700 hover:underline mt-2"
                        >
                          Respond
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Existing listings */}
      <div className="mb-10">
        <h2 className="font-bold text-lg mb-4">Your Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="text-slate-500 text-sm">You haven't added any listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => {
              const reviewUrl = `${window.location.origin}/review/${l.id}`;
              return (
                <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{l.title}</p>
                      <p className="text-xs text-slate-500">{l.category_key} · {l.location}</p>
                      {!l.price_range && !l.duration && (
                        <p className="text-xs text-amber-600 font-medium mt-0.5">
                          Add price &amp; duration so travelers can see it →
                        </p>
                      )}
                    </div>
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
                      {l.status === "approved" ? "Approved" : l.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                    <div className="flex gap-2">
                      {l.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => setShareLinksOpenId(shareLinksOpenId === l.id ? null : l.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 border border-teal-300 hover:bg-teal-50 px-3 py-1 rounded-full transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share Links
                        </button>
                      )}
                      {l.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => setReviewLinkOpenId(reviewLinkOpenId === l.id ? null : l.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 border border-amber-300 hover:bg-amber-50 px-3 py-1 rounded-full transition"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Get Reviews
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        className="text-xs font-semibold text-teal-700 border border-teal-600 hover:bg-teal-50 px-3 py-1 rounded-full transition"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {shareLinksOpenId === l.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-700 mb-3">
                        Tumia kiungo sahihi kwa kila mahali unapotangaza - hii inatusaidia kujua ni wapi
                        wageni wengi wanatoka.
                      </p>
                      <div className="space-y-2">
                        {buildShareLinks(`${window.location.origin}/${l.category_key}/${l.id}`, l.id).map(
                          (link) => (
                            <div
                              key={link.label}
                              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <span className="text-xs font-semibold text-slate-700 w-40 shrink-0">
                                {link.label}
                              </span>
                              <span className="text-xs text-slate-500 truncate flex-1">{link.url}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(link.url);
                                  setCopiedShareUrl(link.url);
                                  setTimeout(() => setCopiedShareUrl(null), 2000);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 shrink-0"
                              >
                                {copiedShareUrl === link.url ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {reviewLinkOpenId === l.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(reviewUrl)}`}
                        alt="QR code kwa review link"
                        className="w-28 h-28 rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 mb-2">
                          Mpe mgeni kiungo hiki (au uonyeshe QR code) baada ya ziara yake ili aache review kwa
                          dakika moja tu - hata kupitia WhatsApp.
                        </p>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-slate-600 truncate flex-1">{reviewUrl}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(reviewUrl);
                              setCopiedLinkId(l.id);
                              setTimeout(() => setCopiedLinkId(null), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 shrink-0"
                          >
                            {copiedLinkId === l.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / edit listing */}
      <div id="partner-listing-form" className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4">{editingId ? "Edit Listing" : "Add New Listing"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
            <select
              value={form.category_key}
              onChange={(e) => setForm({ ...form, category_key: e.target.value })}
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
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Nungwi, North Zanzibar"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Area</label>
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white"
            >
              <option value="">Select area</option>
              <option value="stone-town">Stone Town</option>
              <option value="north">North Coast</option>
              <option value="east">East Coast</option>
              <option value="south">South Coast</option>
              <option value="central">Central Zanzibar</option>
              <option value="pemba">Pemba Island</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Price Range <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={form.price_range}
                onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                placeholder="e.g. $40-60 pp"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Duration <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 6 hours"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Travelers strongly prefer listings that show a clear price and duration upfront - it builds trust and gets more WhatsApp messages.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              What's included <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.key_inclusions}
              onChange={(e) => setForm({ ...form, key_inclusions: e.target.value })}
              placeholder="e.g. Breakfast, snorkeling gear, guide"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              What's not included <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.key_exclusions}
              onChange={(e) => setForm({ ...form, key_exclusions: e.target.value })}
              placeholder="e.g. Marine park fee, lunch, tips"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <SinglePhotoUploader
              label="Main Photo"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>
          <div>
            <MultiPhotoUploader
              label="Extra Photos (optional)"
              value={form.gallery_images}
              onChange={(urls) => setForm({ ...form, gallery_images: urls })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Amenities / Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleTag(t.key)}
                  className={
                    "inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition " +
                    (form.tags.includes(t.key)
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
            <input
              required
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="255700000000"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Weather / Cancellation Policy <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.weather_policy}
              onChange={(e) => setForm({ ...form, weather_policy: e.target.value })}
              placeholder="e.g. If it rains, we reschedule for free or refund in full within 24 hours."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5"
            />
            <p className="text-xs text-slate-500 mt-1">
              Especially important for tours, boat trips, and outdoor experiences — travelers ask about this
              before booking. Clear policies build trust.
            </p>
          </div>

          {message && <p className="text-sm text-teal-700 font-medium">{message}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-3 rounded-full disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Submit Listing"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
