import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }
    navigate("/partner/dashboard");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/partner/reset-password`,
    });
    setForgotLoading(false);
    // Always show the same success message whether or not the email is
    // registered - confirming which emails have accounts would leak that
    // information to anyone testing addresses.
    if (resetError) {
      setForgotError("Something went wrong sending the reset link. Please try again.");
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Partner Login</h1>
      <p className="text-slate-600 mb-8">Log in to your dashboard to manage your listings.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 hover:bg-teal-800 transition text-white font-bold py-3 rounded-full disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        <button
          type="button"
          onClick={() => setShowForgot((v) => !v)}
          className="text-teal-700 font-semibold hover:underline"
        >
          Forgot password?
        </button>
      </p>

      {showForgot && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          {forgotSent ? (
            <p className="text-sm text-teal-700 font-medium">
              If an account exists for that email, a password reset link has been sent. Check your
              inbox (and spam folder).
            </p>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Enter your email to reset your password
                </label>
                <input
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              {forgotError && <p className="text-red-600 text-sm">{forgotError}</p>}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-slate-800 hover:bg-slate-900 transition text-white font-semibold py-2.5 rounded-full disabled:opacity-50"
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{" "}
        <Link to="/partner/signup" className="text-teal-700 font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
