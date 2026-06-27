# TỈNH & TÌNH

A portrait-first Vietnamese anti-scam narrative game built with Phaser, Vite, and Excel-authored content.

The player starts at a Vietnamese bank counter, learns to recognize scam victims through documents and sao kê, then moves into intervention and a personal Stage 3 rescue arc around their mother.

## Quick Start

```bash
npm install
npm run prepare:game
npm run dev
```

Open the local Vite URL. The game uses a fixed `1080 x 1920` internal canvas and Phaser `FIT` scaling, so it letterboxes cleanly into portrait or desktop browser windows.

## Content Workflow

The human-editable source is:

```text
outputs/2026-06-27-tinh-split-stage3-enriched/TINH_MVP_engine_data_v0_6_stage3_enriched.xlsx
```

After editing the workbook, regenerate browser data:

```bash
npm run export:data
```

This writes JSON into:

```text
public/data/
```

The browser game reads the JSON files, not the workbook directly. This keeps gameplay fast and makes the runtime simple.

## Which Sheets Drive The Game

- `Beats`: scene nodes, speaker, text, background, portrait, document assets, next beat.
- `Choices`: button labels, requirements, meter deltas, flags, revealed tactics, goto.
- `Characters`: speaker names and roles.
- `Documents`: evidence card copy and tells.
- `Tactics`: guidebook/tactic metadata.
- `Endings`: ending metadata.
- `Config`: exported to `runtimeConfig.json`; currently also mirrored by code config for renderer constants.
- `AssetRefs`: checklist of art/audio/data asset IDs expected by the content.

## Tuning Variables

Renderer/game feel variables live in:

```text
src/game/config/gameConfig.ts
```

Useful knobs:

- `GAME_SIZE`: internal canvas size.
- `GAME_TUNING`: first beat, meter defaults, text speed, button sizes, particle count, VFX timing.
- `STAGE_THEMES`: stage label, mood line, background fallback, accent colors.
- `UI_COPY`: reusable Vietnamese UI labels.

Data-level tuning lives in the Excel `Config` sheet and is exported by:

```bash
npm run export:data
```

## Artwork And Sound

Generated project assets live in:

```text
public/assets/
```

Regenerate them with:

```bash
npm run generate:assets
```

The generator is:

```text
scripts/generate-assets.mjs
```

It creates Vietnamese bank/home/temple backgrounds, character portraits, evidence documents, and simple WAV sound effects. Runtime asset routing is in:

```text
src/game/assets/assetMap.ts
```

## Development Scripts

```bash
npm run dev          # run local dev server
npm run build        # typecheck and build
npm run preview      # preview production build
npm run export:data  # Excel -> JSON
npm run generate:assets
npm run prepare:game # export data + generate assets
```

## Current MVP Scope

- Stage 1: two customers, `C1` scam victim and `C2` legitimate customer.
- Stage 2: one intervention case, `S2A`.
- Stage 3: full mother rescue arc with enriched trust/fear/sunk-cost narrative.
