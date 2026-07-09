// ============================================================================
// Prerender script — SEO safety net for the React SPA.
//
// What this does:
//   After `vite build` finishes (dist/ already contains a fully working,
//   already-tested SPA), this script ADDS extra static HTML files at
//   /category/index.html, /category/listing-id/index.html,
//   /blog/slug/index.html and /things-to-do/index.html. Each contains real,
//   readable text (title, description) so search engine crawlers that don't
//   run JavaScript still see actual content instead of an empty page.
//
// Why this is safe:
//   - It NEVER modifies the root dist/index.html or any existing file.
//   - It only ADDS new files, at paths that previously had no static file
//     (Netlify was serving them via the SPA catch-all redirect anyway).
//   - When a visitor's browser loads one of these pages, React still mounts
//     normally via `ReactDOM.createRoot(...).render(...)` in main.jsx, which
//     replaces the entire #root content with the live interactive app —
//     so the actual site behaviour for real users is completely unchanged.
//   - If anything in this script fails (network hiccup, empty tables, etc.)
//     it logs a warning and exits successfully (code 0) rather than failing
//     the build. The already-built dist/ from `vite build` is never at risk.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const TEMPLATE_PATH = path.join(DIST_DIR, "index.html");

const SUPABASE_URL = "https://phctpwswosfwjmxhidyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HEy4rqVBXuH_qRBHEwYSdg_wW-677OT";

const ACTIVITY_CATEGORIES = ["tours", "attractions", "experiences", "heritage", "caves", "nature", "beaches"];

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SITE_URL = "https://viteconfig-1-zeta.vercel.app";
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/images/beaches/nungwi-beach.jpeg`;

function absoluteUrl(maybeRelative) {
  if (!maybeRelative) return DEFAULT_SHARE_IMAGE;
  if (maybeRelative.startsWith("http")) return maybeRelative;
  return `${SITE_URL}${maybeRelative}`;
}

function writeStaticPage(template, routePath, { title, description, bodyHtml, image, url, structuredData }) {
  let html = template;

  if (title) {
    html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  }
  if (description) {
    html = html.replace(
      /<meta name="description" content=".*?"\s*\/?>/s,
      `<meta name="description" content="${escapeHtml(description)}" />`
    );
  }

  const pageUrl = url || `${SITE_URL}${routePath}`;
  const pageImage = absoluteUrl(image);

  // Swap out the default OG/Twitter tags for page-specific ones, so a link
  // shared in WhatsApp, Facebook, or Twitter shows the right title, blurb,
  // and photo for THAT listing - not the generic homepage ones.
  html = html
    .replace(/<link rel="canonical" href=".*?"\s*\/?>/s, `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`)
    .replace(/<meta property="og:title" content=".*?"\s*\/?>/s, `<meta property="og:title" content="${escapeHtml(title || "")}" />`)
    .replace(
      /<meta property="og:description" content=".*?"\s*\/?>/s,
      `<meta property="og:description" content="${escapeHtml(description || "")}" />`
    )
    .replace(/<meta property="og:image" content=".*?"\s*\/?>/s, `<meta property="og:image" content="${escapeHtml(pageImage)}" />`)
    .replace(/<meta property="og:url" content=".*?"\s*\/?>/s, `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`)
    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/s, `<meta name="twitter:title" content="${escapeHtml(title || "")}" />`)
    .replace(
      /<meta name="twitter:description" content=".*?"\s*\/?>/s,
      `<meta name="twitter:description" content="${escapeHtml(description || "")}" />`
    )
    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/s, `<meta name="twitter:image" content="${escapeHtml(pageImage)}" />`);

  const structuredDataTag = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
    : "";

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${bodyHtml}</div>${structuredDataTag}`
  );

  const outDir = path.join(DIST_DIR, routePath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
}

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.warn("[prerender] dist/index.html not found — skipping (run `vite build` first).");
    return;
  }
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---- Categories + their listing pages ----
  let categories = [];
  try {
    const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
    if (error) throw new Error(error.message);
    categories = data || [];
  } catch (err) {
    console.warn("[prerender] Could not load categories, skipping category pages:", err.message);
  }

  let listings = [];
  try {
    const { data, error } = await supabase.from("listings").select("*").eq("status", "approved");
    if (error) throw new Error(error.message);
    listings = data || [];
  } catch (err) {
    console.warn("[prerender] Could not load listings, skipping listing pages:", err.message);
  }

  let generated = 0;

  for (const cat of categories) {
    const catListings = listings.filter((l) => l.category_key === cat.key);
    const listItems = catListings
      .map(
        (l) =>
          `<li><a href="/${escapeHtml(cat.key)}/${escapeHtml(l.id)}">${escapeHtml(l.title)}${
            l.location ? ` — ${escapeHtml(l.location)}` : ""
          }</a></li>`
      )
      .join("");

    try {
      writeStaticPage(template, `/${cat.key}`, {
        title: `${cat.title || cat.key} | Zanzibar Paradise Tours`,
        description: `${cat.title || cat.key} in Zanzibar — ${catListings.length} listings, curated by Zanzibar Paradise Tours.`,
        bodyHtml: `<h1>${escapeHtml(cat.title || cat.key)}</h1><ul>${listItems}</ul>`,
      });
      generated++;
    } catch (err) {
      console.warn(`[prerender] Failed to write category page /${cat.key}:`, err.message);
    }

    for (const l of catListings) {
      try {
        const pageUrl = `${SITE_URL}/${cat.key}/${l.id}`;
        const schemaType =
          cat.key === "hotels" ? "LodgingBusiness" : cat.key === "restaurants" ? "Restaurant" : "TouristAttraction";
        writeStaticPage(template, `/${cat.key}/${l.id}`, {
          title: `${l.title} | ${cat.title || cat.key} | Zanzibar Paradise Tours`,
          description: (l.description || "").slice(0, 155),
          image: l.image_url,
          url: pageUrl,
          bodyHtml: `<h1>${escapeHtml(l.title)}</h1>${l.location ? `<p>${escapeHtml(l.location)}</p>` : ""}<p>${escapeHtml(
            l.description || ""
          )}</p>`,
          structuredData: {
            "@context": "https://schema.org",
            "@type": schemaType,
            name: l.title,
            description: l.description || "",
            image: absoluteUrl(l.image_url),
            url: pageUrl,
            address: l.location || undefined,
          },
        });
        generated++;
      } catch (err) {
        console.warn(`[prerender] Failed to write listing page /${cat.key}/${l.id}:`, err.message);
      }
    }
  }

  // ---- Things to Do hub page ----
  try {
    const activityListings = listings.filter((l) => ACTIVITY_CATEGORIES.includes(l.category_key));
    const listItems = activityListings
      .map(
        (l) =>
          `<li><a href="/${escapeHtml(l.category_key)}/${escapeHtml(l.id)}">${escapeHtml(l.title)}${
            l.location ? ` — ${escapeHtml(l.location)}` : ""
          }</a></li>`
      )
      .join("");
    writeStaticPage(template, "/things-to-do", {
      title: "Things to Do in Zanzibar | Zanzibar Paradise Tours",
      description:
        "The best things to do in Zanzibar — tours, attractions, heritage sites, caves, nature spots and unique experiences, curated by locals.",
      bodyHtml: `<h1>Things to Do in Zanzibar</h1><ul>${listItems}</ul>`,
    });
    generated++;
  } catch (err) {
    console.warn("[prerender] Failed to write /things-to-do:", err.message);
  }

  // ---- Kwa Watanzania hub page (Swahili blog posts list) ----
  try {
    const { data: allPosts, error } = await supabase.from("blog_posts").select("*").eq("status", "published");
    if (error) throw new Error(error.message);
    const swahiliPosts = (allPosts || []).filter((p) => p.language === "sw");
    const listItems = swahiliPosts
      .map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></li>`)
      .join("");
    writeStaticPage(template, "/kwa-watanzania", {
      title: "Safari Zanzibar Kwa Watanzania | Zanzibar Paradise Tours",
      description: "Vidokezo, bei, na maelezo ya safari za Zanzibar kwa Watanzania — kwa lugha ya Kiswahili.",
      bodyHtml: `<h1>Safari za Zanzibar Kwa Watanzania</h1><ul>${listItems}</ul>`,
    });
    generated++;
  } catch (err) {
    console.warn("[prerender] Failed to write /kwa-watanzania:", err.message);
  }

  // ---- Blog posts ----
  try {
    const { data: posts, error } = await supabase.from("blog_posts").select("*").eq("status", "published");
    if (error) throw new Error(error.message);
    for (const post of posts || []) {
      try {
        writeStaticPage(template, `/blog/${post.slug}`, {
          title: `${post.title} | Zanzibar Paradise Tours Blog`,
          description: (post.content || "").slice(0, 155),
          bodyHtml: `<h1>${escapeHtml(post.title)}</h1><div>${escapeHtml(post.content || "")}</div>`,
        });
        generated++;
      } catch (err) {
        console.warn(`[prerender] Failed to write blog post /blog/${post.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("[prerender] Could not load blog posts, skipping blog prerender:", err.message);
  }

  console.log(`[prerender] Done — generated ${generated} static page(s) for search engines.`);
}

main()
  .catch((err) => {
    console.warn("[prerender] Unexpected error (build output is unaffected):", err.message);
  })
  .finally(() => {
    // Never fail the build because of this script.
    process.exit(0);
  });
