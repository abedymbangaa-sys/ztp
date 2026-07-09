import beaches from "./beaches.json";
import restaurants from "./restaurants.json";
import attractions from "./attractions.json";
import heritage from "./heritage.json";
import experiences from "./experiences.json";
import caves from "./caves.json";
import nature from "./nature.json";
import sectionConfig from "./section-config.json";

export const DATASETS = {
  beaches,
  restaurants,
  attractions,
  heritage,
  experiences,
  caves,
  nature,
};

export const SECTIONS = sectionConfig;

export function getSectionConfig(key) {
  return SECTIONS.find((s) => s.key === key);
}
