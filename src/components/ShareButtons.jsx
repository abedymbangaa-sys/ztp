import { useState } from "react";
import { Share2, MessageCircle, Link as LinkIcon, Check, Send } from "lucide-react";

// lucide-react no longer ships brand icons (Facebook, etc), so we draw a
// small inline Facebook glyph ourselves instead of importing one.
function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

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

  return (
    <div className={"flex items-center gap-2 flex-wrap " + className}>
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
        <FacebookIcon />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        title="Share on X (Twitter)"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition text-xs font-bold"
      >
        𝕏
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noreferrer"
        title="Share on Telegram"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200 transition"
      >
        <Send className="w-4 h-4" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        title="Copy link"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
      >
        {copied ? <Check className="w-4 h-4 text-teal-700" /> : <LinkIcon className="w-4 h-4" />}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          title="More sharing options (Instagram, Messenger, and more)"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
      {copied && <span className="text-xs text-teal-700 font-medium">Copied!</span>}
    </div>
  );
}
