import { useState } from "react";
import { X, Smartphone, MessageCircle, Copy, Check } from "lucide-react";
import { SITE_CONTACT_NUMBER } from "../lib/whatsapp";

const PAYMENT_NUMBER = "0692375812";
const PAYMENT_NETWORK = "Airtel Money";
const PAYMENT_NAME = "Wachu Digital Growth";

export default function PaymentInstructions({ itemTitle, price, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmLink = `https://wa.me/${SITE_CONTACT_NUMBER}?text=${encodeURIComponent(
    `Hello! I have paid $${price} for "${itemTitle}". I have attached a screenshot of the payment.`
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-5 h-5 text-teal-700" />
          <h2 className="font-bold text-lg text-slate-900">{PAYMENT_NETWORK} Payment</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          For: <span className="font-semibold">{itemTitle}</span> — ${price}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
          <p className="text-xs text-slate-500 mb-1">Send to this number</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-wide">{PAYMENT_NUMBER}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold bg-teal-700 text-white px-3 py-1.5 rounded-full hover:bg-teal-800"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Name: {PAYMENT_NAME}</p>
        </div>

        <ol className="text-sm text-slate-600 space-y-2 mb-6 list-decimal list-inside">
          <li>Send ${price} to the Airtel Money number above</li>
          <li>Take a screenshot of the successful transaction</li>
          <li>Tap the button below to confirm via WhatsApp</li>
          <li>We will send you your item as soon as we confirm payment</li>
        </ol>

        <a
          href={confirmLink}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition text-white font-bold py-3 rounded-full"
        >
          <MessageCircle className="w-4 h-4" />
          I have paid - Confirm via WhatsApp
        </a>
      </div>
    </div>
  );
}
