import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";
import { useT } from "../lib/i18n";

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <LogoMark className="w-5 h-5 text-teal-400" />
          <p className="font-bold text-white">Zanzibar Paradise Tours</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 mb-3">
          <Link to="/about" className="hover:text-white transition">{t("About Us")}</Link>
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
