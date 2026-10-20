// Day-by-day content for known itinerary guides, keyed by slug. There is
// no day-by-day column in itinerary_guides yet, so this is the source of
// truth for the online view for now. Guides that don't have an entry here
// still get a working page - just without the day list.
//
// Kept as a plain JS module (no JSX, no React imports) on purpose: it is
// imported BOTH by src/pages/ItineraryDetail.jsx and by
// scripts/prerender.mjs, so the static HTML that search engines see and
// the page real visitors see always contain the exact same days.
export const DAY_PLANS = {
  "5-days-in-zanzibar": [
    {
      day: 1,
      title: "Stone Town",
      area: "Stone Town",
      activities:
        "Guided walk through Stone Town's historic streets, old doors and waterfront, then Forodhani Night Market at sunset for Zanzibar pizza, urojo, mishkaki and fresh seafood",
      links: [
        { label: "Heritage sites", to: "/heritage" },
        { label: "Tours", to: "/tours" },
      ],
    },
    {
      day: 2,
      title: "Safari Blue",
      area: "Menai Bay, South Coast",
      activities:
        "Full-day traditional dhow trip around Menai Bay - visit a sandbank, snorkel in clear water and enjoy a fresh seafood lunch",
      links: [
        { label: "Tours", to: "/tours" },
        { label: "South Coast", to: "/area/south" },
      ],
    },
    {
      day: 3,
      title: "Jozani Forest",
      area: "Jozani Forest & Spice Farm",
      activities:
        "Guided walk through Jozani Forest to see the red colobus monkey, then continue to a spice farm to learn about Zanzibar's famous cloves, cinnamon and tropical fruits",
      links: [
        { label: "Nature", to: "/nature" },
        { label: "Tours", to: "/tours" },
      ],
    },
    {
      day: 4,
      title: "Nungwi & Kendwa",
      area: "North Coast",
      activities:
        "A day on the north coast - clear water, beach time, a turtle aquarium visit and a sunset dhow cruise",
      links: [
        { label: "Hotels", to: "/hotels" },
        { label: "Beaches", to: "/beaches" },
      ],
    },
    {
      day: 5,
      title: "Paje & Departure",
      area: "Paje, East Coast",
      activities:
        "A slow morning on Paje Beach with a lagoon activity if the tide allows, then departure with enough time for your airport or ferry transfer",
      links: [
        { label: "Beaches", to: "/beaches" },
        { label: "Things to Do", to: "/things-to-do" },
      ],
    },
  ],
};
