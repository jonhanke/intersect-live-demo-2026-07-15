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
  /** Tier-1 description synthesized from OSM tags (issue #4); null when the
   *  tags are too sparse to say anything useful. */
  description: string | null;
  /** Raw OSM wiki refs ("en:Title" / "Q…"); when present the client can ask
   *  GET /api/description for a richer Wikipedia blurb after the spin. */
  wikipedia: string | null;
  wikidata: string | null;
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
