export interface Coords {
  lat: number;
  lon: number;
}

/** Normalized OSM `reservation` tag. Coverage is sparse (~5% in dense
 *  cities), so this drives display badges only — never a filter. */
export type ReservationPolicy =
  | "yes"
  | "no"
  | "required"
  | "recommended"
  | "members_only";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  coords: Coords;
  distanceMeters: number;
  openingHours: string | null;
  isOpenNow: boolean | null;
  reservation: ReservationPolicy | null;
  /** Total seats from the OSM `capacity` tag; very sparse (~2%), display-only. */
  capacitySeats: number | null;
  address: string | null;
  website: string | null;
}

export interface SearchParams {
  lat: number;
  lon: number;
  radiusMeters: number;
  cuisine?: string;
  openNowOnly?: boolean;
}
