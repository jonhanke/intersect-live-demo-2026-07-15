<!-- Thanks for contributing to Wheel of Lunch! 🎡 -->

## What does this PR do?

<!-- One or two sentences. Link the issue it closes, e.g. "Closes #12". -->

**SPEC.md milestone (§7):** <!-- e.g. "4 — Spinning wheel animation + result card", or "n/a" -->

## Type of change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature (v1 scope)
- [ ] 🗺️ Data layer (Overpass / Nominatim / hours parsing)
- [ ] 🎡 Wheel / UI / styling
- [ ] 📖 Docs / spec
- [ ] 🔧 Tooling / chores

## How was this tested?

<!-- This project has no test suite yet, so manual verification matters. -->

- [ ] Ran `npm run dev` and exercised the change at http://localhost:3000
- [ ] Ran `npm run lint` — no new warnings
- [ ] Tested with a real location (geolocation or typed address), not just hardcoded coords
- [ ] Checked mobile viewport (this is a "standing on the sidewalk, hungry" app)

## Screenshots / recording

<!-- Required for UI changes — a spinning wheel deserves a GIF. Delete if not UI. -->

## If this touches Overpass / Nominatim

- [ ] Requests send a descriptive `User-Agent`
- [ ] Results are cached where reasonable — no hammering free community APIs
- [ ] Zero-results and API-timeout paths handled gracefully

## Checklist

- [ ] No API keys or secrets committed (v1 is deliberately keyless)
- [ ] `localStorage` schema changes stay backward-compatible (avoid-repeats memory)
- [ ] If AI-assisted: the agent read the bundled Next.js docs per `AGENTS.md` — this
      repo's Next.js has breaking changes vs. what models assume
