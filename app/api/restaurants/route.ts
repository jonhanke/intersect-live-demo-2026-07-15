import { NextResponse } from "next/server";
import { fetchRestaurants } from "@/lib/overpass";
import { geocodeAddress } from "@/lib/geocode";
import { isOpenNow } from "@/lib/openNow";
import type { Restaurant } from "@/lib/types";

interface RequestBody {
  lat?: number;
  lon?: number;
  address?: string;
  radiusMeters?: number;
  cuisine?: string;
  openNowOnly?: boolean;
}

const MAX_RADIUS_METERS = 20000;

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const radiusMeters = clampRadius(body.radiusMeters);

  // Resolve an origin: explicit coords win; otherwise geocode the address.
  let lat = body.lat;
  let lon = body.lon;
  let originLabel: string | null = null;

  if ((lat == null || lon == null) && body.address) {
    try {
      const geocoded = await geocodeAddress(body.address);
      if (!geocoded) {
        return NextResponse.json(
          { error: "Could not find that address" },
          { status: 404 },
        );
      }
      lat = geocoded.lat;
      lon = geocoded.lon;
      originLabel = geocoded.displayName;
    } catch {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }
  }

  if (lat == null || lon == null) {
    return NextResponse.json(
      { error: "Provide either lat/lon or an address" },
      { status: 400 },
    );
  }

  let restaurants: Restaurant[];
  try {
    restaurants = await fetchRestaurants({
      lat,
      lon,
      radiusMeters,
      cuisine: body.cuisine,
    });
  } catch (err) {
    console.error("[restaurants] overpass error:", err);
    return NextResponse.json(
      { error: "Restaurant lookup failed. Try again in a moment." },
      { status: 502 },
    );
  }

  const now = new Date();
  const withOpenState = restaurants.map((r) => ({
    ...r,
    isOpenNow: isOpenNow(r.openingHours, r.coords, now),
  }));

  // openNowOnly excludes places we KNOW are closed; unknown-hours places stay,
  // otherwise sparse OSM hours data would hide most results.
  const filtered = body.openNowOnly
    ? withOpenState.filter((r) => r.isOpenNow !== false)
    : withOpenState;

  return NextResponse.json({
    origin: { lat, lon, label: originLabel },
    radiusMeters,
    count: filtered.length,
    restaurants: filtered,
  });
}

function clampRadius(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1500;
  return Math.min(Math.max(Math.round(value), 100), MAX_RADIUS_METERS);
}
