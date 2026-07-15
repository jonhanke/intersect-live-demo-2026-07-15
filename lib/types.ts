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
