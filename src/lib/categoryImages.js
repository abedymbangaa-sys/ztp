// Maps each category key (from the "categories" table in Supabase) to one
// representative photo already in public/images/, for the visual
// "Explore by Category" section on the homepage. Categories are managed by
// the admin and can grow over time, so any key not listed here falls back
// to DEFAULT_CATEGORY_IMAGE rather than breaking the layout.
export const CATEGORY_IMAGES = {
  hotels: "/images/hotels/zanzibar-serena.jpeg",
  beaches: "/images/beaches/nungwi-beach.jpeg",
  restaurants: "/images/restaurants/the-rock-restaurant.jpeg",
  attractions: "/images/attractions/forodhani-gardens.jpeg",
  heritage: "/images/heritage/stone-town.jpeg",
  experiences: "/images/experiences/nakupenda-sandbank-tour.jpeg",
  caves: "/images/caves/kuza-cave.jpeg",
  nature: "/images/nature/red-colobus-monkey-experience.jpeg",
  tours: "/images/tours/safari-blue.jpeg",
};

export const DEFAULT_CATEGORY_IMAGE = "/images/beaches/nungwi-beach.jpeg";

export function getCategoryImage(key) {
  return CATEGORY_IMAGES[key] || DEFAULT_CATEGORY_IMAGE;
}
