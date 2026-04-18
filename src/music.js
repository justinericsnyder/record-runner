// Procedural music generator using Web Audio API
// Derives musical character from record name, song name, BPM, and seed

let audioCtx = null;
let currentNodes = [];
let isPlaying = false;
let loopTimer = null;

// ── Musical vocabulary mapped to keywords ──

const SCALES = {
  minor:       [0, 2, 3, 5, 7, 8, 10],
  pentatonic:  [0, 3, 5, 7, 10],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  blues:       [0, 3, 5, 6, 7, 10],
  phrygian:    [0, 1, 3, 5, 7, 8, 10],
  lydian:      [0, 2, 4, 6, 7, 9, 11],
  major:       [0, 2, 4, 5, 7, 9, 11],
  harmMinor:   [0, 2, 3, 5, 7, 8, 11],
  chromatic:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  japanese:    [0, 1, 5, 7, 8],
  arabic:      [0, 1, 4, 5, 7, 8, 11],
};

// Map keywords in names to musical traits
const KEYWORD_MAP = {
  // Scale associations
  neon:     { scale: 'lydian',     waveform: 'sawtooth', mood: 'bright',  reverb: 0.3 },
  synth:    { scale: 'lydian',     waveform: 'sawtooth', mood: 'bright',  reverb: 0.4 },
  city:     { scale: 'dorian',     waveform: 'sawtooth', mood: 'cool',    reverb: 0.3 },
  midnight: { scale: 'minor',      waveform: 'triangle', mood: 'dark',    reverb: 0.5 },
  night:    { scale: 'minor',      waveform: 'triangle', mood: 'dark',    reverb: 0.4 },
  drive:    { scale: 'dorian',     waveform: 'sawtooth', mood: 'driving', reverb: 0.2 },
  glow:     { scale: 'major',      waveform: 'sine',     mood: 'warm',    reverb: 0.5 },
  after:    { scale: 'pentatonic', waveform: 'sine',     mood: 'mellow',  reverb: 0.6 },
  golden:   { scale: 'major',      waveform: 'triangle', mood: 'warm',    reverb: 0.4 },
  sunset:   { scale: 'pentatonic', waveform: 'sine',     mood: 'warm',    reverb: 0.5 },
  velvet:   { scale: 'dorian',     waveform: 'sine',     mood: 'smooth',  reverb: 0.5 },
  encore:   { scale: 'harmMinor',  waveform: 'square',   mood: 'intense', reverb: 0.3 },
  jungle:   { scale: 'pentatonic', waveform: 'square',   mood: 'wild',    reverb: 0.2 },
  canopy:   { scale: 'japanese',   waveform: 'triangle', mood: 'organic', reverb: 0.4 },
  vine:     { scale: 'pentatonic', waveform: 'triangle', mood: 'bouncy',  reverb: 0.3 },
  tribal:   { scale: 'phrygian',   waveform: 'square',   mood: 'primal',  reverb: 0.2 },
  monsoon:  { scale: 'minor',      waveform: 'sawtooth', mood: 'intense', reverb: 0.5 },
  river:    { scale: 'pentatonic', waveform: 'sine',     mood: 'flowing', reverb: 0.6 },
  temple:   { scale: 'japanese',   waveform: 'sine',     mood: 'sacred',  reverb: 0.7 },
  ember:    { scale: 'phrygian',   waveform: 'sawtooth', mood: 'smolder', reverb: 0.2 },
  blaze:    { scale: 'harmMinor',  waveform: 'sawtooth', mood: 'intense', reverb: 0.2 },
  fire:     { scale: 'phrygian',   waveform: 'sawtooth', mood: 'intense', reverb: 0.1 },
  storm:    { scale: 'chromatic',  waveform: 'sawtooth', mood: 'chaotic', reverb: 0.3 },
  magma:    { scale: 'arabic',     waveform: 'sawtooth', mood: 'heavy',   reverb: 0.2 },
  erupt:    { scale: 'harmMinor',  waveform: 'square',   mood: 'intense', reverb: 0.1 },
  solar:    { scale: 'lydian',     waveform: 'sawtooth', mood: 'epic',    reverb: 0.4 },
  super:    { scale: 'chromatic',  waveform: 'sawtooth', mood: 'chaotic', reverb: 0.2 },
  phoenix:  { scale: 'harmMinor',  waveform: 'triangle', mood: 'rising',  reverb: 0.4 },
  heat:     { scale: 'blues',      waveform: 'square',   mood: 'heavy',   reverb: 0.2 },
  death:    { scale: 'phrygian',   waveform: 'sawtooth', mood: 'dark',    reverb: 0.3 },
  electric: { scale: 'blues',      waveform: 'square',   mood: 'edgy',    reverb: 0.2 },
  voltage:  { scale: 'blues',      waveform: 'square',   mood: 'edgy',    reverb: 0.2 },
  amp:      { scale: 'blues',      waveform: 'sawtooth', mood: 'loud',    reverb: 0.1 },
  surge:    { scale: 'dorian',     waveform: 'sawtooth', mood: 'driving', reverb: 0.2 },
  feedback: { scale: 'chromatic',  waveform: 'sawtooth', mood: 'chaotic', reverb: 0.5 },
  loop:     { scale: 'dorian',     waveform: 'triangle', mood: 'hypnotic',reverb: 0.4 },
  static:   { scale: 'minor',      waveform: 'square',   mood: 'glitch',  reverb: 0.3 },
  shock:    { scale: 'harmMinor',  waveform: 'square',   mood: 'sharp',   reverb: 0.1 },
  groove:   { scale: 'pentatonic', waveform: 'triangle', mood: 'funky',   reverb: 0.3 },
  needle:   { scale: 'minor',      waveform: 'triangle', mood: 'precise', reverb: 0.3 },
  drop:     { scale: 'minor',      waveform: 'square',   mood: 'impact',  reverb: 0.4 },
  bass:     { scale: 'blues',      waveform: 'square',   mood: 'deep',    reverb: 0.2 },
  debut:    { scale: 'major',      waveform: 'triangle', mood: 'bright',  reverb: 0.3 },
  classic:  { scale: 'major',      waveform: 'sine',     mood: 'warm',    reverb: 0.5 },
  inferno:  { scale: 'phrygian',   waveform: 'sawtooth', mood: 'intense', reverb: 0.1 },
  break:    { scale: 'blues',      waveform: 'square',   mood: 'punchy',  reverb: 0.2 },
};

// Mood → rhythm density, note density, bass pattern style
const MOOD_TRAITS = {
  bright:   { noteDensity: 0.75, rhythmDiv: 2, bassStyle: 'arpeggiate' },
  dark:     { noteDensity: 0.55, rhythmDiv: 1, bassStyle: 'sustain' },
  cool:     { noteDensity: 0.65, rhythmDiv: 2, bassStyle: 'walking' },
  driving:  { noteDensity: 0.70, rhythmDiv: 2, bassStyle: 'eighth' },
  warm:     { noteDensity: 0.60, rhythmDiv: 1, bassStyle: 'sustain' },
  mellow:   { noteDensity: 0.45, rhythmDiv: 1, bassStyle: 'sustain' },
  smooth:   { noteDensity: 0.55, rhythmDiv: 1, bassStyle: 'walking' },
  intense:  { noteDensity: 0.80, rhythmDiv: 2, bassStyle: 'eighth' },
  wild:     { noteDensity: 0.75, rhythmDiv: 2, bassStyle: 'arpeggiate' },
  organic:  { noteDensity: 0.50, rhythmDiv: 1, bassStyle: 'sustain' },
  bouncy:   { noteDensity: 0.70, rhythmDiv: 2, bassStyle: 'arpeggiate' },
  primal:   { noteDensity: 0.65, rhythmDiv: 2, bassStyle: 'eighth' },
  flowing:  { noteDensity: 0.50, rhythmDiv: 1, bassStyle: 'walking' },
  sacred:   { noteDensity: 0.40, rhythmDiv: 1, bassStyle: 'sustain' },
  smolder:  { noteDensity: 0.60, rhythmDiv: 1, bassStyle: 'eighth' },
  chaotic:  { noteDensity: 0.85, rhythmDiv: 4, bassStyle: 'arpeggiate' },
  heavy:    { noteDensity: 0.70, rhythmDiv: 1, bassStyle: 'eighth' },
  epic:     { noteDensity: 0.75, rhythmDiv: 2, bassStyle: 'arpeggiate' },
  rising:   { noteDensity: 0.70, rhythmDiv: 2, bassStyle: 'walking' },
  edgy:     { noteDensity: 0.70, rhythmDiv: 2, bassStyle: 'eighth' },
  loud:     { noteDensity: 0.80, rhythmDiv: 2, bassStyle: 'eighth' },
  hypnotic: { noteDensity: 0.60, rhythmDiv: 2, bassStyle: 'sustain' },
  glitch:   { noteDensity: 0.75, rhythmDiv: 4, bassStyle: 'arpeggiate' },
  sharp:    { noteDensity: 0.80, rhythmDiv: 2, bassStyle: 'eighth' },
  funky:    { noteDensity: 0.70, rhythmDiv: 2, bassStyle: 'walking' },
  precise:  { noteDensity: 0.60, rhythmDiv: 2, bassStyle: 'eighth' },
  impact:   { noteDensity: 0.65, rhythmDiv: 2, bassStyle: 'eighth' },
  deep:     { noteDensity: 0.55, rhythmDiv: 1, bassStyle: 'sustain' },
  punchy:   { noteDensity: 0.75, rhythmDiv: 2, bassStyle: 'eighth' },
};

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noteFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function matchKeywords(text) {
  const lower = text.toLowerCase();
  for (const [keyword, traits] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return traits;
  }
  return null;
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function stopMusic() {
  isPlaying = false;
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
  currentNodes.forEach(n => {
    try { n.stop(); } catch {}
    try { n.disconnect(); } catch {}
  });
  currentNodes = [];
}

/**
 * Generate and play music for a level.
 * @param {number} seed - unique seed for this level
 * @param {number} bpm - beats per minute
 * @param {string} recordName - e.g. "Neon Nights"
 * @param {string} songName - e.g. "Midnight Drive"
 */
export function playLevelMusic(seed, bpm, recordName, songName) {
  initAudio();
  stopMusic();
  isPlaying = true;

  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  // ── Derive traits from names ──
  const songTraits = matchKeywords(songName);
  const recordTraits = matchKeywords(recordName);
  const traits = songTraits || recordTraits || {
    scale: 'minor', waveform: 'triangle', mood: 'cool', reverb: 0.3,
  };

  const scale = SCALES[traits.scale] || SCALES.minor;
  const melodyWave = traits.waveform || 'triangle';
  const mood = traits.mood || 'cool';
  const moodT = MOOD_TRAITS[mood] || MOOD_TRAITS.cool;
  const reverbAmount = traits.reverb || 0.3;

  // Root note — darker moods get lower roots
  const darkMoods = ['dark', 'heavy', 'deep', 'smolder', 'primal', 'intense'];
  const brightMoods = ['bright', 'warm', 'bouncy', 'epic', 'rising'];
  let rootNote = 48; // C3
  if (darkMoods.includes(mood)) rootNote = 43 + randInt(0, 3);
  else if (brightMoods.includes(mood)) rootNote = 52 + randInt(0, 5);
  else rootNote = 46 + randInt(0, 6);

  const beatDur = 60 / bpm;

  // Master chain
  const master = audioCtx.createGain();
  master.gain.value = 0.16;
  master.connect(audioCtx.destination);

  const bars = 16;
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const loopDuration = totalBeats * beatDur;

  // ── Bass line — style from mood ──
  const bassChords = [];
  for (let bar = 0; bar < bars; bar++) {
    bassChords.push(pick([0, 0, 3, 4, 5, 0, 2, 4]));
  }

  function scheduleBass(startTime) {
    for (let bar = 0; bar < bars; bar++) {
      const degree = bassChords[bar];
      const midi = rootNote - 12 + scale[degree % scale.length];
      const freq = noteFreq(midi);

      if (moodT.bassStyle === 'sustain') {
        // One long note per bar
        const t = startTime + bar * beatsPerBar * beatDur;
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.25, t);
        env.gain.exponentialRampToValueAtTime(0.02, t + beatsPerBar * beatDur * 0.9);
        osc.connect(env); env.connect(master);
        osc.start(t); osc.stop(t + beatsPerBar * beatDur);
        currentNodes.push(osc);
      } else if (moodT.bassStyle === 'eighth') {
        // Eighth notes
        for (let b = 0; b < beatsPerBar * 2; b++) {
          const t = startTime + (bar * beatsPerBar + b * 0.5) * beatDur;
          const osc = audioCtx.createOscillator();
          const env = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq * (b % 2 === 0 ? 1 : 1.005);
          env.gain.setValueAtTime(b % 2 === 0 ? 0.25 : 0.15, t);
          env.gain.exponentialRampToValueAtTime(0.01, t + beatDur * 0.4);
          osc.connect(env); env.connect(master);
          osc.start(t); osc.stop(t + beatDur * 0.45);
          currentNodes.push(osc);
        }
      } else if (moodT.bassStyle === 'arpeggiate') {
        // Arpeggiate through chord tones
        const arpNotes = [0, 2, 4, 2].map(d => {
          const idx = (degree + d) % scale.length;
          return rootNote - 12 + scale[idx];
        });
        for (let b = 0; b < beatsPerBar; b++) {
          const t = startTime + (bar * beatsPerBar + b) * beatDur;
          const osc = audioCtx.createOscillator();
          const env = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.value = noteFreq(arpNotes[b % arpNotes.length]);
          env.gain.setValueAtTime(0.22, t);
          env.gain.exponentialRampToValueAtTime(0.01, t + beatDur * 0.7);
          osc.connect(env); env.connect(master);
          osc.start(t); osc.stop(t + beatDur * 0.8);
          currentNodes.push(osc);
        }
      } else {
        // Walking bass
        for (let b = 0; b < beatsPerBar; b++) {
          const walkDeg = (degree + b) % scale.length;
          const t = startTime + (bar * beatsPerBar + b) * beatDur;
          const osc = audioCtx.createOscillator();
          const env = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.value = noteFreq(rootNote - 12 + scale[walkDeg]);
          env.gain.setValueAtTime(0.22, t);
          env.gain.exponentialRampToValueAtTime(0.01, t + beatDur * 0.7);
          osc.connect(env); env.connect(master);
          osc.start(t); osc.stop(t + beatDur * 0.75);
          currentNodes.push(osc);
        }
      }
    }
  }

  // ── Melody — waveform and density from name traits ──
  const melodyNotes = [];
  let prevDeg = randInt(0, scale.length - 1);
  for (let i = 0; i < totalBeats; i++) {
    if (rng() < moodT.noteDensity) {
      const step = randInt(-3, 4);
      prevDeg = Math.max(0, Math.min(scale.length * 2 - 1, prevDeg + step));
      const oct = Math.floor(prevDeg / scale.length);
      const deg = prevDeg % scale.length;
      melodyNotes.push(rootNote + 12 + oct * 12 + scale[deg]);
    } else {
      melodyNotes.push(0);
    }
  }

  function scheduleMelody(startTime) {
    for (let i = 0; i < totalBeats; i++) {
      const midi = melodyNotes[i];
      if (midi === 0) continue;
      const t = startTime + i * beatDur;
      const dur = beatDur * pick([0.4, 0.6, 0.8, 1.0]);
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();
      osc.type = melodyWave;
      osc.frequency.value = noteFreq(midi);
      env.gain.setValueAtTime(0.15, t);
      env.gain.exponentialRampToValueAtTime(0.005, t + dur);
      osc.connect(env); env.connect(master);
      osc.start(t); osc.stop(t + dur + 0.02);
      currentNodes.push(osc);
    }
  }

  // ── Percussion — density from mood ──
  function schedulePerc(startTime) {
    const subdivisions = totalBeats * moodT.rhythmDiv;
    const subDur = beatDur / moodT.rhythmDiv;
    for (let i = 0; i < subdivisions; i++) {
      if (rng() < 0.12) continue;
      const t = startTime + i * subDur;
      const isAccent = i % (moodT.rhythmDiv * 2) === 0;
      const bufLen = audioCtx.sampleRate * (isAccent ? 0.04 : 0.025);
      const buffer = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < bufLen; s++) data[s] = (Math.random() * 2 - 1) * 0.25;
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(isAccent ? 0.10 : 0.04, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(env); env.connect(master);
      src.start(t);
      currentNodes.push(src);
    }
  }

  // ── Pad layer for reverb-heavy moods ──
  function schedulePad(startTime) {
    if (reverbAmount < 0.35) return;
    for (let bar = 0; bar < bars; bar += 2) {
      const degree = bassChords[bar];
      const chordTones = [0, 2, 4].map(d => {
        const idx = (degree + d) % scale.length;
        return rootNote + scale[idx];
      });
      const t = startTime + bar * beatsPerBar * beatDur;
      const dur = beatsPerBar * 2 * beatDur;
      chordTones.forEach(midi => {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = noteFreq(midi);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(reverbAmount * 0.08, t + dur * 0.3);
        env.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(env); env.connect(master);
        osc.start(t); osc.stop(t + dur + 0.1);
        currentNodes.push(osc);
      });
    }
  }

  // Schedule first loop
  const now = audioCtx.currentTime + 0.1;
  scheduleBass(now);
  scheduleMelody(now);
  schedulePerc(now);
  schedulePad(now);

  // Loop scheduling
  let nextLoopTime = now + loopDuration;
  const scheduleAhead = () => {
    if (!isPlaying) return;
    if (audioCtx.currentTime > nextLoopTime - 2) {
      scheduleBass(nextLoopTime);
      scheduleMelody(nextLoopTime);
      schedulePerc(nextLoopTime);
      schedulePad(nextLoopTime);
      nextLoopTime += loopDuration;
      // Prune old nodes
      currentNodes = currentNodes.filter(n => {
        try { if (n.context) return true; } catch {}
        return false;
      });
      if (currentNodes.length > 500) currentNodes = currentNodes.slice(-300);
    }
    loopTimer = setTimeout(scheduleAhead, 800);
  };
  loopTimer = setTimeout(scheduleAhead, 800);
}
