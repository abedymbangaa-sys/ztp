import { useState } from "react";
import { sendNotificationEmail } from "../../lib/email";

// Debug helper: sends one real test email through the exact same
// sendNotificationEmail() the site's forms use, and prints the raw
// result on screen. Exists because that function swallows its own
// errors into console.error, which isn't visible on a phone - so a
// silent failure looks identical to "nothing happened".
export default function EmailTestPanel() {
  const [toEmail, setToEmail] = useState("info@visitzanzibarparadise.com");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSend() {
    setSending(true);
    setResult(null);
    const res = await sendNotificationEmail({
      toEmail,
      toName: "ZTP Test",
      subject: "ZTP email test",
      message: `This is a test email sent from the Admin Dashboard at ${new Date().toISOString()}.`,
    });
    setResult(res);
    setSending(false);
  }

  let statusLine = null;
  if (result) {
    if (result.success) {
      statusLine = (
        <p className="text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
          SUCCESS - EmailJS accepted the request. Now check Email History on emailjs.com and the
          inbox (and spam folder) of {toEmail}.
        </p>
      );
    } else if (result.skipped) {
      statusLine = (
        <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          SKIPPED - EmailJS IDs in src/lib/email.js are still placeholders.
        </p>
      );
    } else {
      statusLine = (
        <div className="text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <p className="font-semibold text-red-700 mb-1">FAILED</p>
          <p className="text-red-600 break-words">
            status: {String(result.error?.status ?? "n/a")}
            <br />
            text: {String(result.error?.text ?? result.error?.message ?? result.error)}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
      <h2 className="font-bold text-lg mb-1">Email Test</h2>
      <p className="text-sm text-slate-500 mb-4">
        Sends one real test email through the same code the site's forms use and shows exactly
        what EmailJS answers - no DevTools needed.
      </p>
      <label className="block text-sm font-medium text-slate-600 mb-1">Send test to</label>
      <input
        type="email"
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !toEmail}
        className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-50 mb-4"
      >
        {sending ? "Sending..." : "Send Test Email"}
      </button>
      {statusLine}
    </div>
  );
}
