export interface Coords {
  lat: number;
  lon: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  coords: Coords;
  distanceMeters: number;
  openingHours: string | null;
  isOpenNow: boolean | null;
  /** Straight-line distance to the nearest public parking / transit stop.
   *  null when not requested (see SearchParams) or none found nearby. */
  parkingDistanceMeters: number | null;
  transitDistanceMeters: number | null;
  address: string | null;
  website: string | null;
}

export interface SearchParams {
  lat: number;
  lon: number;
  radiusMeters: number;
  cuisine?: string;
  openNowOnly?: boolean;
  /** Also fetch parking / transit stops so the distance fields get filled.
   *  Off by default to keep Overpass responses small. */
  includeParking?: boolean;
  includeTransit?: boolean;
}
