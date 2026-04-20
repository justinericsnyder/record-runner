<div align="center">

# Changelog

**Record Runner** — Version History

</div>

---

## v1.8.0 <sub>2026-04-19</sub>

&#9670; **Documentation**

- Added Mermaid architecture diagrams rendered natively on GitHub
- System architecture, scene flow, procedural generation pipeline, physics model, and deployment diagrams
- Hardened public documentation to remove implementation-sensitive details
- Comprehensive README with tech stack table and technical highlights

---

## v1.7.0 <sub>2026-04-18</sub>

&#9733; **Unique Power-ups**

- Power-ups redesigned with distinct shapes per type: hexagonal snowflake, faceted diamond, lightning bolt
- Power-up effects now persist for the entire level duration
- Reduced spawn frequency to 1–2 per level for strategic rarity

&#9835; **Name-Driven Procedural Music**

- Music engine parses record and song names for thematic keywords
- 50+ keyword-to-scale mappings produce contextually appropriate tracks
- 11 musical scales, 4 bass pattern styles, mood-driven rhythm density
- Added pad layer for atmospheric tracks with high reverb settings

&#9632; **Expanded Content**

- 6 records with 34 total tracks (up from 3 records / 9 tracks)
- New records: Neon Nights, Jungle Breaks, Inferno
- Progressive difficulty scaling from 90 BPM to 200 BPM
- Level selector scene with tracklist browser and difficulty indicators

&#9998; **Score System**

- High score persistence with 3-letter initial entry
- Input sanitization filter for inappropriate content
- Leaderboard displayed on menu and level select screens

---

## v1.6.0 <sub>2026-04-18</sub>

&#9650; **Physics Improvements**

- Rotated AABB collision boxes — body sizes update each frame to match platform orientation
- Slope traction system — player slides off platforms tilted beyond threshold angle
- Slide force applied along actual slope direction (both axes)
- Player input weakened during active sliding for realistic feel
- Stronger slide acceleration for noticeable gravity effect

&#9654; **Jump Mechanic**

- Added jump via Space, W, or Up arrow key
- Mobile jump button (center touch control)
- Jump only available when grounded

&#9688; **Mobile Support**

- Phaser Scale Manager with FIT mode for responsive display
- On-screen touch controls: left, right, and jump buttons
- Viewport meta tags prevent zoom and scroll on mobile
- Multi-touch support for simultaneous drag and button input

---

## v1.5.0 <sub>2026-04-17</sub>

&#9679; **Springs and Arc Walls**

- Spring pads on platforms launch the player with high velocity
- Cel-shaded coil spring texture with squash animation on impact
- Arc wall barriers — semi-circular maze segments at various radii
- Arc walls use velocity-based movement matching platform collision system
- Procedural generation places 2–8 arc walls per level based on difficulty

&#9788; **Social and Branding**

- Vinyl record SVG favicon
- Open Graph and Twitter Card meta tags for link previews
- Generated PNG preview image for social sharing

---

## v1.4.0 <sub>2026-04-17</sub>

&#9654; **Spin Mode (Primary Game Mode)**

- Drag-to-rotate mechanic with momentum on release
- Friction decay on angular velocity when not dragging
- Velocity-based platform movement prevents player fall-through
- Sub-stepped rotation limits angular change per frame
- Manual overlap resolution catches edge-case collisions
- A/D horizontal movement for fine player control
- Power-up effects activate when player is not dragging the record

&#9632; **Collision Fixes**

- Platforms use physics velocity instead of teleporting
- Player cannot clip through geometry during fast rotation
- Arc wall collider initialization order corrected

---

## v1.3.0 <sub>2026-04-17</sub>

&#9998; **Admin Dashboard**

- Visual level editor with Canvas 2D rendering
- AI-driven level generation with configurable parameters
- Seed, difficulty, platform count, hazard density, power-up count, spiral rotation controls
- Click-to-place tools for all game object types
- Drag-to-reposition and right-click-to-delete
- Property inspector panel with per-object editing
- Level validation checking reachability and bounds
- JSON export to clipboard

---

## v1.2.0 <sub>2026-04-17</sub>

&#9670; **Cel-Shaded Art Style**

- All textures redrawn with bold black outlines and flat color fills
- Hard-edged shadow crescents and highlight spots (no gradients)
- Guitar pick player sprite with faceted shading
- Platforms with groove line details and depth bands
- Eighth note collectibles with outlined head, stem, and flag
- Hazard scratch marks with spark dots
- Record disc with bold groove rings and highlight arcs

&#9733; **Power-ups**

- Three types: Freeze (stop rotation), Slow (reduce speed), Fast (increase speed)
- Procedurally scattered across the record surface
- HUD indicator with countdown timer bar

---

## v1.1.0 <sub>2026-04-17</sub>

&#9654; **Procedural Level Generation**

- Seeded PRNG produces reproducible but varied layouts
- Platforms spiral inward with randomized angles, distances, and tilts
- Reachability guaranteed — each platform within jump range of previous
- Difficulty parameter controls platform count, size, tilt, and hazard frequency
- Expanded canvas to 1000×800 with 370px record radius

&#9632; **Rotating Record Mechanic**

- All platforms, collectibles, hazards, and exit orbit the record center
- Polar coordinate system for level data
- Record rotation begins on first player input
- Starting platform always positioned flat at 9 o'clock

---

## v1.0.0 <sub>2026-04-17</sub>

&#9679; **Initial Release**

- Phaser 3 platformer with vinyl record theme
- 3 records with 3 tracks each (9 levels)
- Player movement with WASD/arrows and jump
- Music note collectibles and scratch hazards
- Exit portal to advance between tracks
- Song transition and record completion animations
- Game over and victory screens
- Vercel deployment configuration
- GitHub repository with CI/CD auto-deploy

---

<div align="center">
<sub>Built with Phaser 3 &#8226; Vite &#8226; Web Audio API &#8226; Vercel</sub>
</div>
