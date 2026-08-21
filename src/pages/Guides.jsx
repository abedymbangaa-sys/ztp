import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSEO } from "../lib/useSEO";
import { BookOpenText, AlertTriangle, RefreshCw } from "lucide-react";

// /guides — hub page for practical, keyword-targeted Zanzibar travel guides
// (airport transfer, ferry, tides, best time to visit, money, etiquette).
// Reuses the existing blog_posts table (post_type = 'guide') rather than a
// new table, so Abedy can add/edit guides from the Admin Dashboard he
// already knows, with no new backend to maintain.
export default function Guides() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");

  const loadPosts = useCallback(() => {
    setStatus("loading");
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("post_type", "guide")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setPosts(data || []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useSEO({
    title: "Zanzibar Travel Guides — Airport, Ferry, Money & More | Zanzibar Paradise Tours",
    description:
      "Practical Zanzibar travel guides: airport transfers, the Dar es Salaam ferry, tide times, best time to visit, money & costs, and local etiquette.",
    canonical: "https://visitzanzibarparadise.com/guides",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Practical Guides</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpenText className="w-7 h-7 text-teal-700" />
          Zanzibar Travel Guides
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Practical, no-fluff guides for getting to Zanzibar, getting around, and understanding local customs.
        </p>
      </div>

      {status === "loading" && <p className="text-slate-500">Loading guides...</p>}

      {status === "error" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-800 font-medium">We couldn't load the guides right now.</p>
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
        <p className="text-slate-500">Guides are being prepared - check back soon.</p>
      )}

      {status === "ready" && posts.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/guides/${p.slug}`}
              aria-label={`Read: ${p.title}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100"
            >
              {p.cover_image && (
                <div className="h-40 overflow-hidden">
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
                  Read Guide →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
