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
// Same fallback used in Home.jsx when no admin-set hero image exists yet -
// kept in sync manually since this script runs standalone, outside React.
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=2400&q=85&auto=format&fit=crop";

function absoluteUrl(maybeRelative) {
  if (!maybeRelative) return DEFAULT_SHARE_IMAGE;
  if (maybeRelative.startsWith("http")) return maybeRelative;
  return `${SITE_URL}${maybeRelative}`;
}

function writeStaticPage(template, routePath, { title, description, bodyHtml, image, url, structuredData, preload }) {
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

  // Embeds the already-fetched data (listing, category listings, etc.)
  // as JSON right in the static HTML. Without this, the first thing React
  // does on mount is blank out this real content and show an empty grey
  // "skeleton" while it re-fetches the SAME data from Supabase over the
  // network. If a crawler (or a slow connection) evaluates the page during
  // that empty window, it sees a blank page and can flag it as thin/soft-404
  // - even though this rich prerendered HTML was there a moment earlier.
  // The relevant hook reads window.__ZTP_PRELOAD__ on first render and uses
  // it immediately instead of starting from nothing, then quietly
  // re-fetches in the background to stay fresh.
  const preloadTag = preload
    ? `<script>window.__ZTP_PRELOAD__=${JSON.stringify(preload).replace(/</g, "\\u003c")};</script>`
    : "";

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${bodyHtml}</div>${structuredDataTag}${preloadTag}`
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
        preload: { type: "listings", categoryKey: cat.key, data: catListings },
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
          preload: { type: "listing", id: l.id, data: l },
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
    const PILL_CLASS = "inline-block bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-teal-700 hover:border-teal-400";
    const topListings = listings.slice(0, 8);
    const categoryLinks = categories
      .map((c) => `<li><a href="/${escapeHtml(c.key)}" class="${PILL_CLASS}">${escapeHtml(c.title)}</a></li>`)
      .join("");
    const listingLinks = topListings
      .map((l) => `<li><a href="/${escapeHtml(l.category_key)}/${escapeHtml(l.id)}" class="${PILL_CLASS}">${escapeHtml(l.title)}</a></li>`)
      .join("");
    const areaLinks = AREAS.map((a) => `<li><a href="/area/${a.key}" class="${PILL_CLASS}">${escapeHtml(a.name)}</a></li>`).join("");

    // Mirrors Home.jsx's actual hero section using the SAME Tailwind
    // classes Home.jsx uses (already compiled into the build's CSS, since
    // Home.jsx itself uses them) - so this static version looks visually
    // identical to the real hero, not a generic placeholder. Real <a>
    // links work even before React loads. Once React hydrates, it
    // replaces this with the full interactive homepage (search, stats,
    // etc.) - the switch should be imperceptible since both look the same.
    let heroImageUrl = DEFAULT_HERO_IMAGE;
    try {
      const { data: settingsRows } = await supabase.from("settings").select("key, value");
      const heroSetting = (settingsRows || []).find((s) => s.key === "hero_image_url");
      if (heroSetting?.value) heroImageUrl = heroSetting.value;
    } catch {
      // Fall back to DEFAULT_HERO_IMAGE below - never block the build.
    }

    const bodyHtml = `
      <div>
        <section class="relative text-white overflow-hidden min-h-[640px] flex items-center bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900">
          <img src="${escapeHtml(heroImageUrl)}" alt="Zanzibar coastline" class="absolute inset-0 w-full h-full object-cover scale-105" />
          <div class="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-teal-950/45 to-slate-950/85"></div>
          <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
          <div class="relative max-w-6xl mx-auto px-4 py-24 sm:py-32 text-center w-full">
            <p class="uppercase tracking-[0.35em] text-amber-300 text-xs sm:text-sm font-semibold mb-5">Welcome to Zanzibar</p>
            <h1 class="font-serif text-5xl sm:text-6xl md:text-8xl font-bold mb-6 leading-[0.98] tracking-tight drop-shadow-2xl">
              Discover the<br /><span class="italic text-amber-200">Real</span> Zanzibar
            </h1>
            <p class="max-w-2xl mx-auto text-slate-100/90 text-base sm:text-xl mb-10 px-2 font-light">
              A trusted directory of hotels, tours, and attractions in Zanzibar — built by people who know this island well.
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <a href="/trip-builder" class="bg-amber-500 hover:bg-amber-400 transition text-slate-900 font-bold px-7 py-3.5 rounded-full shadow-lg inline-flex items-center justify-center gap-2">Build My Zanzibar Trip</a>
              <a href="/things-to-do" class="bg-white text-teal-900 font-bold px-7 py-3.5 rounded-full hover:bg-amber-50 transition shadow-lg">Explore Experiences</a>
              <a href="https://wa.me/255635442732" class="border-2 border-white/80 font-bold px-7 py-3.5 rounded-full hover:bg-white/10 transition backdrop-blur-sm">Ask Now</a>
            </div>
          </div>
        </section>
        <nav aria-label="Categories" class="max-w-6xl mx-auto px-4 py-8"><ul class="flex flex-wrap gap-3 list-none p-0 m-0">${categoryLinks}</ul></nav>
        <nav aria-label="Areas of Zanzibar" class="max-w-6xl mx-auto px-4 py-4"><ul class="flex flex-wrap gap-3 list-none p-0 m-0">${areaLinks}</ul></nav>
        <section aria-label="Featured listings" class="max-w-6xl mx-auto px-4 py-4 pb-16"><ul class="flex flex-wrap gap-3 list-none p-0 m-0">${listingLinks}</ul></section>
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

