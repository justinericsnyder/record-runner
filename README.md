# 🎵 Record Runner

A vinyl-themed puzzle platformer where you spin a record to guide a guitar pick through procedurally generated levels. Drag to rotate, use gravity and momentum to navigate platforms, collect notes, avoid hazards, and reach the center of each record.

**[Play it live →](https://record-runner.vercel.app)**

![Record Runner](public/og-image.svg)

---

## Summary

Record Runner is a fully client-side browser game with zero static art or audio assets. All visuals are procedurally drawn at runtime in a cel-shaded style. Music is synthesized in real-time, with each level producing a unique track derived from its thematic context. Levels are procedurally generated with guaranteed playability.

The core mechanic is a physics puzzle: the player character sits on a spinning vinyl record that you control by dragging. Gravity, momentum, slope traction, and timing determine whether you make it from the outer groove to the center label.

6 records, 34 tracks — from gentle introductions to expert-level gauntlets.

---

## Features

- Spin-to-play mechanic with momentum and friction
- Procedural level generation with reachability guarantees
- Cel-shaded procedural art — all textures generated at runtime
- Procedural music engine — unique looping tracks per level
- Physics-based platforming with slope traction and sliding
- 6 records / 34 tracks with progressive difficulty
- Power-ups: Freeze, Slow, Fast — rare and permanent per level
- High score system with input sanitization
- Level selector with tracklists and difficulty indicators
- Admin level builder with AI-driven generation and visual editing
- Mobile support with responsive scaling and touch controls
- Social sharing with Open Graph and Twitter Card meta tags

---

## System Architecture

```mermaid
graph TB
    subgraph Browser["Browser Client"]
        direction TB
        
        subgraph Engine["Game Engine — Phaser 3"]
            Physics["Arcade Physics"]
            Scenes["Scene Manager"]
            Graphics["Graphics API"]
            Input["Input System"]
            Scale["Scale Manager"]
        end

        subgraph Gameplay["Core Gameplay"]
            Spin["Spin Mechanic<br/>Drag-to-rotate + Momentum"]
            Collision["Collision System<br/>Velocity-based + Overlap Resolution"]
            Slope["Slope Traction<br/>Tilt-based Sliding"]
            Objects["Game Objects<br/>Platforms • Springs • Walls • Power-ups"]
        end

        subgraph Procedural["Procedural Systems"]
            LevelGen["Level Generator<br/>Seeded • Reachability Guaranteed"]
            MusicGen["Music Engine<br/>Web Audio Synthesis"]
            ArtGen["Texture Generator<br/>Cel-shaded Runtime Art"]
        end

        subgraph Data["Data Layer"]
            Scores["Score System<br/>Client-side Persistence"]
            Sanitize["Input Sanitization"]
        end

        Admin["Admin Dashboard<br/>Level Editor • AI Generation"]
    end

    Engine --> Gameplay
    Procedural --> Gameplay
    Gameplay --> Data

    style Browser fill:#1a1a2e,stroke:#333355,color:#ccccdd
    style Engine fill:#222240,stroke:#44446a,color:#ccccdd
    style Gameplay fill:#2a1a2a,stroke:#e94560,color:#ccccdd
    style Procedural fill:#1a2a1a,stroke:#44dd66,color:#ccccdd
    style Data fill:#2a2a1a,stroke:#f5c518,color:#ccccdd
    style Admin fill:#1a1a22,stroke:#888899,color:#ccccdd
```

---

## Scene Flow

```mermaid
stateDiagram-v2
    [*] --> Boot: App Start
    Boot --> Menu: Textures Generated
    Menu --> LevelSelect: Pick Record
    LevelSelect --> Spin: Pick Track
    Spin --> SongTransition: Track Complete
    SongTransition --> Spin: Next Track
    Spin --> RecordComplete: All Tracks Done
    RecordComplete --> SongTransition: Next Record
    RecordComplete --> Victory: All Records Done
    Spin --> GameOver: Lives = 0
    GameOver --> Spin: Retry
    GameOver --> Menu: Main Menu
    Victory --> Menu: Play Again
```

---

## Procedural Generation Pipeline

```mermaid
flowchart LR
    subgraph Input
        Seed["Level Seed"]
        Diff["Difficulty"]
        Names["Record & Song Names"]
    end

    subgraph LevelGen["Level Generator"]
        PRNG["Seeded RNG"]
        Spiral["Spiral Layout"]
        Validate["Reachability Check"]
    end

    subgraph MusicGen["Music Engine"]
        Keywords["Keyword Matching"]
        ScaleSelect["Scale Selection<br/>11 scales"]
        Compose["Composition<br/>Bass • Melody • Perc • Pad"]
    end

    subgraph ArtGen["Texture Generator"]
        Shapes["Shape Drawing"]
        CelShade["Cel-shading<br/>Outlines • Flat Fill • Shadow"]
    end

    subgraph Output
        Platforms["Platforms + Hazards + Springs"]
        Walls["Arc Walls (Maze)"]
        Collectibles["Notes + Power-ups"]
        Music["Looping Audio Track"]
        Textures["12 Texture Types"]
    end

    Seed --> PRNG
    Diff --> PRNG
    PRNG --> Spiral --> Validate
    Validate --> Platforms
    Validate --> Walls
    Validate --> Collectibles

    Names --> Keywords --> ScaleSelect --> Compose --> Music

    Shapes --> CelShade --> Textures

    style Input fill:#222240,stroke:#44446a,color:#ccccdd
    style LevelGen fill:#1a2a1a,stroke:#44dd66,color:#ccccdd
    style MusicGen fill:#1a1a2a,stroke:#00ccff,color:#ccccdd
    style ArtGen fill:#2a2a1a,stroke:#f5c518,color:#ccccdd
    style Output fill:#2a1a2a,stroke:#e94560,color:#ccccdd
```

---

## Physics & Collision Model

```mermaid
flowchart TB
    subgraph Frame["Each Frame"]
        direction TB
        CalcAngle["Calculate Rotation Delta<br/>From drag or momentum"]
        SubStep["Sub-step Rotation<br/>Small increments to prevent tunneling"]
        MovePlat["Move Platforms via Velocity<br/>Physics engine detects collisions"]
        ResizeAABB["Resize Collision Boxes<br/>Match rotated bounding box"]
        Snap["Snap to Final Position"]
        Overlap["Manual Overlap Resolution<br/>Push player out of geometry"]
        SlopeCheck["Slope Traction Check<br/>Apply slide force if tilted"]
        PlayerInput["Apply Player Input<br/>A/D movement + Jump"]
    end

    CalcAngle --> SubStep --> MovePlat --> ResizeAABB --> Snap --> Overlap --> SlopeCheck --> PlayerInput

    style Frame fill:#1a1a2e,stroke:#e94560,color:#ccccdd
```

---

## Deployment Pipeline

```mermaid
flowchart LR
    Dev["Local Dev<br/>Vite Dev Server"] --> Push["Git Push"]
    Push --> CI["CI/CD Build<br/>vite build"]
    CI --> CDN["CDN<br/>Static Hosting"]
    CDN --> Desktop["Desktop Browsers"]
    CDN --> Mobile["Mobile Browsers"]

    style Dev fill:#222240,stroke:#44446a,color:#ccccdd
    style Push fill:#222240,stroke:#44446a,color:#ccccdd
    style CI fill:#222240,stroke:#f5c518,color:#ccccdd
    style CDN fill:#222240,stroke:#44dd66,color:#ccccdd
    style Desktop fill:#2a1a2a,stroke:#e94560,color:#ccccdd
    style Mobile fill:#2a1a2a,stroke:#e94560,color:#ccccdd
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Game Engine | Phaser 3 | Scene management, physics, input, rendering |
| Build Tool | Vite | Bundling, dev server, multi-page support |
| Audio | Web Audio API | Real-time procedural music synthesis |
| Rendering | Canvas / Graphics API | Procedural cel-shaded texture generation |
| State | Client-side storage | Score persistence with input sanitization |
| Deployment | Vercel | CI/CD, static hosting, CDN |
| Version Control | GitHub | Source repository |

---

## Key Technical Highlights

**Procedural everything** — All visuals, audio, and level layouts are generated at runtime. No sprite sheets, no audio files, no hand-placed levels.

**Physics-driven rotation** — Platforms move via velocity rather than teleporting, allowing the physics engine to properly resolve collisions during record rotation. Rotation is sub-stepped to prevent tunneling through geometry.

**Name-driven music** — The music engine maps keywords from level and record names to musical scales, waveforms, bass patterns, rhythm densities, and pad layers, producing thematically appropriate tracks for each level.

**Slope mechanics** — Platforms have limited traction. Beyond a threshold tilt angle, the player slides along the slope direction, adding a layer of physics puzzle to the rotation mechanic.

---

## Running Locally

```bash
npm install
npm run dev
```

---

## License

MIT
