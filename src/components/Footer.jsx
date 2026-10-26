import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";
import { useT } from "../lib/i18n";
import { SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { Camera, Music2, Megaphone } from "lucide-react";

// Our social pages. To add or change one, edit its `url` below. A link whose
// url is left empty ("") is simply not shown, so nothing broken ever appears.
//   - Instagram: https://www.instagram.com/<username>/
//   - TikTok: https://www.tiktok.com/@<username>
//   - WhatsApp Channel: the invite link WhatsApp gives you (https://whatsapp.com/channel/...)
const SOCIAL_LINKS = [
  { key: "instagram", label: "Instagram", url: "https://www.instagram.com/ztp_paradise/", Icon: Camera },
  { key: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@moviebox289", Icon: Music2 },
  { key: "whatsapp-channel", label: "WhatsApp Channel", url: "", Icon: Megaphone },
];

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <LogoMark className="w-5 h-5 text-teal-400" />
          <p className="font-bold text-white">Zanzibar Paradise Tours</p>
        </div>
        {SOCIAL_LINKS.some((l) => l.url) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-xs text-slate-400 mr-1">Follow us</span>
            {SOCIAL_LINKS.filter((l) => l.url).map(({ key, label, url, Icon }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow Zanzibar Paradise Tours on ${label}`}
                className="inline-flex items-center gap-1.5 border border-slate-700 hover:border-teal-400 hover:text-white transition rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 mb-3">
          <Link to="/about" className="hover:text-white transition">{t("About Us")}</Link>
          <Link to="/faq" className="hover:text-white transition">FAQ</Link>
          <Link to="/how-we-verify" className="hover:text-white transition">How We Verify</Link>
          <a
            href={`https://wa.me/${SITE_CONTACT_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            WhatsApp us
          </a>
          <Link to="/data-source" className="hover:text-white transition">{t("Data Source & Removal Notice")}</Link>
          <Link to="/privacy" className="hover:text-white transition">{t("Privacy Policy")}</Link>
          <Link to="/terms" className="hover:text-white transition">{t("Terms of Service")}</Link>
        </div>
        <p>{t("Built by Wachu Digital Growth")}</p>
        <p className="mt-4 text-slate-500">
          &copy; {new Date().getFullYear()} Zanzibar Paradise Tours. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
