import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { sendNotificationEmail } from "../lib/email";

export default function PartnerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      const { error: partnerError } = await supabase.from("partners").insert({
        auth_user_id: userId,
        business_name: form.businessName,
        contact_name: form.contactName,
        phone: form.phone,
        email: form.email,
        status: "pending",
      });
      if (partnerError) {
        setError(partnerError.message);
        setLoading(false);
        return;
      }

      // Mjulishe admin (wewe) kwa email kuhusu msajili mpya
      await sendNotificationEmail({
        toEmail: "abedymbangaa@gmail.com",
        toName: "Wachu Digital Growth",
        subject: "New Partner Registered",
        message: `New business "${form.businessName}" (${form.contactName}, ${form.phone}) has registered and is awaiting your approval on the Admin Panel.`,
      });
    }

    setLoading(false);
    navigate("/partner/dashboard");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Join as a Partner</h1>
      <p className="text-slate-600 mb-8">
        Register your business on Zanzibar Paradise Tours - free for Founding Partners.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
          <input
            required
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
          <input
            required
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp Number</label>
          <input
            required
            name="phone"
            placeholder="255700000000"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <input
            required
            type="password"
            minLength={6}
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 hover:bg-teal-800 transition text-white font-bold py-3 rounded-full disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link to="/partner/login" className="text-teal-700 font-semibold hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
