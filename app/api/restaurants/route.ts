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
  parkingNearby?: boolean;
  transitNearby?: boolean;
}

const MAX_RADIUS_METERS = 20000;
// "Nearby" = a short walk: across a parking lot, or ~3 minutes to a stop.
const PARKING_NEARBY_METERS = 150;
const TRANSIT_NEARBY_METERS = 250;

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
      includeParking: body.parkingNearby,
      includeTransit: body.transitNearby,
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
  let filtered = body.openNowOnly
    ? withOpenState.filter((r) => r.isOpenNow !== false)
    : withOpenState;

  // Distance-based, so no unknown-value dilemma: either a mapped public
  // parking lot / transit stop is within walking range or it isn't.
  if (body.parkingNearby) {
    filtered = filtered.filter(
      (r) =>
        r.parkingDistanceMeters !== null &&
        r.parkingDistanceMeters <= PARKING_NEARBY_METERS,
    );
  }
  if (body.transitNearby) {
    filtered = filtered.filter(
      (r) =>
        r.transitDistanceMeters !== null &&
        r.transitDistanceMeters <= TRANSIT_NEARBY_METERS,
    );
  }

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
