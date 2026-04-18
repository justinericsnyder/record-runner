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

// Platform shape variations for more visual/gameplay variety
const PLAT_STYLES = ['normal', 'thin', 'wide', 'tiny'];

function generateSong(seed, difficulty) {
  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  const d = Math.min(difficulty, 2.5);

  // More platforms at higher difficulty, wider range
  const platCount = randInt(16 + Math.floor(d * 5), 22 + Math.floor(d * 6));
  // More rotations = longer spiral
  const totalAngleSpan = rand(PI * 3.0 + d * 0.4, PI * 4.0 + d * 0.5);
  const startDist = RECORD_RADIUS - rand(15, 30);
  const endDist = rand(50, 75);

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

      // More jitter at higher difficulty
      const angleJitter = rand(-PI * 0.1, PI * 0.14) * (1 + d * 0.2);
      const distJitter = rand(-30, 20);

      angle = baseAngle + angleJitter;
      dist = Math.max(endDist - 10, Math.min(startDist + 5, baseDist + distJitter));

      // Occasional "switchback" — platform jumps outward
      if (rng() < 0.08 + d * 0.03 && i > 3) {
        dist = Math.min(prevDist + rand(15, 35), startDist - 5);
      }

      const angleDiff = Math.abs(angle - prevAngle);
      if (angleDiff > maxJumpAngle) angle = prevAngle + Math.sign(angle - prevAngle) * maxJumpAngle;
      const distDiff = Math.abs(dist - prevDist);
      if (distDiff > maxJumpDist) dist = prevDist + Math.sign(dist - prevDist) * maxJumpDist;
      dist = Math.min(dist, prevDist + 15);
    }

    // Varied platform sizes
    const style = i === 0 ? 'wide' : pick(PLAT_STYLES);
    let width, height;
    switch (style) {
      case 'wide':  width = rand(110, 150) - d * 5; height = i === 0 ? 22 : rand(16, 20); break;
      case 'thin':  width = rand(50, 80) - d * 3; height = rand(8, 12); break;
      case 'tiny':  width = rand(35, 55) - d * 2; height = rand(10, 14); break;
      default:      width = rand(65, 100) - d * 5 - progress * 10; height = rand(14, 18); break;
    }
    width = Math.max(30, width);
    height = Math.max(8, height);

    const maxTilt = 0.18 + d * 0.12 + progress * 0.12;
    const tilt = i === 0 ? 0 : rand(-maxTilt, maxTilt);

    platforms.push({ angle, dist, width, height, tilt });
    prevAngle = angle;
    prevDist = dist;

    // Collectibles — more variety in placement
    if (i > 0 && rng() < 0.8) {
      const cAngle = (platforms[i - 1].angle + angle) / 2 + rand(-0.05, 0.05);
      const cDist = (platforms[i - 1].dist + dist) / 2 + rand(-12, 8);
      collectibles.push({ angle: cAngle, dist: cDist });
    }
    // Extra collectible above some platforms
    if (rng() < 0.25) {
      collectibles.push({ angle: angle + rand(-0.03, 0.03), dist: dist - rand(20, 35) });
    }

    // Hazards — varied placement
    if (i >= 3 && rng() < 0.12 + d * 0.1) {
      hazards.push({ angle, dist: dist - 1, width: Math.min(width * 0.65, 45) });
    }
    // Hazard between platforms (floating)
    if (i >= 4 && rng() < 0.06 + d * 0.04) {
      const hAngle = (platforms[i - 1].angle + angle) / 2;
      const hDist = (platforms[i - 1].dist + dist) / 2 + rand(-5, 5);
      hazards.push({ angle: hAngle, dist: hDist, width: rand(25, 40) });
    }

    // Springs
    const hasHazardHere = hazards.length > 0 && Math.abs(hazards[hazards.length - 1].angle - angle) < 0.01;
    if (i >= 2 && !hasHazardHere && rng() < 0.15 + d * 0.03) {
      springs.push({ angle, dist: dist - (height / 2) - 2, platformIndex: i });
    }
  }

  // Bonus collectibles in clusters
  const clusterCount = randInt(2, 3 + Math.floor(d));
  for (let c = 0; c < clusterCount; c++) {
    const srcPlat = platforms[randInt(3, platforms.length - 3)];
    const clusterSize = randInt(2, 4);
    for (let j = 0; j < clusterSize; j++) {
      collectibles.push({
        angle: srcPlat.angle + rand(-0.12, 0.12),
        dist: srcPlat.dist + rand(-30, -8),
      });
    }
  }

  // Power-ups scattered across record
  const puCount = randInt(3, 5 + Math.floor(d));
  const angleStart = PI;
  const angleEnd = platforms[platforms.length - 1].angle;
  for (let i = 0; i < puCount; i++) {
    powerups.push({
      angle: rand(angleStart + 0.3, angleEnd - 0.2),
      dist: rand(endDist + 20, startDist - 10),
      type: pick(POWERUP_TYPES),
    });
  }

  // Arc walls — more varied
  const wallCount = randInt(2 + Math.floor(d), 5 + Math.floor(d * 2));
  for (let i = 0; i < wallCount; i++) {
    const wallDist = rand(endDist + 25, startDist - 15);
    const wallAngle = rand(angleStart + 0.4, angleEnd - 0.4);
    const arcSpan = rand(PI * 0.2, PI * 0.65 + d * 0.15);
    const segments = Math.max(4, Math.round(arcSpan * wallDist / 18));
    arcWalls.push({ angle: wallAngle, dist: wallDist, arcSpan, segments });
  }

  return {
    platforms, collectibles, hazards, powerups, springs, arcWalls,
    playerStart: { angle: PI, dist: startDist },
    exit: { angle: platforms[platforms.length - 1].angle, dist: Math.max(40, platforms[platforms.length - 1].dist - 25) },
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
      { id: 'first-groove', name: 'First Groove', bpm: 90,  ...generateSong(1001, 0) },
      { id: 'needle-drop',  name: 'Needle Drop',  bpm: 105, ...generateSong(1002, 0.2) },
      { id: 'bass-line',    name: 'Bass Line',    bpm: 115, ...generateSong(1003, 0.4) },
    ],
  },
  {
    id: 'vinyl-electric',
    name: 'Electric Sessions',
    color: 0x0f3460,
    grooveColor: 0x16213e,
    labelColor: 0xe94560,
    songs: [
      { id: 'voltage-ride',  name: 'Voltage Ride',  bpm: 120, ...generateSong(2001, 0.6) },
      { id: 'amp-surge',     name: 'Amp Surge',     bpm: 130, ...generateSong(2002, 0.8) },
      { id: 'feedback-loop', name: 'Feedback Loop', bpm: 140, ...generateSong(2003, 1.0) },
      { id: 'static-shock',  name: 'Static Shock',  bpm: 145, ...generateSong(2004, 1.1) },
    ],
  },
  {
    id: 'vinyl-golden',
    name: 'Golden Classics',
    color: 0x2d132c,
    grooveColor: 0x3a1d3e,
    labelColor: 0xf5c518,
    songs: [
      { id: 'golden-hour',  name: 'Golden Hour',  bpm: 100, ...generateSong(3001, 1.0) },
      { id: 'sunset-spin',  name: 'Sunset Spin',  bpm: 125, ...generateSong(3002, 1.2) },
      { id: 'velvet-touch',  name: 'Velvet Touch',  bpm: 135, ...generateSong(3003, 1.3) },
      { id: 'encore',       name: 'Encore',       bpm: 150, ...generateSong(3004, 1.5) },
    ],
  },
  {
    id: 'vinyl-neon',
    name: 'Neon Nights',
    color: 0x0a0a2a,
    grooveColor: 0x151540,
    labelColor: 0xff00ff,
    songs: [
      { id: 'neon-glow',     name: 'Neon Glow',     bpm: 128, ...generateSong(4001, 1.2) },
      { id: 'city-lights',   name: 'City Lights',   bpm: 138, ...generateSong(4002, 1.4) },
      { id: 'midnight-drive',name: 'Midnight Drive', bpm: 145, ...generateSong(4003, 1.5) },
      { id: 'synthwave',     name: 'Synthwave',     bpm: 150, ...generateSong(4004, 1.6) },
      { id: 'afterglow',     name: 'Afterglow',     bpm: 155, ...generateSong(4005, 1.7) },
    ],
  },
  {
    id: 'vinyl-jungle',
    name: 'Jungle Breaks',
    color: 0x0a2a0a,
    grooveColor: 0x153015,
    labelColor: 0x44ff44,
    songs: [
      { id: 'canopy',       name: 'Canopy',       bpm: 160, ...generateSong(5001, 1.5) },
      { id: 'vine-swing',   name: 'Vine Swing',   bpm: 168, ...generateSong(5002, 1.7) },
      { id: 'tribal-beat',  name: 'Tribal Beat',  bpm: 172, ...generateSong(5003, 1.8) },
      { id: 'monsoon',      name: 'Monsoon',      bpm: 175, ...generateSong(5004, 1.9) },
      { id: 'river-run',    name: 'River Run',    bpm: 178, ...generateSong(5005, 2.0) },
      { id: 'temple',       name: 'Temple',       bpm: 180, ...generateSong(5006, 2.1) },
    ],
  },
  {
    id: 'vinyl-inferno',
    name: 'Inferno',
    color: 0x2a0a0a,
    grooveColor: 0x401515,
    labelColor: 0xff4400,
    songs: [
      { id: 'ember',        name: 'Ember',        bpm: 165, ...generateSong(6001, 1.8) },
      { id: 'blaze',        name: 'Blaze',        bpm: 172, ...generateSong(6002, 2.0) },
      { id: 'firestorm',    name: 'Firestorm',    bpm: 178, ...generateSong(6003, 2.1) },
      { id: 'magma-flow',   name: 'Magma Flow',   bpm: 182, ...generateSong(6004, 2.2) },
      { id: 'eruption',     name: 'Eruption',     bpm: 185, ...generateSong(6005, 2.3) },
      { id: 'solar-flare',  name: 'Solar Flare',  bpm: 188, ...generateSong(6006, 2.4) },
      { id: 'supernova',    name: 'Supernova',    bpm: 190, ...generateSong(6007, 2.5) },
      { id: 'heat-death',   name: 'Heat Death',   bpm: 195, ...generateSong(6008, 2.5) },
      { id: 'phoenix',      name: 'Phoenix',      bpm: 200, ...generateSong(6009, 2.5) },
    ],
  },
];
