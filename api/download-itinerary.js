// Same-origin download route for free itinerary PDFs.
//
// Why this exists: the `download` attribute on an <a> tag is ignored by
// browsers for cross-origin URLs (e.g. a Supabase Storage URL on a
// different domain, or a Google Drive link). Streaming the file through
// our own domain here, with an explicit Content-Disposition header, makes
// the download work reliably on Chrome Android, Safari iOS and desktop -
// and lets us control the exact filename the visitor sees.
//
// GET /api/download-itinerary?id=<itinerary_guides.id>

const SUPABASE_URL = "https://phctpwswosfwjmxhidyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HEy4rqVBXuH_qRBHEwYSdg_wW-677OT";

// The site currently has one free guide ("5 Days in Zanzibar"). Once more
// guides exist, this can be derived per-guide (e.g. from a slug column)
// instead of a single fixed name.
const FIXED_PDF_FILENAME = "zanzibar-5-day-itinerary.pdf";

// Hosts a guide's pdf_url may point to (our Supabase Storage + Google Drive).
const ALLOWED_PDF_HOSTS = [
  "phctpwswosfwjmxhidyq.supabase.co",
  "drive.google.com",
  "drive.usercontent.google.com",
  "docs.google.com",
];

function toDirectDownloadUrl(rawUrl) {
  // Normalizes a Google Drive "share" link into its direct-download form.
  // A Drive *preview* page is never a valid final download link - see
  // the codebase notes on this. This still won't bypass Drive's virus-scan
  // interstitial for large files; if that becomes an issue, the fix is to
  // move the PDF into Supabase Storage (public bucket) instead.
  const driveMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return rawUrl;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: "Missing itinerary id." });
    return;
  }

  try {
    const guideRes = await fetch(
      `${SUPABASE_URL}/rest/v1/itinerary_guides?id=eq.${encodeURIComponent(
        id
      )}&status=eq.published&select=id,title,pdf_url`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!guideRes.ok) {
      res.status(502).json({ error: "Could not reach the itinerary database." });
      return;
    }

    const rows = await guideRes.json();
    const guide = rows && rows[0];

    if (!guide || !guide.pdf_url) {
      res.status(404).json({ error: "This PDF is not available right now." });
      return;
    }

    const sourceUrl = toDirectDownloadUrl(guide.pdf_url);

    // Only fetch from hosts we expect. Without this, anyone who could edit
    // itinerary_guides.pdf_url could make our domain download and serve any
    // URL (including internal/private ones).
    let sourceHost = "";
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:") throw new Error("not https");
      sourceHost = parsed.hostname;
    } catch {
      res.status(400).json({ error: "Invalid PDF source." });
      return;
    }
    if (!ALLOWED_PDF_HOSTS.some((h) => sourceHost === h || sourceHost.endsWith("." + h))) {
      res.status(400).json({ error: "PDF source is not allowed." });
      return;
    }
    const pdfRes = await fetch(sourceUrl);

    if (!pdfRes.ok) {
      res.status(502).json({ error: "The PDF file could not be downloaded from its source." });
      return;
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${FIXED_PDF_FILENAME}"`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Unexpected error while preparing the download." });
  }
}
