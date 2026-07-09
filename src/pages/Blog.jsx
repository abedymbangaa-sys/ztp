import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Newspaper } from "lucide-react";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        // Filter client-side (not in the query) so this page keeps working
        // even before the `language` column exists in Supabase — posts
        // without a language set are treated as English (the original,
        // pre-existing behaviour).
        const englishPosts = (data || []).filter((p) => !p.language || p.language === "en");
        setPosts(englishPosts);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Blog</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-teal-700" />
          News & Tips About Zanzibar
        </h1>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No posts yet. They will appear here soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100"
            >
              {p.cover_image && (
                <div className="h-44 overflow-hidden">
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-bold text-lg text-slate-900 mb-2">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-slate-600 line-clamp-3">{p.excerpt}</p>}
                <span className="inline-flex items-center gap-1.5 mt-4 bg-teal-700 group-hover:bg-teal-800 transition text-white text-sm font-semibold px-4 py-2 rounded-full">
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
