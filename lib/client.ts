import type { Restaurant } from "./types";

export interface SearchRequest {
  lat?: number;
  lon?: number;
  address?: string;
  radiusMeters: number;
  cuisine?: string;
  openNowOnly?: boolean;
}

export interface SearchResponse {
  origin: { lat: number; lon: number; label: string | null };
  radiusMeters: number;
  count: number;
  restaurants: Restaurant[];
}

export async function searchRestaurants(
  req: SearchRequest,
): Promise<SearchResponse> {
  const res = await fetch("/api/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong");
  }
  return data as SearchResponse;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation isn't supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}
