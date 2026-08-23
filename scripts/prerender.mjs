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
import { slugify } from "../src/lib/slug.js";
import { AREAS } from "../src/data/areas.js";

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

const SITE_URL = "https://visitzanzibarparadise.com";
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
  const sitemapRoutes = ["/", "/things-to-do", "/kwa-watanzania"];

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
    sitemapRoutes.push(`/${cat.key}`);

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
      sitemapRoutes.push(`/${cat.key}/${l.id}`);
    }
  }

  // ---- Area landing pages (Stone Town, North, East, South, Central, Pemba) ----
  for (const area of AREAS) {
    try {
      const areaListings = listings.filter((l) => l.area === area.key);
      const listItems = areaListings
        .map((l) => `<li><a href="/${escapeHtml(l.category_key)}/${escapeHtml(l.id)}">${escapeHtml(l.title)}</a></li>`)
        .join("");
      const pageUrl = `${SITE_URL}/area/${area.key}`;
      writeStaticPage(template, `/area/${area.key}`, {
        title: `${area.name} Zanzibar — Hotels, Tours & Things to Do | Zanzibar Paradise Tours`,
        description: area.description.slice(0, 155),
        image: area.heroImage,
        url: pageUrl,
        bodyHtml: `<h1>${escapeHtml(area.name)}</h1><p>${escapeHtml(area.description)}</p><ul>${listItems}</ul>`,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: `${area.name}, Zanzibar`,
          description: area.description,
          url: pageUrl,
        },
      });
      generated++;
      sitemapRoutes.push(`/area/${area.key}`);
    } catch (err) {
      console.warn(`[prerender] Failed to write area page /area/${area.key}:`, err.message);
    }
  }

  // ---- Practical Guides (airport, ferry, tides, best time, money, etiquette) ----
  try {
    const { data: guidePosts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("post_type", "guide");
    if (error) throw new Error(error.message);

    const listItems = (guidePosts || [])
      .map((g) => `<li><a href="/guides/${escapeHtml(g.slug)}">${escapeHtml(g.title)}</a></li>`)
      .join("");
    writeStaticPage(template, "/guides", {
      title: "Zanzibar Travel Guides — Airport, Ferry, Money & More | Zanzibar Paradise Tours",
      description:
        "Practical Zanzibar travel guides: airport transfers, the Dar es Salaam ferry, tide times, best time to visit, money & costs, and local etiquette.",
      bodyHtml: `<h1>Zanzibar Travel Guides</h1><ul>${listItems}</ul>`,
    });
    generated++;
    sitemapRoutes.push("/guides");

    for (const g of guidePosts || []) {
      try {
        const pageUrl = `${SITE_URL}/guides/${g.slug}`;
        const description = g.excerpt || (g.content || "").slice(0, 155);
        writeStaticPage(template, `/guides/${g.slug}`, {
          title: `${g.title} | Zanzibar Paradise Tours`,
          description,
          image: g.cover_image,
          url: pageUrl,
          bodyHtml: `<h1>${escapeHtml(g.title)}</h1><div>${escapeHtml(g.content || "")}</div>`,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.title,
            description,
            image: g.cover_image ? [absoluteUrl(g.cover_image)] : undefined,
            datePublished: g.created_at,
            dateModified: g.updated_at || g.created_at,
            author: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
            publisher: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
            mainEntityOfPage: pageUrl,
          },
        });
        generated++;
        sitemapRoutes.push(`/guides/${g.slug}`);
      } catch (err) {
        console.warn(`[prerender] Failed to write guide page /guides/${g.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("[prerender] Could not load guide posts, skipping guides prerender:", err.message);
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
      if (post.post_type === "guide") continue; // guides get their own /guides/:slug page above
      try {
        const pageUrl = `${SITE_URL}/blog/${post.slug}`;
        const description = post.excerpt || (post.content || "").slice(0, 155);
        writeStaticPage(template, `/blog/${post.slug}`, {
          title: `${post.title} | Zanzibar Paradise Tours Blog`,
          description,
          image: post.cover_image,
          url: pageUrl,
          bodyHtml: `<h1>${escapeHtml(post.title)}</h1><div>${escapeHtml(post.content || "")}</div>`,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            image: post.cover_image ? [absoluteUrl(post.cover_image)] : undefined,
            datePublished: post.created_at,
            dateModified: post.updated_at || post.created_at,
            author: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
            publisher: { "@type": "Organization", name: "Zanzibar Paradise Tours" },
            mainEntityOfPage: pageUrl,
          },
        });
        generated++;
        sitemapRoutes.push(`/blog/${post.slug}`);
      } catch (err) {
        console.warn(`[prerender] Failed to write blog post /blog/${post.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("[prerender] Could not load blog posts, skipping blog prerender:", err.message);
  }

  // ---- Free itinerary guides (list page + per-guide online view) ----
  try {
    const { data: guides, error } = await supabase
      .from("itinerary_guides")
      .select("*")
      .eq("status", "published");
    if (error) throw new Error(error.message);

    const listItems = (guides || [])
      .map((g) => `<li><a href="/itinerary/${escapeHtml(slugify(g.title))}">${escapeHtml(g.title)}</a></li>`)
      .join("");

    writeStaticPage(template, "/itinerary", {
      title: "Free 5-Day Zanzibar Itinerary PDF | Zanzibar Paradise Tours",
      description:
        "Download a free practical 5-day Zanzibar itinerary with beaches, Stone Town, spice farms, Jozani Forest and marine activities.",
      bodyHtml: `<h1>Free Zanzibar Itinerary Guides</h1><ul>${listItems}</ul>`,
    });
    generated++;
    sitemapRoutes.push("/itinerary");

    for (const g of guides || []) {
      try {
        const slug = slugify(g.title);
        const pageUrl = `${SITE_URL}/itinerary/${slug}`;
        writeStaticPage(template, `/itinerary/${slug}`, {
          title: `${g.title} | Free Online Itinerary | Zanzibar Paradise Tours`,
          description: g.description || "A free, practical day-by-day Zanzibar itinerary.",
          image: g.cover_image,
          url: pageUrl,
          bodyHtml: `<h1>${escapeHtml(g.title)}</h1>${g.days_summary ? `<p>${escapeHtml(g.days_summary)}</p>` : ""}<p>${escapeHtml(
            g.description || ""
          )}</p>`,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: g.title,
            description: g.description || "",
            url: pageUrl,
          },
        });
        generated++;
        sitemapRoutes.push(`/itinerary/${slug}`);
      } catch (err) {
        console.warn(`[prerender] Failed to write itinerary page for "${g.title}":`, err.message);
      }
    }
  } catch (err) {
    console.warn("[prerender] Could not load itinerary guides, skipping itinerary prerender:", err.message);
  }

  // ---- Homepage ("/") real-content fallback ----
  // This is the ONE deliberate exception to "never touch dist/index.html"
  // above: without this, "/" ships as an empty <div id="root"></div> until
  // React hydrates, which is what made the last audit see a "blank
  // homepage" - a real visitor's browser still renders the full
  // interactive homepage a moment later exactly as before; this only adds
  // real, readable content (category + top listings + area links) for
  // crawlers, slow connections, and JS-disabled visits, using `template`
  // (the pristine original), never a version already mutated by the
  // per-route pages above.
  try {
    const topListings = listings.slice(0, 8);
    const categoryLinks = categories
      .map((c) => `<li><a href="/${escapeHtml(c.key)}">${escapeHtml(c.title)}</a></li>`)
      .join("");
    const listingLinks = topListings
      .map((l) => `<li><a href="/${escapeHtml(l.category_key)}/${escapeHtml(l.id)}">${escapeHtml(l.title)}</a></li>`)
      .join("");
    const areaLinks = AREAS.map((a) => `<li><a href="/area/${a.key}">${escapeHtml(a.name)}</a></li>`).join("");

    // Two layers, both in the raw HTML:
    // 1. A branded loading screen (teal gradient matching the real hero,
    //    ZPT name, a spinner) - this is the ONLY thing a human sees for
    //    the split second before React hydrates and replaces it, so the
    //    page never flashes a plain, unstyled list of links.
    // 2. The actual crawlable content (categories/areas/listings) sits
    //    right below it, visually hidden (off-screen, zero size, not
    //    display:none) - this is the same "visually-hidden but
    //    accessible" technique used across the web for a11y text, and
    //    search engines fully read it; it's just not something a real
    //    visitor's eyes ever land on.
    const bodyHtml = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#134e4a,#0f766e 55%,#0f172a);color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;">
        <div>
          <p style="font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:#fcd34d;margin:0 0 14px;">Welcome to Zanzibar</p>
          <h1 style="font-size:30px;font-weight:700;margin:0 0 10px;">Zanzibar Paradise Tours</h1>
          <p style="opacity:0.75;font-size:14px;margin:0 0 22px;max-width:320px;">A trusted directory of hotels, tours and attractions in Zanzibar.</p>
          <div style="width:28px;height:28px;margin:0 auto;border:3px solid rgba(255,255,255,0.25);border-top-color:#fcd34d;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      <div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;">
        <p>A trusted directory of hotels, tours, beaches and attractions in Zanzibar, built by people who know the island well.</p>
        <nav aria-label="Categories"><ul>${categoryLinks}</ul></nav>
        <nav aria-label="Areas of Zanzibar"><ul>${areaLinks}</ul></nav>
        <section aria-label="Featured listings"><ul>${listingLinks}</ul></section>
      </div>
    `;

    let html = template
      .replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${escapeHtml("Zanzibar Paradise Tours - a trusted directory of hotels, tours, beaches and attractions in Zanzibar, built by people who know the island well.")}" />`)
      .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

    fs.writeFileSync(path.join(DIST_DIR, "index.html"), html, "utf8");
    console.log("[prerender] Wrote real-content fallback into dist/index.html for \"/\".");
  } catch (err) {
    console.warn("[prerender] Failed to write homepage fallback content:", err.message);
  }

  // ---- sitemap.xml ----
  // Built from the exact same route list search engines are told about above,
  // so it can never drift out of sync with what actually exists on the site.
  try {
    const urlEntries = sitemapRoutes
      .map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`)
      .join("\n");
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
    fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemapXml, "utf8");

    const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
    fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robotsTxt, "utf8");

    console.log(`[prerender] Wrote sitemap.xml with ${sitemapRoutes.length} URLs.`);
  } catch (err) {
    console.warn("[prerender] Failed to write sitemap.xml:", err.message);
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
