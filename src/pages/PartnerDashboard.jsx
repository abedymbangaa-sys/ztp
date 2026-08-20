import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { SinglePhotoUploader, MultiPhotoUploader } from "../components/ImageUploader";
import { TAG_OPTIONS } from "../lib/tags";

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
};

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    if (partnerData) {
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });
      setListings(listingData || []);
    }

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (editingId) {
      // Editing an existing listing: save the changes directly. No need to
      // reset status to "pending" - price/duration corrections shouldn't
      // send an already-approved listing back through moderation.
      const { error } = await supabase.from("listings").update(form).eq("id", editingId);
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

      {/* Existing listings */}
      <div className="mb-10">
        <h2 className="font-bold text-lg mb-4">Your Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="text-slate-500 text-sm">You haven't added any listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-4">
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
                <button
                  type="button"
                  onClick={() => startEdit(l)}
                  className="text-xs font-semibold text-teal-700 border border-teal-600 hover:bg-teal-50 px-3 py-1 rounded-full transition"
                >
                  Edit
                </button>
              </div>
            ))}
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
