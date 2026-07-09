// Zanzibar Paradise Tours — logo mark (dhow silhouette) + wordmark.
// Monoline style to match the lucide-react icons used elsewhere in the navbar.

export function LogoMark({ className = "w-6 h-6", strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* mast */}
      <path d="M12 4v13" />
      {/* sail */}
      <path d="M12 6.2 18.5 15H12z" />
      {/* hull */}
      <path d="M3.5 17c2.8 1.7 5.6 2.3 8.5 2.3s5.7-.6 8.5-2.3" />
    </svg>
  );
}

export default function Logo({
  iconClassName = "w-6 h-6 text-teal-700 shrink-0",
  textClassName = "font-bold text-sm sm:text-lg text-teal-800 whitespace-nowrap",
  showText = true,
}) {
  return (
    <>
      <LogoMark className={iconClassName} />
      {showText && <span className={textClassName}>Zanzibar Paradise Tours</span>}
    </>
  );
}
