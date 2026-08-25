import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { readPreload } from "../data/hooks";
import { AlertTriangle, RefreshCw, MapPin, Hotel, Compass, BookOpenText } from "lucide-react";

const SITE_URL = "https://visitzanzibarparadise.com";

// /guides/:slug — single practical guide article. Same rendering pattern
// as BlogPost.jsx (same blog_posts table, filtered to post_type='guide')
// so both stay easy to maintain from the same Admin Dashboard editor.
export default function GuideDetail() {
  const { slug } = useParams();
  const preloaded = readPreload("guide", (p) => p.slug === slug);
  const [post, setPost] = useState(preloaded || null);
  // "loading" | "ready" | "not_found" | "error"
  const [status, setStatus] = useState(preloaded ? "ready" : "loading");

  const load = useCallback(() => {
    const preload = readPreload("guide", (p) => p.slug === slug);
    if (preload) {
      setPost(preload);
      setStatus("ready");
    } else {
      setStatus("loading");
    }
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("post_type", "guide")
      .single()
      .then(({ data, error }) => {
        if (error) {
          if (!preload) setStatus(error.code === "PGRST116" ? "not_found" : "error");
          return;
        }
        setPost(data || null);
        setStatus(data ? "ready" : "not_found");
      })
      .catch(() => {
        if (!preload) setStatus("error");
      });
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const canonical = `${SITE_URL}/guides/${slug}`;
  const description = post?.excerpt || (post?.content || "").slice(0, 155);

  useSEO({
    title: post ? `${post.title} | Zanzibar Paradise Tours` : undefined,
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
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500">Loading guide...</div>;
  }

  if (status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-3" />
        <p className="text-slate-700 mb-4">We couldn't load this guide right now.</p>
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
        <h1 className="text-2xl font-bold mb-4">Guide Not Found</h1>
        <Link to="/guides" className="text-teal-700 font-semibold hover:underline">
          ← Back to Guides
        </Link>
      </div>
    );
  }

  const content = post.content || "";
  const splitIndex = content.indexOf("\n\n");
  const firstParagraph = splitIndex === -1 ? content : content.slice(0, splitIndex);
  const restOfContent = splitIndex === -1 ? "" : content.slice(splitIndex + 2);

  return (
    <div>
      {post.cover_image && (
        <div className="h-64 md:h-96 w-full overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/itinerary/zanzibar-itinerary-fallback.jpg";
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/guides" className="text-sm text-teal-700 font-semibold hover:underline">
          ← Back to Guides
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-6">{post.title}</h1>

        <div className="prose max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
          {firstParagraph}
        </div>

        {restOfContent && (
          <div className="prose max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap mt-6">
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
            <Link to="/guides" className="inline-flex items-center gap-1.5 text-teal-700 font-semibold hover:underline">
              <BookOpenText className="w-4 h-4" /> All Guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
