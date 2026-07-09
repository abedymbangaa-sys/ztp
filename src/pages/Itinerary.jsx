import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { BookOpenText, Download } from "lucide-react";
import PaymentInstructions from "../components/PaymentInstructions";

export default function Itinerary() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    supabase
      .from("itinerary_guides")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setGuides(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Plan Your Trip</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpenText className="w-7 h-7 text-teal-700" />
          Itinerary Guides
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Complete day-by-day guides (PDF) prepared by local experts - pricing, plans,
          and real Zanzibar tips.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : guides.length === 0 ? (
        <p className="text-slate-500">Guides are still being prepared - available soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {guides.map((g) => (
            <div key={g.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {g.cover_image && (
                <div className="h-44 overflow-hidden">
                  <img src={g.cover_image} alt={g.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <h2 className="font-bold text-lg text-slate-900 mb-1">{g.title}</h2>
                {g.days_summary && <p className="text-xs text-slate-500 mb-2">{g.days_summary}</p>}
                {g.description && <p className="text-sm text-slate-600 mb-4">{g.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-teal-700">${g.price_usd}</span>
                  <button
                    onClick={() => setBuying(g)}
                    className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-5 py-2.5 rounded-full"
                  >
                    <Download className="w-4 h-4" />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {buying && (
        <PaymentInstructions
          itemTitle={buying.title}
          price={buying.price_usd}
          onClose={() => setBuying(null)}
        />
      )}
    </div>
  );
}
