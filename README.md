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
outputs/2026-06-27-tinh-split-stage3-enriched/TINH_MVP_engine_data_v0_7_source_clean.xlsx
```

After editing the workbook, regenerate browser data:

```bash
npm run export:data
npm run generate:assets
npm run validate:data
```

This writes JSON into:

```text
public/data/
```

The browser game reads the JSON files, not the workbook directly. This keeps gameplay fast and makes the runtime simple. The export script is a structural workbook-to-JSON pass; authored text, labels, rewards, risks, character names, and tuning values belong in the workbook.

## Which Sheets Drive The Game

- `Beats`: scene nodes, speaker, text, background, portrait, document assets, next beat.
- `Choices`: button labels, requirements, meter deltas, flags, revealed tactics, goto.
- `Characters`: speaker names and roles.
- `Customers`: Stage 1 queue rows and scam/genuine classification.
- `Documents`: evidence card copy and tells.
- `Statements`: sao kê rows.
- `LinkedAccounts`: account-risk metadata.
- `Tactics`: guidebook/tactic metadata.
- `S2_Resolutions`: Stage 2 outcome thresholds and copy.
- `Endings`: ending metadata.
- `S3_Hubs`: Stage 3 day-planning actions, unlock gates, rewards, and risks.
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
- `DEBUG_JUMPS`: in-game QA menu jump targets for fast stage testing.
- `STAGE_THEMES`: stage label, mood line, background fallback, accent colors.
- `UI_COPY`: reusable Vietnamese UI labels.

Data-level tuning lives in the Excel `Config` sheet and is exported by:

```bash
npm run export:data
```

The runtime currently reads these workbook config keys directly:

- `flow.firstBeat`
- `meter.clamp`
- `meter.money.start`
- `meter.openness.start`
- `meter.relationship.start`
- `meter.wellbeing.start`
- `s1.repStart`

After data or asset changes, run:

```bash
npm run validate:data
```

The validator checks beat links, choice targets, document references, tactic IDs, Stage 3 hub scene links, config values, and required PNG assets.

## Testing The Game Flow

The `QA` button in the top-right corner opens a small stage-jump menu. It is meant for development and stakeholder review:

- Jump to S0, S1, S2, CS2, Stage 3 moments, or Ending.
- Use it to inspect mood, layout, evidence, and choice fit without replaying the whole game.
- Edit jump targets in `DEBUG_JUMPS` inside `src/game/config/gameConfig.ts`.

Evidence cards can be tapped during document and choice beats. The expanded view shows the Excel-authored `fields_summary`, `tell_desc`, and tactic ID, so writers can tune evidence language directly in the `Documents` sheet.

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
scripts/generate-assets.py
```

It creates PNG Vietnamese bank/home/temple backgrounds, transparent normalized character sprites, evidence document cards, and simple WAV sound effects. Character sprites are cropped and normalized from:

```text
public/assets/source/character-cast-source.png
```

Runtime asset routing is in:

```text
src/game/assets/assetMap.ts
```

## Development Scripts

```bash
npm run dev          # run local dev server
npm run build        # typecheck and build
npm run preview      # preview production build
npm run export:data  # Excel -> JSON
npm run validate:data
npm run generate:assets
npm run prepare:game # export data + generate assets + validate
```

## Current MVP Scope

- Stage 1: two customers, `C1` scam victim and `C2` legitimate customer.
- Stage 2: one intervention case, `S2A`.
- Stage 3: full mother rescue arc with enriched trust/fear/sunk-cost narrative.
