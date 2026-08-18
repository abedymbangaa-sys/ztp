import { useEffect } from "react";

function setMetaContent(selector, attr, value) {
  if (!value) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

// Lightweight, dependency-free per-page SEO tags (no react-helmet is
// installed in this project). scripts/prerender.mjs already writes the
// right <title>/meta/OG/structured-data tags into the STATIC HTML that
// crawlers see before JS runs. This hook keeps the SAME tags correct once
// React mounts and the visitor navigates client-side (browser tab title,
// and any share-sheet/preview grabbed after JS has run).
export function useSEO({ title, description, canonical, image, structuredData }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    setMetaContent('meta[name="description"]', "content", description);
    setMetaContent('link[rel="canonical"]', "href", canonical);
    setMetaContent('meta[property="og:title"]', "content", title);
    setMetaContent('meta[property="og:description"]', "content", description);
    setMetaContent('meta[property="og:url"]', "content", canonical);
    setMetaContent('meta[name="twitter:title"]', "content", title);
    setMetaContent('meta[name="twitter:description"]', "content", description);
    if (image) {
      setMetaContent('meta[property="og:image"]', "content", image);
      setMetaContent('meta[name="twitter:image"]', "content", image);
    }

    let scriptTag;
    if (structuredData) {
      scriptTag = document.createElement("script");
      scriptTag.type = "application/ld+json";
      scriptTag.text = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);
    }

    // Restore the generic homepage tags when leaving the page, so a
    // visitor who navigates elsewhere in the SPA doesn't keep this page's
    // title/meta stuck in their tab or in a share sheet.
    return () => {
      document.title = prevTitle;
      if (scriptTag) document.head.removeChild(scriptTag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, image, structuredData ? JSON.stringify(structuredData) : null]);
}
