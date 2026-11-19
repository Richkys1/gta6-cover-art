# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Richkys1/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Richkys1/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio — turn your photo and a caption into GTA-style multi-panel cover art and export it as a PNG. Five panel layouts (Hero Split, Quad, Triptych, Banner, Full Bleed), per-panel crop/pan/zoom with one photo or several, bold condensed-capitals lettering, four canvas-drawn colour grades (Vice Sunset, Neon Nights, Palm Gold, Noir) with procedural palms, sun, skyline and halftone decor, and one-click export at 1080×1080, 1080×1350 and 1920×1080. Static files, works offline, photos never leave your machine. An original design — no Rockstar Games logo, artwork, character or font is used.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static server (`python3 -m http.server` from `app/`). Add a photo (or use the two bundled samples), click a panel to select it, drag to pan, scroll to zoom, edit the caption, pick a layout and grade, choose an export size and hit Export PNG.

## Deterministic screenshots

Shot mode drives the app from URL params, e.g. `?shot=cover&photo=pier&caption=Sunset%20Heist&layout=hero&grade=sunset` for a full-bleed cover, or `?shot=editor&photo=boulevard&caption=Boulevard%20Queen&layout=quad&grade=neon` for the editor. The page sets `window.__shotReady = true` once painted. See `shots.json` for the four screenshots in `screenshots/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xmc7n7gx&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

