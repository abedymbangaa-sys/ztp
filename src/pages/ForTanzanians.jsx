import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Newspaper } from "lucide-react";

export default function ForTanzanians() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Safari Zanzibar Kwa Watanzania | Zanzibar Paradise Tours";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Vidokezo, bei, na maelezo ya safari za Zanzibar kwa Watanzania — kwa lugha ya Kiswahili."
      );
    }

    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const swahiliPosts = (data || []).filter((p) => p.language === "sw");
        setPosts(swahiliPosts);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-teal-700 font-semibold text-sm uppercase tracking-wide">Kwa Watanzania</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Newspaper className="w-7 h-7 text-teal-700" />
          Safari za Zanzibar Kwa Watanzania
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Vidokezo, bei za wastani, na mwongozo wa safari za Zanzibar — ulioandikwa kwa Kiswahili, kwa
          Mtanzania anayepanga likizo yake mwenyewe.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Inapakia...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">Bado hakuna makala. Zitaonekana hapa hivi karibuni.</p>
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
                  Soma Zaidi →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
