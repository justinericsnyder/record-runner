// Procedural level generator.
// Each record is a map, each song is a level.
// Start angle is PI (9 o'clock / left side of the record).
// Platforms spiral inward with randomized angles, distances, tilts, and spacing.
// Generator guarantees reachability: each platform is within jump range of the previous one.
// Power-ups: stop (freeze record), slow (half speed), fast (double speed)

import { RECORD_RADIUS } from './config.js';

const PI = Math.PI;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POWERUP_TYPES = ['stop', 'slow', 'fast'];

function generateSong(seed, difficulty) {
  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  const d = Math.min(difficulty, 2);

  const platCount = randInt(14 + d * 4, 18 + d * 5);
  const totalAngleSpan = rand(PI * 2.8, PI * 3.6);
  const startDist = RECORD_RADIUS - rand(15, 30);
  const endDist = rand(55, 80);

  const platforms = [];
  const collectibles = [];
  const hazards = [];
  const powerups = [];
  const springs = [];
  const arcWalls = [];

  const maxJumpDist = 55;
  const maxJumpAngle = PI * 0.28;

  let prevAngle = PI;
  let prevDist = startDist;

  for (let i = 0; i < platCount; i++) {
    const progress = i / (platCount - 1);
    let angle, dist;

    if (i === 0) {
      angle = PI;
      dist = startDist;
    } else {
      const baseAngle = PI + totalAngleSpan * progress;
      const baseDist = startDist + (endDist - startDist) * progress;
      const angleJitter = rand(-PI * 0.08, PI * 0.12);
      const distJitter = rand(-25, 15);

      angle = baseAngle + angleJitter;
      dist = Math.max(endDist - 10, Math.min(startDist + 5, baseDist + distJitter));

      const angleDiff = Math.abs(angle - prevAngle);
      if (angleDiff > maxJumpAngle) {
        angle = prevAngle + Math.sign(angle - prevAngle) * maxJumpAngle;
      }
      const distDiff = Math.abs(dist - prevDist);
      if (distDiff > maxJumpDist) {
        dist = prevDist + Math.sign(dist - prevDist) * maxJumpDist;
      }
      dist = Math.min(dist, prevDist + 10);
    }

    const widthBase = i === 0 ? 140 : rand(60, 110) - d * 8 - progress * 15;
    const width = Math.max(45, widthBase);
    const height = i === 0 ? 22 : Math.max(12, rand(14, 20) - d * 2);
    const maxTilt = (0.15 + d * 0.1 + progress * 0.1);
    const tilt = i === 0 ? 0 : rand(-maxTilt, maxTilt);

    platforms.push({ angle, dist, width, height, tilt });
    prevAngle = angle;
    prevDist = dist;

    // Collectible between platforms
    if (i > 0 && rng() < 0.75) {
      const cAngle = (platforms[i - 1].angle + angle) / 2 + rand(-0.03, 0.03);
      const cDist = (platforms[i - 1].dist + dist) / 2 + rand(-8, 8);
      collectibles.push({ angle: cAngle, dist: cDist });
    }

    // Hazard on some platforms
    if (i >= 3 && rng() < 0.15 + d * 0.12) {
      hazards.push({ angle, dist: dist - 1, width: Math.min(width * 0.7, 50) });
    }

    // Spring on some platforms (not first 2, not if hazard already placed, ~20% chance)
    const hasHazardHere = hazards.length > 0 && hazards[hazards.length - 1].angle === angle;
    if (i >= 2 && !hasHazardHere && rng() < 0.18) {
      springs.push({ angle, dist: dist - (height / 2) - 2, platformIndex: i });
    }
  }

  // Bonus collectibles
  for (let i = 0; i < randInt(2, 4 + d); i++) {
    const srcPlat = platforms[randInt(2, platforms.length - 2)];
    collectibles.push({
      angle: srcPlat.angle + rand(-0.08, 0.08),
      dist: srcPlat.dist + rand(-20, -5),
    });
  }

  // ── Scatter power-ups across the full record surface ──
  // Place 3-5 power-ups at random angles/distances across the vinyl,
  // not tied to specific platforms
  const puCount = randInt(3, 5);
  const minPuDist = endDist + 20;
  const maxPuDist = startDist - 10;
  const angleStart = PI; // same as level start
  const angleEnd = platforms[platforms.length - 1].angle;

  for (let i = 0; i < puCount; i++) {
    const puAngle = rand(angleStart + 0.3, angleEnd - 0.2);
    const puDist = rand(minPuDist, maxPuDist);
    const puType = pick(POWERUP_TYPES);
    powerups.push({ angle: puAngle, dist: puDist, type: puType });
  }

  // ── Arc walls: semi-circular barriers that create a maze ──
  // More walls on harder levels. Each wall is an arc at a fixed radius
  // with a gap the player must find/use to pass through.
  const wallCount = randInt(2 + Math.floor(d), 4 + Math.floor(d * 2));

  for (let i = 0; i < wallCount; i++) {
    // Place at a radius between the platform spiral bands
    const wallDist = rand(endDist + 30, startDist - 20);
    // Arc center angle — spread across the level's angular range
    const wallAngle = rand(angleStart + 0.5, angleEnd - 0.5);
    // Arc span: how much of the circle this wall covers (PI*0.3 to PI*0.8)
    const arcSpan = rand(PI * 0.25, PI * 0.7 + d * 0.15);
    // Number of small segments to approximate the curve
    const segments = Math.max(4, Math.round(arcSpan * wallDist / 20));

    arcWalls.push({
      angle: wallAngle,
      dist: wallDist,
      arcSpan,
      segments,
    });
  }

  return {
    platforms,
    collectibles,
    hazards,
    powerups,
    springs,
    arcWalls,
    playerStart: { angle: PI, dist: startDist },
    exit: {
      angle: platforms[platforms.length - 1].angle,
      dist: Math.max(40, platforms[platforms.length - 1].dist - 25),
    },
  };
}

export const RECORDS = [
  {
    id: 'vinyl-debut',
    name: 'Debut Vinyl',
    color: 0x1a1a2e,
    grooveColor: 0x16213e,
    labelColor: 0xe94560,
    songs: [
      { id: 'first-groove', name: 'First Groove', bpm: 100, ...generateSong(1001, 0) },
      { id: 'needle-drop',  name: 'Needle Drop',  bpm: 120, ...generateSong(1002, 0) },
      { id: 'bass-line',    name: 'Bass Line',    bpm: 130, ...generateSong(1003, 0.5) },
    ],
  },
  {
    id: 'vinyl-electric',
    name: 'Electric Sessions',
    color: 0x0f3460,
    grooveColor: 0x16213e,
    labelColor: 0xe94560,
    songs: [
      { id: 'voltage-ride',  name: 'Voltage Ride',  bpm: 140, ...generateSong(2001, 1) },
      { id: 'amp-surge',     name: 'Amp Surge',     bpm: 150, ...generateSong(2002, 1) },
      { id: 'feedback-loop', name: 'Feedback Loop', bpm: 160, ...generateSong(2003, 1.5) },
    ],
  },
  {
    id: 'vinyl-golden',
    name: 'Golden Classics',
    color: 0x2d132c,
    grooveColor: 0x3a1d3e,
    labelColor: 0xf5c518,
    songs: [
      { id: 'golden-hour', name: 'Golden Hour', bpm: 110, ...generateSong(3001, 1.5) },
      { id: 'sunset-spin', name: 'Sunset Spin', bpm: 155, ...generateSong(3002, 2) },
      { id: 'encore',      name: 'Encore',      bpm: 170, ...generateSong(3003, 2) },
    ],
  },
];
