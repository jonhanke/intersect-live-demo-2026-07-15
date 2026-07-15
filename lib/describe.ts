// Tier-1 description synthesis (issue #4): compose a human sentence from OSM
// tags already in the Overpass response — always available, zero extra calls.

function humanizeCuisine(value: string): string {
  return value.trim().replace(/_/g, " ");
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function synthesizeDescription(
  tags: Record<string, string>,
): string | null {
  // A mapper-written freeform description beats anything we can compose.
  const osmDescription = tags.description?.trim();
  if (osmDescription) return osmDescription;

  const kind = tags.amenity === "fast_food" ? "fast-food spot" : "restaurant";
  const cuisines = (tags.cuisine ?? "")
    .split(";")
    .map(humanizeCuisine)
    .filter(Boolean);

  const features: string[] = [];
  if (tags.outdoor_seating === "yes") features.push("outdoor seating");
  if (tags["diet:vegan"] === "only") {
    features.push("a fully vegan menu");
  } else {
    if (tags["diet:vegetarian"] === "yes" || tags["diet:vegetarian"] === "only") {
      features.push("vegetarian options");
    }
    if (tags["diet:vegan"] === "yes") features.push("vegan options");
  }
  if (tags.takeaway === "yes" || tags.takeaway === "only") {
    features.push("takeaway");
  }
  if (tags.delivery === "yes") features.push("delivery");
  if (tags.wheelchair === "yes" || tags.wheelchair === "designated") {
    features.push("wheelchair access");
  }

  // "Restaurant." alone tells the user nothing — let the UI show its fallback.
  if (!cuisines.length && !features.length) return null;

  const head = cuisines.length
    ? `${joinAnd(cuisines)} ${kind}`
    : kind;
  const sentence = features.length
    ? `${head} with ${joinAnd(features)}`
    : head;
  return `${capitalize(sentence)}.`;
}
