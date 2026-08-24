// src/components/StampSeal.jsx
//
// Muhuri halisi wa "passport stamp" — duara mbili (double ring) zikiwa
// zimezungushwa kidogo (kama muhuri wa kweli wa uhamiaji), na alama rahisi
// ya mstari (si emoji) ndani. Rangi inatokana na stamp husika.
//
// Component hii pekee ndiyo mpya; haigusi save logic wala GenericCard.

const ICON_PATHS = {
  heritage: (
    <>
      <path d="M4 10 L12 4 L20 10" />
      <path d="M6 10V19M12 10V19M18 10V19" />
      <path d="M4 19H20" />
    </>
  ),
  beach: (
    <>
      <path d="M3 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
    </>
  ),
  food: (
    <>
      <path d="M8 4v6a2 2 0 0 0 4 0V4" />
      <path d="M10 10v10" />
      <path d="M16 4c-1.5 0-2 2-2 4s.5 4 2 4v8" />
    </>
  ),
  nature: (
    <>
      <path d="M12 4c-6 0-8 5-8 9 0 4 4 6 8 6s8-2 8-6c0-4-2-9-8-9Z" />
      <path d="M12 5v14" />
    </>
  ),
  local: <path d="M12 3l2 6.5L21 12l-7 2.5L12 21l-2-6.5L3 12l7-2.5Z" />,
};

export default function StampSeal({ stampKey, color, size = 22 }) {
  const icon = ICON_PATHS[stampKey] || ICON_PATHS.local;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: "rotate(-8deg)", flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="9" strokeWidth="0.7" strokeDasharray="1.4 1.6" />
      {icon}
    </svg>
  );
}
