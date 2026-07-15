import type { Coords, Restaurant, SearchParams, WheelchairAccess } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Overpass rejects requests without a descriptive User-Agent (HTTP 406).
const USER_AGENT = "WheelOfLunch/0.1 (https://github.com/jonhanke/intersect-live-demo-2026-07-15)";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineMeters(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildQuery(params: SearchParams): string {
  const { lat, lon, radiusMeters, cuisine } = params;
  const cuisineFilter = cuisine
    ? `["cuisine"~"${cuisine.replace(/[^a-z_;, ]/gi, "")}",i]`
    : "";
  // Restaurants (and fast food) as nodes, ways, and relations within the radius.
  return `[out:json][timeout:25];
(
  nwr["amenity"~"restaurant|fast_food"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
);
out center tags;`;
}

function normalizeWheelchair(value: string | undefined): WheelchairAccess | null {
  // OSM also uses "designated" for purpose-built accessible places.
  if (value === "yes" || value === "designated") return "yes";
  if (value === "limited") return "limited";
  if (value === "no") return "no";
  return null;
}

function toRestaurant(el: OverpassElement, origin: Coords): Restaurant | null {
  const tags = el.tags ?? {};
  const name = tags.name;
  if (!name) return null;

  const coords: Coords | null =
    el.lat != null && el.lon != null
      ? { lat: el.lat, lon: el.lon }
      : el.center
        ? { lat: el.center.lat, lon: el.center.lon }
        : null;
  if (!coords) return null;

  const cuisine = tags.cuisine
    ? tags.cuisine.split(";").map((c) => c.trim()).filter(Boolean)
    : [];

  const addressParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
  ].filter(Boolean);

  return {
    id: `${el.type}/${el.id}`,
    name,
    cuisine,
    coords,
    distanceMeters: Math.round(haversineMeters(origin, coords)),
    openingHours: tags.opening_hours ?? null,
    isOpenNow: null, // filled in later by the open-now filter
    wheelchair: normalizeWheelchair(tags.wheelchair),
    address: addressParts.length ? addressParts.join(" ") : null,
    website: tags.website ?? tags["contact:website"] ?? null,
  };
}

export async function fetchRestaurants(params: SearchParams): Promise<Restaurant[]> {
  const query = buildQuery(params);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ data: query }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Overpass query failed (${res.status})`);
  }

  const data = (await res.json()) as { elements: OverpassElement[] };
  const origin: Coords = { lat: params.lat, lon: params.lon };

  const restaurants = data.elements
    .map((el) => toRestaurant(el, origin))
    .filter((r): r is Restaurant => r !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  // De-duplicate by name+rounded-location (OSM sometimes has node+way for one place).
  const seen = new Set<string>();
  return restaurants.filter((r) => {
    const key = `${r.name}@${r.coords.lat.toFixed(4)},${r.coords.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
