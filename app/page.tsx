"use client";

import { useState } from "react";
import { Wheel } from "@/components/Wheel";
import { searchRestaurants, getCurrentPosition } from "@/lib/client";
import { CUISINES, formatDistance } from "@/lib/cuisines";
import { addRecentPick, chooseAvoidingRecent } from "@/lib/recent";
import type { Restaurant } from "@/lib/types";

const WHEEL_SIZE = 12;

function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(1500);
  const [cuisine, setCuisine] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<Restaurant[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Restaurant | null>(null);

  function markDirty() {
    setResult(null);
  }

  async function useMyLocation() {
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setAddress("");
      markDirty();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't get your location");
    }
  }

  async function spin() {
    if (spinning) return;
    setError(null);
    setResult(null);

    if (!coords && !address.trim()) {
      setError("Set your location first — use my location or type an address.");
      return;
    }

    setLoading(true);
    try {
      const data = await searchRestaurants({
        lat: coords?.lat,
        lon: coords?.lon,
        address: coords ? undefined : address.trim(),
        radiusMeters,
        cuisine: cuisine || undefined,
        openNowOnly,
      });

      if (!data.restaurants.length) {
        setError("No restaurants found. Try a bigger radius or a different filter.");
        setLoading(false);
        return;
      }

      const wheelItems = sample(data.restaurants, WHEEL_SIZE);
      const chosen = chooseAvoidingRecent(wheelItems) ?? wheelItems[0];
      const idx = wheelItems.indexOf(chosen);

      setPool(wheelItems);
      setTargetIndex(idx);
      setSpinning(true);
      setSpinToken((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onSettled() {
    setSpinning(false);
    if (targetIndex != null && pool[targetIndex]) {
      const picked = pool[targetIndex];
      setResult(picked);
      addRecentPick(picked.id);
    }
  }

  const locationLabel = coords
    ? `📍 Using your location (${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)})`
    : null;

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">🍴 Wheel of Lunch</h1>
        <p className="mt-1 text-sm opacity-70">
          Can&apos;t decide where to eat? Spin for a random nearby spot.
        </p>
      </header>

      <section className="w-full space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setCoords(null);
                markDirty();
              }}
              placeholder="Enter an address or place…"
              className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20"
            />
            <button
              onClick={useMyLocation}
              className="whitespace-nowrap rounded-lg border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Use my location
            </button>
          </div>
          {locationLabel && <p className="text-xs opacity-70">{locationLabel}</p>}
        </div>

        <div className="space-y-1">
          <label className="flex justify-between text-sm font-medium">
            <span>Distance</span>
            <span className="opacity-70">{formatDistance(radiusMeters)}</span>
          </label>
          <input
            type="range"
            min={300}
            max={5000}
            step={100}
            value={radiusMeters}
            onChange={(e) => {
              setRadiusMeters(Number(e.target.value));
              markDirty();
            }}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cuisine}
            onChange={(e) => {
              setCuisine(e.target.value);
              markDirty();
            }}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/20"
          >
            {CUISINES.map((c) => (
              <option key={c.value} value={c.value} className="text-black">
                {c.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openNowOnly}
              onChange={(e) => {
                setOpenNowOnly(e.target.checked);
                markDirty();
              }}
            />
            Open now
          </label>
        </div>
      </section>

      <Wheel
        labels={pool.length ? pool.map((r) => r.name) : ["Spin!", "to", "find", "lunch", "near", "you"]}
        targetIndex={targetIndex}
        spinToken={spinToken}
        spinning={spinning}
        onSettled={onSettled}
      />

      <button
        onClick={spin}
        disabled={loading || spinning}
        className="rounded-full bg-red-600 px-10 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Finding…" : spinning ? "Spinning…" : "Spin the wheel"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      {result && !spinning && (
        <section className="w-full rounded-2xl border-2 border-red-500 p-5 text-center">
          <p className="text-xs uppercase tracking-wide opacity-60">Today&apos;s pick</p>
          <h2 className="mt-1 text-2xl font-bold">{result.name}</h2>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
            {result.cuisine.map((c) => (
              <span key={c} className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
                {c}
              </span>
            ))}
            <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
              {formatDistance(result.distanceMeters)} away
            </span>
            {result.isOpenNow === true && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">Open now</span>
            )}
            {result.isOpenNow === null && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800">Hours unknown</span>
            )}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${result.coords.lat},${result.coords.lon}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get directions
            </a>
            <button
              onClick={spin}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Spin again
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
