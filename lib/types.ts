export interface Coords {
  lat: number;
  lon: number;
}

/** Normalized OSM `wheelchair` tag: yes = fully accessible, limited = partial
 *  (e.g. accessible entrance but not toilets), no = not accessible. */
export type WheelchairAccess = "yes" | "limited" | "no";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  coords: Coords;
  distanceMeters: number;
  openingHours: string | null;
  isOpenNow: boolean | null;
  wheelchair: WheelchairAccess | null;
  address: string | null;
  website: string | null;
}

export interface SearchParams {
  lat: number;
  lon: number;
  radiusMeters: number;
  cuisine?: string;
  openNowOnly?: boolean;
  wheelchairOnly?: boolean;
}
