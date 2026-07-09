import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data }) => {
        setPost(data || null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-24 text-center">Loading...</div>;

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-teal-700 font-semibold hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

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
          {post.content}
        </div>
      </div>
    </div>
  );
}
