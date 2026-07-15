const KEY = "wol:recent-picks";
const MAX_RECENT = 5;

export function getRecentPicks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentPick(id: string): void {
  if (typeof window === "undefined") return;
  const next = [id, ...getRecentPicks().filter((x) => x !== id)].slice(
    0,
    MAX_RECENT,
  );
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// Pick a random restaurant id, avoiding recent ones unless that would leave
// nothing to choose from.
export function chooseAvoidingRecent<T extends { id: string }>(
  items: T[],
): T | null {
  if (!items.length) return null;
  const recent = new Set(getRecentPicks());
  const fresh = items.filter((r) => !recent.has(r.id));
  const pool = fresh.length ? fresh : items;
  return pool[Math.floor(Math.random() * pool.length)];
}
