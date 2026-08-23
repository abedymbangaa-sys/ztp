import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Newspaper, AlertTriangle, RefreshCw } from "lucide-react";
import ItineraryDownloadBanner from "../components/ItineraryDownloadBanner";
import { getCacheEntry, setCacheEntry, isFresh } from "../data/queryCache";

const BLOG_CACHE_KEY = "blog_posts";
// Same hard-timeout reasoning as data/hooks.js: without this, a hung
// request (dead connection, cold serverless function, flaky mobile
// network) leaves "Loading articles..." on screen forever - exactly the
// stuck state flagged in the audit. This page previously had no timeout
// at all.
const FETCH_TIMEOUT_MS = 9000;
function withTimeout(promise) {
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS));
  return Promise.race([promise, timeoutPromise]);
}

export default function Blog() {
  const cachedEntry = getCacheEntry(BLOG_CACHE_KEY);
  const [posts, setPosts] = useState(cachedEntry?.data || []);
  // "loading" | "ready" | "error"
  const [status, setStatus] = useState(cachedEntry ? "ready" : "loading");

  const loadPosts = useCallback(() => {
    const entry = getCacheEntry(BLOG_CACHE_KEY);
    if (entry) {
      setPosts(entry.data);
      setStatus("ready");
      // Cache still fresh - skip hitting the network again for data we
      // just showed instantly.
      if (isFresh(entry)) return;
    } else {
      setStatus("loading");
    }

    withTimeout(
      supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .neq("post_type", "guide")
        .order("created_at", { ascending: false })
    )
      .then(({ data, error }) => {
        if (error) throw error;
        // Filter client-side (not in the query) so this page keeps working
        // even before the `language` column exists in Supabase - posts
        // without a language set are treated as English (the original,
        // pre-existing behaviour).
        const englishPosts = (data || []).filter((p) => !p.language || p.language === "en");
        setCacheEntry(BLOG_CACHE_KEY, englishPosts);
        setPosts(englishPosts);
        setStatus("ready");
      })
      .catch(() => {
        // A failed background refresh shouldn't blank out posts already
        // showing fine from cache.
        if (!entry) setStatus("error");
      });
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Blog</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-teal-700" />
          News & Tips About Zanzibar
        </h1>
      </div>

      <ItineraryDownloadBanner ctaName="blog_index" />

      {status === "loading" && <p className="text-slate-500">Loading articles...</p>}

      {status === "error" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-800 font-medium">We couldn't load the blog right now.</p>
            <button
              onClick={loadPosts}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        </div>
      )}

      {status === "ready" && posts.length === 0 && (
        <p className="text-slate-500">No posts yet. They will appear here soon.</p>
      )}

      {status === "ready" && posts.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              aria-label={`Read: ${p.title}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100"
            >
              {p.cover_image && (
                <div className="h-44 overflow-hidden">
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/itinerary/zanzibar-itinerary-fallback.jpg";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-bold text-lg text-slate-900 mb-2">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-slate-600 line-clamp-3">{p.excerpt}</p>}
                <span
                  aria-hidden="true"
                  className="inline-flex items-center gap-1.5 mt-4 bg-teal-700 group-hover:bg-teal-800 transition text-white text-sm font-semibold px-4 py-2 rounded-full"
                >
                  Read More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
