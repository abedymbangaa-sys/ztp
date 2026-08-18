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
