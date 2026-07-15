import type { Coords } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Nominatim asks for a descriptive User-Agent identifying the app.
const USER_AGENT = "WheelOfLunch/0.1 (https://github.com/jonhanke/intersect-live-demo-2026-07-15)";

export interface GeocodeResult extends Coords {
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    // Nominatim results are stable; cache briefly to be a good citizen.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  if (!data.length) return null;

  const [first] = data;
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name,
  };
}
