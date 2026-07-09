import { Link } from "react-router-dom";
import { SITE_CONTACT_NUMBER } from "../lib/whatsapp";

export default function DataSource() {
  const waLink = `https://wa.me/${SITE_CONTACT_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to discuss my business listing on Zanzibar Paradise Tours."
  )}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Data Source &amp; Removal Notice</h1>
      <p className="text-slate-500 mb-10">Last updated: July 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Zanzibar Paradise Tours is a free directory that helps travelers discover hotels, restaurants,
          tours, beaches and other attractions across Zanzibar. This page explains clearly where business
          information comes from, and how a business owner can control their own listing.
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">1. Curated Listings vs. Partner Listings</h2>
        <p>There are two kinds of listings on this site:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Partner-registered listings</strong> — the business signed up itself through our
            "Join/Partner" page and approved its own details.
          </li>
          <li>
            <strong>Curated listings</strong> — these were added by the Zanzibar Paradise Tours team using
            publicly available information (e.g. Google Maps, the business's own website or social media
            page, general tourism information), with the goal of promoting Zanzibar businesses to
            travelers free of charge. <strong>We do not require prior permission to list publicly available
            business information</strong>, but we recognize that every owner has the right to control their
            own listing — that's why this page exists.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 pt-4">2. Your Rights as a Business Owner</h2>
        <p>If your listing was added to this site without you creating it yourself, you can:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Claim it</strong> — we'll connect you with a Partner account so you can update the details yourself at any time.</li>
          <li><strong>Request a correction</strong> — tell us what's incorrect (name, number, description, photos) and we'll fix it.</li>
          <li><strong>Request full removal</strong> — we won't ask why; we'll remove it free of charge and with no conditions.</li>
        </ul>
        <p>
          The easiest way to do any of these is to click <em>"Own this business?"</em>{" "}
          on the relevant listing page, or to contact us directly below.
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">3. Response Time</h2>
        <p>
          Claim and correction requests are answered within <strong>2 business days</strong>. Removal
          requests are treated as priority and actioned as quickly as possible, typically within 48 hours.
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">4. Contact Us Directly</h2>
        <p>
          If you'd rather talk to us directly instead of filling in a form, reach us on WhatsApp:
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-green-600 hover:bg-green-700 transition text-white font-bold px-6 py-3 rounded-full"
        >
          Contact Us on WhatsApp
        </a>

        <p className="pt-4">
          See also our <Link to="/privacy" className="text-teal-700 font-semibold hover:underline">Privacy Policy</Link>{" "}
          and <Link to="/terms" className="text-teal-700 font-semibold hover:underline">Terms of Service</Link> for
          more details.
        </p>
      </div>
    </div>
  );
}
