// Beji hii inatumia logo ya ZPT (public/zpt-logo-icon.png) badala ya ikoni ya kawaida.

// size: "sm" kwa ndani ya kadi (juu ya picha), "lg" kwa ukurasa wa listing (kando ya jina)
export default function TravelersChoiceBadge({ size = "sm" }) {
  const isSmall = size === "sm";
  return (
    <span
      title="Miongoni mwa listings zenye tathmini bora zaidi kutoka kwa wasafiri"
      className={
        "inline-flex items-center gap-1.5 font-semibold rounded-full shadow-sm " +
        (isSmall
          ? "bg-amber-400 text-amber-950 text-[11px] pl-1 pr-2.5 py-1"
          : "bg-amber-400 text-amber-950 text-xs pl-1.5 pr-3 py-1.5")
      }
    >
      <img
        src="/zpt-logo-icon.png"
        alt=""
        className={(isSmall ? "w-4 h-4" : "w-5 h-5") + " rounded-full shrink-0"}
      />
      Chaguo la Wasafiri
    </span>
  );
}
