# Wheel of Lunch — Plan & Spec

A small web app that answers the eternal question: **"Where should we go for lunch?"**
Tell it where you are and how far you're willing to walk/drive, and it spins a wheel to
randomly pick a nearby restaurant for you. A spiritual successor to the much-missed
[wheeloflunch.com](https://wheeloflunch.com).

> Status: **in active development** · Group project · Contributions welcome

---

## 1. Goal

Reduce lunch-decision paralysis to a single button press. The user should be able to go
from "I'm hungry" to "let's go here" in under 10 seconds, with a little bit of delight
along the way (the spinning wheel).

## 2. Core user story

> As a hungry person, I want to enter my location and a search radius, press **Spin**,
> and get a single randomly-chosen restaurant nearby that is open now — so I can stop
> deliberating and go eat.

## 3. Features

### v1 (this build)
- **Location input** — one-tap browser geolocation, with a manual address box as fallback.
- **Radius control** — a slider (e.g. 500 m → 5 km) to set how far to search.
- **Cuisine filter** — optionally narrow to a cuisine (pizza, sushi, tacos, …) before spinning.
- **Open-now filter** — only suggest places currently open (where hours data exists).
- **Spinning wheel** — the signature animation; it spins and lands on the chosen place.
- **Result card** — name, cuisine, distance, and a "Get directions" link (opens a map).
- **Avoid recent repeats** — remembers the last few picks (localStorage) so the wheel
  doesn't keep landing on the same restaurant.

### Backlog / nice-to-have (post-v1)
- Photos, ratings, and price level (would require Google Places or Foursquare data).
- "Re-spin" and "veto this place" buttons.
- Shareable result links for coordinating with a group.
- Group mode: everyone spins, majority wins.
- Dietary filters (vegetarian, vegan, gluten-free).
- Save favorites / history.

## 4. Data sources (all free, no API key for v1)

| Purpose            | Service                          | Notes                                            |
|--------------------|----------------------------------|--------------------------------------------------|
| Nearby restaurants | **OpenStreetMap Overpass API**   | Query `amenity=restaurant` within radius.        |
| Address → coords   | **Nominatim** (OSM geocoder)     | For the manual address-entry fallback.           |
| Opening hours      | OSM `opening_hours` tag          | Parsed with the `opening_hours` npm package.     |
| Directions         | Native map deep-link             | `https://www.openstreetmap.org/directions` / maps|

**Why OSM to start:** zero setup, no billing, works out of the box for a demo. The
trade-off is no photos/ratings and patchy hours coverage. We can upgrade the data layer
to Google Places or Foursquare later behind the same API without changing the UI.

> Be a good API citizen: Overpass and Nominatim are free community resources. Send a
> descriptive `User-Agent`, cache where reasonable, and don't hammer them.

## 5. Architecture

Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.

```
Browser (client component)
  ├─ get location (geolocation API) or type an address
  ├─ POST /api/restaurants  { lat, lon, radius, cuisine }
  │     └─ server route → Overpass API → normalize → filter open-now → return list
  ├─ spin the wheel over the returned list (client-side random pick)
  └─ show result card + directions link
```

- **`/api/restaurants`** (server route): geocodes if needed, queries Overpass, normalizes
  results, applies the open-now filter, returns a clean JSON list. Keeping this on the
  server avoids CORS issues and lets us swap data providers later.
- **Client**: owns the controls, the wheel animation, random selection, and the
  avoid-repeats memory (localStorage).

## 6. Tech stack

- **Framework:** Next.js 15 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **External APIs:** Overpass, Nominatim (OpenStreetMap)

## 7. Milestones

1. ✅ Scaffold Next.js app.
2. ⬜ Restaurant search API (Overpass + Nominatim geocoding).
3. ⬜ Main UI + controls (location, radius, cuisine, open-now).
4. ⬜ Spinning wheel animation + result card.
5. ⬜ Open-now filter + avoid-repeats memory.
6. ⬜ End-to-end testing, then deploy to Vercel.

## 8. Open questions

- Radius units — miles or kilometers by default? (Detect from locale?)
- How many candidates should the wheel show at once for the best "spin" feel? (~8–12?)
- Fallback behavior when OSM has no hours data — include the place or hide it?
- Do we want walking vs driving distance, or is straight-line distance fine for v1?

## 9. Getting started (contributors)

```bash
npm install
npm run dev
# open http://localhost:3000
```

Pick an unchecked milestone above, branch off `main`, and open a PR. See the issues tab
for scoped-out tasks.
