import { Hotel, Waves, UtensilsCrossed, Compass, Landmark, Sparkles, Mountain, Leaf, Ship } from "lucide-react";

export const ICON_MAP = {
  hotels: Hotel,
  beaches: Waves,
  restaurants: UtensilsCrossed,
  attractions: Compass,
  heritage: Landmark,
  experiences: Sparkles,
  caves: Mountain,
  nature: Leaf,
  tours: Ship,
};

export function SectionIcon({ sectionKey, className = "w-6 h-6" }) {
  const Icon = ICON_MAP[sectionKey] || Compass;
  return <Icon className={className} strokeWidth={2} />;
}
