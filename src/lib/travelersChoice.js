// Kigezo cha "Chaguo la Wasafiri" (Travelers' Choice) - kinatumia data ya
// reviews ambayo tayari inahesabiwa client-side (item.review_avg / review_count),
// hakuna column mpya ya database inayohitajika.
//
// Badilisha vigezo hivi hapa pekee endapo utataka kubadilisha unyeti wa beji.
export const TRAVELERS_CHOICE_MIN_AVG = 4.5;
export const TRAVELERS_CHOICE_MIN_REVIEWS = 5;

export function isTravelersChoice(item) {
  return (
    typeof item?.review_avg === "number" &&
    item.review_avg >= TRAVELERS_CHOICE_MIN_AVG &&
    (item?.review_count || 0) >= TRAVELERS_CHOICE_MIN_REVIEWS
  );
}
