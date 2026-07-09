// Central list of tags/amenities businesses can attach to their listing.
// Add/remove entries here and every part of the app (Partner form, Admin
// edit form, public filter chips) updates automatically - no other code
// changes needed.
import { Moon, Leaf, Users, Waves, VolumeX } from "lucide-react";

export const TAG_OPTIONS = [
  { key: "halal-friendly", label: "Halal-Friendly", icon: Moon },
  { key: "eco-certified", label: "Eco-Certified", icon: Leaf },
  { key: "family-friendly", label: "Family-Friendly", icon: Users },
  { key: "beachfront", label: "Beachfront", icon: Waves },
  { key: "quiet-private", label: "Quiet & Private", icon: VolumeX },
];

export function tagLabel(key) {
  return TAG_OPTIONS.find((t) => t.key === key)?.label || key;
}

export function tagIcon(key) {
  return TAG_OPTIONS.find((t) => t.key === key)?.icon || null;
}
