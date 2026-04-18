// Procedural level generator.
// Each record is a map, each song is a level.
// Start angle is PI (9 o'clock / left side of the record).
// Platforms spiral inward with randomized angles, distances, tilts, and spacing.
// Generator guarantees reachability: each platform is within jump range of the previous one.

import { RECORD_RADIUS } from './config.js';

const PI = Math.PI;

// Seeded PRNG for reproducible levels
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSong(seed, difficulty) {
  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  // Difficulty scales: 0 = easy, 1 = medium, 2 = hard
  const d = Math.min(difficulty, 2);

  // Platform count scales with difficulty
  const platCount = randInt(14 + d * 4, 18 + d * 5);

  // Start at PI (9 o'clock), spiral ~1.5 to 2 full rotations inward
  const totalAngleSpan = rand(PI * 2.8, PI * 3.6);
  const startDist = RECORD_RADIUS - rand(15, 30);
  const endDist = rand(55, 80);

  const platforms = [];
  const collectibles = [];
  const hazards = [];

  // Max jump reach constraints (in polar space, approximate)
  const maxJumpDist = 55;    // max radial distance change per jump
  const maxJumpAngle = PI * 0.28; // max angular gap

  let prevAngle = PI; // 9 o'clock start
  let prevDist = startDist;

  for (let i = 0; i < platCount; i++) {
    const progress = i / (platCount - 1); // 0..1

    let angle, dist;

    if (i === 0) {
      // Starting platform — always at PI (9 o'clock), wide and flat
      angle = PI;
      dist = startDist;
    } else {
      // Base progression along the spiral
      const baseAngle = PI + totalAngleSpan * progress;
      const baseDist = startDist + (endDist - startDist) * progress;

      // Add randomness but clamp to jump range from previous platform
      const angleJitter = rand(-PI * 0.08, PI * 0.12);
      const distJitter = rand(-25, 15);

      angle = baseAngle + angleJitter;
      dist = Math.max(endDist - 10, Math.min(startDist + 5, baseDist + distJitter));

      // Ensure reachable from previous platform
      const angleDiff = Math.abs(angle - prevAngle);
      if (angleDiff > maxJumpAngle) {
        angle = prevAngle + Math.sign(angle - prevAngle) * maxJumpAngle;
      }
      const distDiff = Math.abs(dist - prevDist);
      if (distDiff > maxJumpDist) {
        dist = prevDist + Math.sign(dist - prevDist) * maxJumpDist;
      }
      // Keep dist on the inward trend
      dist = Math.min(dist, prevDist + 10);
    }

    // Platform size shrinks with difficulty and progress
    const widthBase = i === 0 ? 140 : rand(60, 110) - d * 8 - progress * 15;
    const width = Math.max(45, widthBase);
    const height = i === 0 ? 22 : Math.max(12, rand(14, 20) - d * 2);

    // Tilt: starting platform is always flat (0), others get random tilt
    // More tilt in later levels and further into the level
    const maxTilt = (0.15 + d * 0.1 + progress * 0.1);
    const tilt = i === 0 ? 0 : rand(-maxTilt, maxTilt);

    platforms.push({ angle, dist, width, height, tilt });

    prevAngle = angle;
    prevDist = dist;

    // Collectible between this and next platform (skip first)
    if (i > 0 && rng() < 0.75) {
      const cAngle = (platforms[i - 1].angle + angle) / 2 + rand(-0.03, 0.03);
      const cDist = (platforms[i - 1].dist + dist) / 2 + rand(-8, 8);
      collectibles.push({ angle: cAngle, dist: cDist });
    }

    // Hazard on some platforms (never on first or second, more on harder levels)
    if (i >= 3 && rng() < 0.15 + d * 0.12) {
      hazards.push({ angle, dist: dist - 1, width: Math.min(width * 0.7, 50) });
    }
  }

  // A few bonus collectibles scattered near platforms
  for (let i = 0; i < randInt(2, 4 + d); i++) {
    const srcPlat = platforms[randInt(2, platforms.length - 2)];
    collectibles.push({
      angle: srcPlat.angle + rand(-0.08, 0.08),
      dist: srcPlat.dist + rand(-20, -5),
    });
  }

  return {
    platforms,
    collectibles,
    hazards,
    playerStart: { angle: PI, dist: startDist },
    exit: { angle: platforms[platforms.length - 1].angle, dist: Math.max(40, platforms[platforms.length - 1].dist - 25) },
  };
}

// Record definitions — songs are procedurally generated
export const RECORDS = [
  {
    id: 'vinyl-debut',
    name: 'Debut Vinyl',
    color: 0x1a1a2e,
    grooveColor: 0x16213e,
    labelColor: 0xe94560,
    songs: [
      { id: 'first-groove',  name: 'First Groove',  bpm: 100, ...generateSong(1001, 0) },
      { id: 'needle-drop',   name: 'Needle Drop',   bpm: 120, ...generateSong(1002, 0) },
      { id: 'bass-line',     name: 'Bass Line',     bpm: 130, ...generateSong(1003, 0.5) },
    ],
  },
  {
    id: 'vinyl-electric',
    name: 'Electric Sessions',
    color: 0x0f3460,
    grooveColor: 0x16213e,
    labelColor: 0xe94560,
    songs: [
      { id: 'voltage-ride',   name: 'Voltage Ride',   bpm: 140, ...generateSong(2001, 1) },
      { id: 'amp-surge',      name: 'Amp Surge',      bpm: 150, ...generateSong(2002, 1) },
      { id: 'feedback-loop',  name: 'Feedback Loop',  bpm: 160, ...generateSong(2003, 1.5) },
    ],
  },
  {
    id: 'vinyl-golden',
    name: 'Golden Classics',
    color: 0x2d132c,
    grooveColor: 0x3a1d3e,
    labelColor: 0xf5c518,
    songs: [
      { id: 'golden-hour',  name: 'Golden Hour',  bpm: 110, ...generateSong(3001, 1.5) },
      { id: 'sunset-spin',  name: 'Sunset Spin',  bpm: 155, ...generateSong(3002, 2) },
      { id: 'encore',       name: 'Encore',       bpm: 170, ...generateSong(3003, 2) },
    ],
  },
];
