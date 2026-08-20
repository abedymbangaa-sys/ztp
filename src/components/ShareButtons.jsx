import { useState } from "react";
import { Share2, Facebook, MessageCircle, Link as LinkIcon, Check } from "lucide-react";

// Drop-in share widget for any listing/ad detail page.
// - On phones with the native share sheet (most Android/iOS browsers),
//   tapping "Share" opens the OS sheet itself — which already includes
//   Instagram, Facebook, WhatsApp, Messages, etc, so we don't need to
//   reinvent those. This is the best experience and the one most people
//   will actually get.
// - On desktop (no navigator.share), we fall back to explicit WhatsApp /
//   Facebook buttons plus "Copy Link" (which covers Instagram: people
//   paste the link into their Instagram bio/story/DM themselves, since
//   Instagram has no public web share URL).
export default function ShareButtons({ title, className = "" }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = title ? `Check out ${title} on Zanzibar Paradise Tours` : "Check this out on Zanzibar Paradise Tours";

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  async function nativeShare() {
    try {
      await navigator.share({ title: text, url });
    } catch {
      // user cancelled the share sheet — do nothing
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (canNativeShare) {
    return (
      <button
        type="button"
        onClick={nativeShare}
        className={
          "inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition " +
          className
        }
      >
        <Share2 className="w-4 h-4" /> Share
      </button>
    );
  }

  return (
    <div className={"flex items-center gap-2 " + className}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`}
        target="_blank"
        rel="noreferrer"
        title="Share on WhatsApp"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition"
      >
        <MessageCircle className="w-4 h-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        title="Share on Facebook"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        title="Copy link"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
      >
        {copied ? <Check className="w-4 h-4 text-teal-700" /> : <LinkIcon className="w-4 h-4" />}
      </button>
      {copied && <span className="text-xs text-teal-700 font-medium">Copied!</span>}
    </div>
  );
}
