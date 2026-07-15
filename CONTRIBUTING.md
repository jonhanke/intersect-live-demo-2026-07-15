# Contributing to Wheel of Lunch 🎡

Thanks for helping cure lunch-decision paralysis! This is a small group project — the
whole plan lives in [SPEC.md](SPEC.md). Read it first; it's short.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

> ⚠️ **Before writing code** (especially with AI assistance): this repo's Next.js
> version has breaking changes vs. what most tools and models assume. Per
> [AGENTS.md](AGENTS.md), check the bundled docs in `node_modules/next/dist/docs/`
> for the APIs you're touching.

## Finding something to work on

1. Check the [issues tab](../../issues) — anything labeled
   [`good first issue`](../../labels/good%20first%20issue) or
   [`help wanted`](../../labels/help%20wanted) is up for grabs.
2. Or pick an unchecked milestone from [SPEC.md §7](SPEC.md#7-milestones) and open a
   **🔨 Task** issue so others know you're on it.
3. Comment on the issue to claim it, branch off `main`, open a PR when ready.

## Filing issues

Use the issue forms — there are separate templates for **app bugs**, **restaurant data
problems**, **feature requests**, and **tasks**. One thing to know: restaurant data
(places, hours, cuisine) comes from **OpenStreetMap**. If a restaurant is missing or
wrong, the best fix is usually [editing OSM itself](https://www.openstreetmap.org/fixthemap);
file the `osm-data` template here anyway so we can spot patterns our code should handle.

## Pull requests

- Keep PRs scoped to one milestone/issue — small and reviewable beats big and complete.
- Fill in the PR template, including **how you tested** (there's no test suite yet, so
  manual verification at `localhost:3000` matters) and a screenshot/GIF for UI changes.
- Run `npm run lint` before pushing.
- **Be a good API citizen**: anything touching Overpass or Nominatim must send a
  descriptive `User-Agent`, cache where reasonable, and degrade gracefully. These are
  free community services — don't hammer them.
- No API keys or secrets: v1 is deliberately keyless (see SPEC.md §4).

## Labels

Labels are defined in [`.github/labels.yml`](.github/labels.yml) (the source of truth —
edit there, then sync with the `gh` snippet in that file's header).

| Label | Use for |
|---|---|
| `area: wheel` / `area: ui` / `area: api` / `area: data` / `area: geolocation` | Which part of the architecture (SPEC.md §5) an issue touches |
| `osm-data` | Upstream OpenStreetMap data problems, not our code |
| `v1` | Must land for the v1 launch |
| `backlog` | Post-v1 nice-to-haves from SPEC.md §3 |
| `accessibility` | A11y — e.g. reduced-motion support for the wheel |
| `needs triage` | Auto-applied to new issues awaiting a first look |

## Open questions

SPEC.md §8 lists unresolved product decisions (radius units, wheel size, missing-hours
behavior). If your work bumps into one, raise it on the issue rather than silently
deciding in code.
