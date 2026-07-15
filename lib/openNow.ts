import OpeningHours from "opening_hours";
import type { Coords } from "./types";

// Evaluate an OSM opening_hours string. Returns null when the value is missing
// or can't be parsed (the syntax is notoriously varied), so callers can decide
// how to treat "unknown".
export function isOpenNow(
  value: string | null,
  coords: Coords,
  now: Date,
): boolean | null {
  if (!value) return null;
  void coords; // reserved for future sunset/holiday-aware evaluation
  try {
    const oh = new OpeningHours(value);
    return oh.getState(now);
  } catch {
    return null;
  }
}
