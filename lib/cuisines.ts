// Common OSM cuisine values, matched case-insensitively by the API.
export const CUISINES: { value: string; label: string }[] = [
  { value: "", label: "Any cuisine" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burgers" },
  { value: "mexican", label: "Mexican" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "sushi", label: "Sushi" },
  { value: "italian", label: "Italian" },
  { value: "indian", label: "Indian" },
  { value: "thai", label: "Thai" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "korean", label: "Korean" },
  { value: "american", label: "American" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "sandwich", label: "Sandwiches" },
  { value: "coffee_shop", label: "Coffee & cafe" },
];

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
