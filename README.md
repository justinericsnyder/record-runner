# 🎵 Record Runner

A vinyl-themed puzzle platformer where you spin a record to guide a guitar pick through procedurally generated levels. Drag to rotate, use gravity and momentum to navigate platforms, collect notes, avoid hazards, and reach the center of each record.

**[Play it live →](https://record-runner.vercel.app)**

![Record Runner](public/og-image.svg)

---

## Summary

Record Runner is a browser-based game built entirely with procedural generation — no static assets, no sprite sheets, no audio files. Every texture is drawn at runtime using Phaser's Graphics API with a cel-shaded art style. Every music track is synthesized in real-time using the Web Audio API, with melodies, bass lines, and percussion derived from the level and record names. Levels are generated from seeded algorithms that guarantee playability while producing unique layouts each time.

The core mechanic is a physics puzzle: the player character sits on a vinyl record, and you rotate the record by clicking and dragging. Gravity pulls the character down, platforms rotate with the record, and you use tilt, momentum, and timing to navigate a spiral path from the outer groove to the center label. Platforms have limited traction — tilt them past 20% and the character slides off.

**6 records, 34 tracks** spanning easy introductions to expert-level gauntlets at 200 BPM.

---

## Features

- **Spin-to-play mechanic** — click/drag to rotate the record, release to impart momentum with friction decay
- **Procedural level generation** — seeded PRNG creates platforms, hazards, collectibles, springs, arc walls, and power-ups with guaranteed reachability
- **Cel-shaded procedural art** — all textures generated at boot via Graphics API (no image files)
- **Procedural music engine** — Web Audio API synthesizes unique looping tracks per level using scales, waveforms, and rhythms derived from level/record names
- **Physics-based platforming** — rotated AABB collision boxes, slope traction with sliding, spring launchers, arc wall mazes
- **6 records / 34 tracks** with progressive difficulty scaling
- **Power-ups** — Freeze (snowflake), Slow (diamond), Fast (lightning bolt) — rare, permanent for the level
- **Score system** — localStorage persistence, 3-letter initials with profanity filter
- **Level selector** — browse records, view tracklists with difficulty indicators and high scores
- **Admin dashboard** — visual level builder with AI-driven generation, drag-to-place editor, inspector panel, validation, JSON export
- **Mobile support** — responsive scaling, on-screen touch controls (◀ ▲ ▶)
- **Social sharing** — Open Graph and Twitter Card meta tags with custom OG image

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                           │
│                                                                 │
│  ┌──────────┐   ┌──────────────────────────────────────────┐    │
│  │  Vite    │   │            Phaser 3 Engine                │    │
│  │  Build   │──▶│                                          │    │
│  │  System  │   │  ┌────────┐ ┌──────────┐ ┌───────────┐  │    │
│  └──────────┘   │  │ Arcade │ │  Scene   │ │ Graphics  │  │    │
│                 │  │Physics │ │ Manager  │ │   API     │  │    │
│                 │  │        │ │          │ │(Textures) │  │    │
│                 │  └───┬────┘ └────┬─────┘ └─────┬─────┘  │    │
│                 │      │           │             │         │    │
│                 └──────┼───────────┼─────────────┼─────────┘    │
│                        │           │             │              │
│  ┌─────────────────────┼───────────┼─────────────┼───────────┐  │
│  │              Game Systems       │             │           │  │
│  │                     │           │             │           │  │
│  │  ┌──────────────────▼───────────▼─────────────▼────────┐ │  │
│  │  │                 SpinScene                           │ │  │
│  │  │  • Drag-to-rotate input (mouse + touch)            │ │  │
│  │  │  • Momentum physics with friction decay            │ │  │
│  │  │  • Velocity-based platform movement (anti-tunnel)  │ │  │
│  │  │  • Rotated AABB collision boxes                    │ │  │
│  │  │  • Slope traction & sliding (>20% grade)           │ │  │
│  │  │  • Manual overlap resolution                       │ │  │
│  │  │  • Sub-stepped rotation for collision accuracy     │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │  │
│  │  │   Level     │  │  Procedural  │  │    Score      │  │  │
│  │  │  Generator  │  │    Music     │  │   Manager     │  │  │
│  │  │  (Seeded)   │  │  (Web Audio) │  │ (localStorage)│  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │  │
│  │         │                │                   │          │  │
│  │         ▼                ▼                   ▼          │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │  │
│  │  │ mulberry32 │  │  Keyword →  │  │  Profanity       │ │  │
│  │  │   PRNG     │  │  Scale/Mood │  │  Filter          │ │  │
│  │  │            │  │  Mapping    │  │  (50+ blocked)   │ │  │
│  │  └────────────┘  └─────────────┘  └──────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Admin Dashboard (/admin.html)              │    │
│  │  • Session-based login                                  │    │
│  │  • Canvas 2D visual level editor                        │    │
│  │  • AI-driven level generation with parameter controls   │    │
│  │  • Drag-to-place / right-click-to-delete                │    │
│  │  • Property inspector panel                             │    │
│  │  • Validation & JSON export                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT (Vercel)                          │
│                                                                 │
│  • Git push → auto build (vite build) → CDN deploy             │
│  • Multi-page: index.html (game) + admin.html (dashboard)      │
│  • Static assets: favicon.svg, og-image.png                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Game Engine** | Phaser 3.80 | Scene management, Arcade Physics, input handling, sprite rendering |
| **Build Tool** | Vite 5 | Dev server, HMR, production bundling, multi-page app support |
| **Physics** | Phaser Arcade Physics | Gravity, collisions, velocity-based platform movement, overlap resolution |
| **Audio** | Web Audio API | Real-time procedural music synthesis (oscillators, gain envelopes, noise buffers) |
| **Rendering** | Phaser Graphics API + Canvas 2D | All textures generated procedurally at runtime (cel-shaded style) |
| **State** | localStorage | High score persistence with 3-letter initials |
| **Admin** | Vanilla JS + Canvas 2D | Level editor with AI generation, visual placement, property inspector |
| **Deployment** | Vercel | Git-triggered CI/CD, static hosting, CDN |
| **Version Control** | GitHub | Source repository with automated Vercel deployments |

---

## Project Structure

```
record-runner/
├── index.html              # Game entry point
├── admin.html              # Admin dashboard entry point
├── vite.config.js          # Multi-page Vite configuration
├── vercel.json             # Vercel deployment config
├── public/
│   ├── favicon.svg         # Vinyl record favicon
│   ├── og-image.svg        # Social sharing preview (SVG)
│   └── og-image.png        # Social sharing preview (PNG)
└── src/
    ├── main.js             # Phaser game initialization
    ├── config.js           # Game constants (dimensions, physics, record geometry)
    ├── levels.js           # Procedural level generator (seeded PRNG)
    ├── music.js            # Web Audio procedural music engine
    ├── scores.js           # High score manager (localStorage)
    ├── profanity.js        # 3-letter initials profanity filter
    ├── scenes/
    │   ├── BootScene.js    # Procedural texture generation (all game art)
    │   ├── MenuScene.js    # Record selection grid with high scores
    │   ├── LevelSelectScene.js  # Track list browser per record
    │   ├── SpinScene.js    # Core gameplay (drag-rotate, physics, power-ups)
    │   ├── SongTransition.js    # Between-track needle drop animation
    │   ├── RecordComplete.js    # Record completion celebration
    │   ├── GameOverScene.js     # Score entry with profanity filter
    │   └── VictoryScene.js      # All-records-complete screen
    └── admin/
        ├── admin.js        # Level editor logic + AI generation
        └── admin.css       # Dashboard styling
```

---

## Key Technical Decisions

**Procedural everything** — Zero static assets. All textures are drawn with Phaser's Graphics API at boot time using cel-shading techniques (bold outlines, flat fills, hard shadow/highlight bands). Music is synthesized via Web Audio oscillators and noise buffers. Levels are generated from seeded PRNGs. This keeps the entire game under 15KB of source code (excluding Phaser).

**Velocity-based collision** — Arcade Physics bodies can't rotate, so platforms use velocity-based movement instead of teleporting. Each frame, platforms are given a velocity that moves them to their target position, allowing the physics engine to detect collisions along the path. Sub-stepped rotation (max ~3° per step) prevents tunneling. A manual AABB overlap resolver catches edge cases.

**Rotated AABB sizing** — Since Arcade Physics only supports axis-aligned rectangles, each platform's body is resized every frame to the bounding box of its rotated rectangle (`w*cos + h*sin` by `w*sin + h*cos`).

**Name-driven music** — The music engine scans level and record names for ~50 keywords (e.g., "midnight" → minor scale, "jungle" → pentatonic, "blaze" → harmonic minor) and maps them to scales, waveforms, bass patterns, rhythm densities, and pad layers.

---

## Running Locally

```bash
cd record-runner
npm install
npm run dev        # → http://localhost:5173
```

Admin dashboard: `http://localhost:5173/admin.html`
- Username: `admin`
- Password: `recordrunner`

---

## Deployment

Push to `main` on GitHub → Vercel auto-builds and deploys.

```bash
git push origin main
```

Or deploy manually:
```bash
npx vercel --prod
```

---

## License

MIT
