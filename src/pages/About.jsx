import ContactForm from "../components/ContactForm";
import { SITE_CONTACT_NUMBER } from "../lib/whatsapp";
import { MessageCircle } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">About Zanzibar Paradise Tours</h1>
      <p className="text-slate-500 mb-10">Real Zanzibar, from the people who know it best.</p>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Zanzibar Paradise Tours is a trusted directory of hotels, tours, restaurants, beaches, and
          experiences across Zanzibar. We built this platform because we love this island, and we wanted
          travelers to be able to discover it the way locals do — not through generic listings, but through
          places that are genuinely worth your time.
        </p>
        <p>
          We are not a booking agent. Zanzibar Paradise Tours is a discovery and information platform: we
          showcase hotels, tours, and local businesses, and connect travelers directly with them via
          WhatsApp so you can ask questions, get real answers, and arrange your trip on your own terms —
          without middlemen or hidden booking fees.
        </p>
        <h2 className="text-xl font-bold text-slate-900 pt-4">What We Do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Curate genuine, verified listings of hotels, tours, restaurants, and attractions</li>
          <li>Give local businesses a simple way to be discovered by travelers, without heavy commissions</li>
          <li>Connect travelers directly with businesses via WhatsApp for questions and arrangements</li>
          <li>Share practical guides, itineraries, and tips for exploring Zanzibar</li>
        </ul>
        <h2 className="text-xl font-bold text-slate-900 pt-4">Our Approach</h2>
        <p>
          Every listing on our platform goes through a review process before it goes live. We prioritize
          accuracy and honesty over volume — we would rather list fewer places well than list everything
          without care.
        </p>
        <h2 className="text-xl font-bold text-slate-900 pt-4">Who Is Behind This Site</h2>
        <div className="flex flex-col sm:flex-row gap-5 items-start bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <img
            src="/images/abedy.jpg"
            alt="Abedy, founder of Zanzibar Paradise Tours"
            width="640"
            height="640"
            loading="lazy"
            className="w-28 h-28 rounded-2xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-slate-900">Abedy</p>
            <p className="text-sm text-slate-500 mb-2">Founder, Zanzibar Paradise Tours · Dodoma, Tanzania</p>
            <p className="mb-3">
              I run Wachu Digital Growth, a Tanzanian digital agency that helps tourism businesses get found
              online. Zanzibar Paradise Tours is built and maintained by me. If you message us on WhatsApp,
              you are talking to a real person, and I will point you to the right hotel or tour to ask.
            </p>
            <a
              href={`https://wa.me/${SITE_CONTACT_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-4 py-2 rounded-full text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Message Abedy on WhatsApp
            </a>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 pt-4">Get In Touch</h2>
        <p>
          Have a question, want to list your business, or spot something that needs fixing? Reach out to us
          any time via the WhatsApp button on this site, or send us a message below.
        </p>
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
