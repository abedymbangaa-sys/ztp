import { Star } from "lucide-react";

export default function StarRating({ rating, size = "w-4 h-4", interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={size}
            fill={n <= rating ? "#f59e0b" : "none"}
            stroke={n <= rating ? "#f59e0b" : "#cbd5e1"}
          />
        </button>
      ))}
    </div>
  );
}
