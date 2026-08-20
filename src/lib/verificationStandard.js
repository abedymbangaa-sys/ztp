// Central definition of the "Verified Zanzibar Standard" checks.
// Same pattern as src/lib/tags.js — one source of truth consumed by the
// Admin verification panel and the public VerificationPanel component.
import { BadgeCheck, MapPin, Camera, ShieldCheck, Leaf } from "lucide-react";

export const VERIFICATION_CHECKS = [
  {
    key: "identity_checked",
    label: "Identity & contact checked",
    description:
      "We confirmed this business is real and its phone/WhatsApp details are correct and reachable.",
    icon: BadgeCheck,
  },
  {
    key: "location_checked",
    label: "Location checked",
    description: "We confirmed the map pin and address match where this business actually operates.",
    icon: MapPin,
  },
  {
    key: "photos_checked",
    label: "Photos checked",
    description: "The photos shown are current and represent this specific business, not stock images.",
    icon: Camera,
  },
  {
    key: "safety_checked",
    label: "Safety checked",
    description: "This provider has completed our basic safety checklist for its activity type.",
    icon: ShieldCheck,
  },
  {
    key: "eco_checked",
    label: "Eco & community checked",
    description: "We reviewed evidence of eco-friendly or community-benefiting practices, not just a claim.",
    icon: Leaf,
  },
];

// A listing is "core verified" (drives the same is_verified badge already
// used on cards) once identity, location and photos are all checked.
// Safety and eco are shown as bonus checks where relevant, not required.
export const CORE_CHECK_KEYS = ["identity_checked", "location_checked", "photos_checked"];

export function isCoreVerified(item) {
  if (!item) return false;
  return CORE_CHECK_KEYS.every((key) => item[key]);
}

export function getCompletedChecks(item) {
  if (!item) return [];
  return VERIFICATION_CHECKS.filter((check) => item[check.key]);
}

export function formatVerifiedDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
