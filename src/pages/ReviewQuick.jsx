import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ReviewsSection from "../components/ReviewsSection";
import { ArrowLeft, Loader2 } from "lucide-react";

// Standalone page for a single listing's reviews, meant to be shared
// directly with a guest (via WhatsApp link or a printed QR code at the
// property) rather than making them dig through the full listing page.
// This is the whole point of the feature: more real reviews come in
// when leaving one takes one tap, not a scavenger hunt.
export default function ReviewQuick() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("listings")
      .select("id, title, category_key, image_url")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) {
          setNotFound(true);
        } else {
          setListing(data);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-semibold mb-2">We couldn't find this listing.</p>
        <Link to="/" className="text-teal-700 font-semibold hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/${listing.category_key}/${listing.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {listing.title}
      </Link>

      <div className="flex items-center gap-4 mb-2">
        {listing.image_url && (
          <img src={listing.image_url} alt={listing.title} className="w-16 h-16 rounded-xl object-cover" />
        )}
        <div>
          <p className="text-sm text-slate-500">How was your visit to</p>
          <h1 className="text-xl font-bold text-slate-900">{listing.title}?</h1>
        </div>
      </div>
      <p className="text-slate-600 mb-4">Your review helps other travelers - it only takes a minute.</p>

      <ReviewsSection listingId={listing.id} />
    </div>
  );
}
