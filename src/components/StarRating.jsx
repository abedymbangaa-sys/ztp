export default function StarRating({ rating, size = "w-4 h-4", interactive = false, onChange }) {
  // Rating inaweza kuwa desimali (mf. wastani 4.3) - tunaonyesha nusu-doti
  // kama TripAdvisor inavyofanya, badala ya kuzunguka tu kwenye namba nzima.
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const hasHalf = rounded % 1 !== 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const isFull = n <= full;
        const isHalf = !isFull && n === full + 1 && hasHalf;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(n)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            aria-label={`${n} out of 5 stars`}
          >
            <span
              className={`${size} rounded-full inline-block border-2 ${
                isFull || isHalf ? "border-teal-700" : "border-slate-300"
              }`}
              style={{
                background: isFull
                  ? "#0f766e"
                  : isHalf
                  ? "linear-gradient(90deg, #0f766e 50%, transparent 50%)"
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
