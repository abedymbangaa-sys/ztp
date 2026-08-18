import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { trackEvent } from "../lib/analytics";
import { AlertTriangle, RefreshCw, MapPin, Hotel, Compass, BookOpenText } from "lucide-react";

const SITE_URL = "https://visitzanzibarparadise.com";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  // "loading" | "ready" | "not_found" | "error"
  const [status, setStatus] = useState("loading");

  const load = useCallback(() => {
    setStatus("loading");
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data, error }) => {
        if (error) {
          setStatus(error.code === "PGRST116" ? "not_found" : "error");
          return;
        }
        setPost(data || null);
        setStatus(data ? "ready" : "not_found");
      })
      .catch(() => setStatus("error"));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const canonical = `${SITE_URL}/blog/${slug}`;
  const description = post?.excerpt || (post?.content || "").slice(0, 155);

  useSEO({
    title: post ? `${post.title} | Zanzibar Paradise Tours Blog` : undefined,
    description,
    canonical,
    image: post?.cover_image,
    structuredData: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description,
          image: post.cover_image ? [post.cover_image] : undefined,
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
          publisher: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
          mainEntityOfPage: canonical,
        }
      : undefined,
  });

  if (status === "loading") {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500">Loading article...</div>;
  }

  if (status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-3" />
        <p className="text-slate-700 mb-4">We couldn't load this article right now.</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-teal-700 font-semibold hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  // Split content so the CTA row can sit right after the first paragraph,
  // as requested. Falls back to putting the CTA before everything if there
  // is no paragraph break to split on.
  const content = post.content || "";
  const splitIndex = content.indexOf("\n\n");
  const firstParagraph = splitIndex === -1 ? content : content.slice(0, splitIndex);
  const restOfContent = splitIndex === -1 ? "" : content.slice(splitIndex + 2);

  const track = (ctaName) => () => trackEvent("click_itinerary_cta", { cta_name: ctaName, source_page: `/blog/${slug}` });

  return (
    <div>
      {post.cover_image && (
        <div className="h-64 md:h-96 w-full overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/blog" className="text-sm text-teal-700 font-semibold hover:underline">
          ← Back to Blog
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-6">{post.title}</h1>

        <div className="prose max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
          {firstParagraph}
        </div>

        <div className="flex flex-wrap gap-3 my-8">
          <Link
            to="/itinerary"
            onClick={track("plan_trip")}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 transition text-white font-semibold px-4 py-2 rounded-full text-sm"
          >
            Plan Your Zanzibar Trip
          </Link>
          <Link
            to="/itinerary"
            onClick={track("download_itinerary_inline")}
            className="inline-flex items-center gap-2 border-2 border-teal-700 text-teal-700 hover:bg-teal-50 transition font-semibold px-4 py-2 rounded-full text-sm"
          >
            Download Free 5-Day Itinerary
          </Link>
          <Link
            to="/things-to-do"
            onClick={track("things_to_do")}
            className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 transition font-semibold px-4 py-2 rounded-full text-sm"
          >
            Explore Things to Do
          </Link>
        </div>

        {restOfContent && (
          <div className="prose max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
            {restOfContent}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Keep exploring</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link to="/things-to-do" className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline">
              <Compass className="w-4 h-4" /> Things to Do
            </Link>
            <Link to="/hotels" className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline">
              <Hotel className="w-4 h-4" /> Hotels
            </Link>
            <Link to="/tours" className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline">
              <MapPin className="w-4 h-4" /> Tours
            </Link>
            <Link to="/itinerary" className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline">
              <BookOpenText className="w-4 h-4" /> Free Itinerary
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
