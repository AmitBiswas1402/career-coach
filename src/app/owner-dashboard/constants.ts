export const restaurantTypes = [
  { value: "veg", label: "Vegetarian", hint: "Pure veg menu", dot: "#22c55e" },
  {
    value: "non-veg",
    label: "Non-vegetarian",
    hint: "Chicken, meat, seafood",
    dot: "#ef4444",
  },
  {
    value: "both",
    label: "Mixed",
    hint: "Veg and non-veg dishes",
    dot: "#f97316",
  },
] as const;

export type RestaurantType = (typeof restaurantTypes)[number]["value"];
