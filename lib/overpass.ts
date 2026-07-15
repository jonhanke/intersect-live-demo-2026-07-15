import type { Coords, Restaurant, SearchParams } from "./types";

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

// Parking/transit are fetched slightly beyond the search radius so a
// restaurant at the edge still finds its garage or stop just outside.
const NEARBY_BUFFER_METERS = 300;

function buildQuery(params: SearchParams): string {
  const { lat, lon, radiusMeters, cuisine } = params;
  const cuisineFilter = cuisine
    ? `["cuisine"~"${cuisine.replace(/[^a-z_;, ]/gi, "")}",i]`
    : "";
  const nearbyRadius = radiusMeters + NEARBY_BUFFER_METERS;
  const parkingClause = params.includeParking
    ? `  nwr["amenity"~"^(parking|parking_entrance)$"](around:${nearbyRadius},${lat},${lon});\n`
    : "";
  const transitClause = params.includeTransit
    ? `  node["highway"="bus_stop"](around:${nearbyRadius},${lat},${lon});
  node["railway"~"^(station|halt|tram_stop|subway_entrance)$"](around:${nearbyRadius},${lat},${lon});\n`
    : "";
  // Restaurants (and fast food) as nodes, ways, and relations within the radius.
  return `[out:json][timeout:25];
(
  nwr["amenity"~"restaurant|fast_food"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
${parkingClause}${transitClause});
out center tags;`;
}

function coordsOf(el: OverpassElement): Coords | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function isRestaurant(tags: Record<string, string>): boolean {
  return /(^|;)(restaurant|fast_food)($|;)/.test(tags.amenity ?? "");
}

function isPublicParking(tags: Record<string, string>): boolean {
  if (tags.amenity !== "parking" && tags.amenity !== "parking_entrance") {
    return false;
  }
  // Skip lots the public can't use (private, customers-of-someone-else…).
  return tags.access !== "private" && tags.access !== "no";
}

function isTransitStop(tags: Record<string, string>): boolean {
  return (
    tags.highway === "bus_stop" ||
    /^(station|halt|tram_stop|subway_entrance)$/.test(tags.railway ?? "")
  );
}

function nearestMeters(from: Coords, points: Coords[]): number | null {
  let best: number | null = null;
  for (const p of points) {
    const d = haversineMeters(from, p);
    if (best === null || d < best) best = d;
  }
  return best === null ? null : Math.round(best);
}

function toRestaurant(el: OverpassElement, origin: Coords): Restaurant | null {
  const tags = el.tags ?? {};
  const name = tags.name;
  if (!name) return null;

  const coords = coordsOf(el);
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
    parkingDistanceMeters: null, // filled in below when parking was fetched
    transitDistanceMeters: null, // filled in below when transit was fetched
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

  // One response can mix restaurants, parking, and transit stops — partition
  // by tags (named parking garages must not become wheel candidates).
  const restaurantEls: OverpassElement[] = [];
  const parkingPoints: Coords[] = [];
  const transitPoints: Coords[] = [];
  for (const el of data.elements) {
    const tags = el.tags ?? {};
    if (isRestaurant(tags)) {
      restaurantEls.push(el);
      continue;
    }
    const coords = coordsOf(el);
    if (!coords) continue;
    if (isPublicParking(tags)) parkingPoints.push(coords);
    else if (isTransitStop(tags)) transitPoints.push(coords);
  }

  const restaurants = restaurantEls
    .map((el) => toRestaurant(el, origin))
    .filter((r): r is Restaurant => r !== null)
    .map((r) => ({
      ...r,
      parkingDistanceMeters: params.includeParking
        ? nearestMeters(r.coords, parkingPoints)
        : null,
      transitDistanceMeters: params.includeTransit
        ? nearestMeters(r.coords, transitPoints)
        : null,
    }))
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
