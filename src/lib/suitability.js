// Central list of "who this suits" options an admin/partner can attach to
// a listing under Good For / Not Ideal For. Same pattern as tags.js - add
// or remove an entry here and the Admin edit form, Add Listing form and
// public card/detail display all update automatically.
import { Heart, Baby, User, Camera, Wallet, Gem, Users, Mountain, Accessibility, Waves } from "lucide-react";

export const SUITABILITY_OPTIONS = [
  { key: "couples", label: "Couples", icon: Heart },
  { key: "families-with-kids", label: "Families with kids", icon: Baby },
  { key: "solo-travelers", label: "Solo travelers", icon: User },
  { key: "photographers", label: "Photographers", icon: Camera },
  { key: "budget-travelers", label: "Budget travelers", icon: Wallet },
  { key: "luxury-travelers", label: "Luxury travelers", icon: Gem },
  { key: "groups", label: "Groups", icon: Users },
  { key: "adventure-seekers", label: "Adventure seekers", icon: Mountain },
  { key: "limited-mobility", label: "Limited mobility", icon: Accessibility },
  { key: "divers-snorkelers", label: "Divers & snorkelers", icon: Waves },
];

export function suitabilityLabel(key) {
  return SUITABILITY_OPTIONS.find((s) => s.key === key)?.label || key;
}

export function suitabilityIcon(key) {
  return SUITABILITY_OPTIONS.find((s) => s.key === key)?.icon || null;
}
