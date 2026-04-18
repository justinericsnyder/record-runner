// Procedural music generator using Web Audio API
// Each level gets a unique looping track based on its seed, BPM, and record color

let audioCtx = null;
let currentNodes = [];
let isPlaying = false;

// Musical scales for different record moods
const SCALES = {
  minor:      [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 3, 5, 7, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  blues:      [0, 3, 5, 6, 7, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
};

const SCALE_NAMES = Object.keys(SCALES);

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

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function stopMusic() {
  currentNodes.forEach(n => {
    try { n.stop(); } catch {}
    try { n.disconnect(); } catch {}
  });
  currentNodes = [];
  isPlaying = false;
}

export function playLevelMusic(seed, bpm, recordIndex) {
  initAudio();
  stopMusic();
  isPlaying = true;

  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  // Choose scale and root based on seed
  const scale = SCALES[SCALE_NAMES[recordIndex % SCALE_NAMES.length]];
  const rootNote = 48 + randInt(0, 7); // C3 to G3 range
  const beatDur = 60 / bpm;

  // Master volume
  const master = audioCtx.createGain();
  master.gain.value = 0.18;
  master.connect(audioCtx.destination);

  // Generate a 16-bar loop
  const bars = 16;
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const loopDuration = totalBeats * beatDur;

  // ── Bass line (square wave, plays root/fifth pattern) ──
  const bassPattern = [];
  for (let bar = 0; bar < bars; bar++) {
    const degree = pick([0, 0, 4, 3, 5, 0, 2, 4]);
    bassPattern.push(degree);
  }

  function scheduleBass(startTime) {
    for (let bar = 0; bar < bars; bar++) {
      const degree = bassPattern[bar];
      const midi = rootNote - 12 + scale[degree % scale.length];
      const freq = noteFreq(midi);

      for (let beat = 0; beat < beatsPerBar; beat++) {
        const t = startTime + (bar * beatsPerBar + beat) * beatDur;
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.3, t);
        env.gain.exponentialRampToValueAtTime(0.01, t + beatDur * 0.8);
        osc.connect(env);
        env.connect(master);
        osc.start(t);
        osc.stop(t + beatDur * 0.9);
        currentNodes.push(osc);
      }
    }
  }

  // ── Melody (triangle wave, generated from scale) ──
  const melodyNotes = [];
  let prevDegree = 0;
  for (let i = 0; i < totalBeats; i++) {
    if (rng() < 0.7) { // 70% chance of a note, 30% rest
      const step = randInt(-2, 3);
      prevDegree = Math.max(0, Math.min(scale.length * 2 - 1, prevDegree + step));
      const octave = Math.floor(prevDegree / scale.length);
      const degree = prevDegree % scale.length;
      melodyNotes.push(rootNote + 12 + octave * 12 + scale[degree]);
    } else {
      melodyNotes.push(0); // rest
    }
  }

  function scheduleMelody(startTime) {
    for (let i = 0; i < totalBeats; i++) {
      const midi = melodyNotes[i];
      if (midi === 0) continue;
      const t = startTime + i * beatDur;
      const dur = beatDur * pick([0.5, 0.75, 1.0]);
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteFreq(midi);
      env.gain.setValueAtTime(0.2, t);
      env.gain.exponentialRampToValueAtTime(0.01, t + dur);
      osc.connect(env);
      env.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      currentNodes.push(osc);
    }
  }

  // ── Hi-hat (noise burst on every beat/offbeat) ──
  function scheduleHihat(startTime) {
    for (let i = 0; i < totalBeats * 2; i++) {
      if (rng() < 0.15) continue; // occasional skip
      const t = startTime + i * beatDur * 0.5;
      const bufferSize = audioCtx.sampleRate * 0.03;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) data[s] = (Math.random() * 2 - 1) * 0.3;
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const env = audioCtx.createGain();
      const vol = i % 2 === 0 ? 0.12 : 0.06;
      env.gain.setValueAtTime(vol, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(env);
      env.connect(master);
      src.start(t);
      currentNodes.push(src);
    }
  }

  // Schedule first loop and set up repeating
  const now = audioCtx.currentTime + 0.1;
  scheduleBass(now);
  scheduleMelody(now);
  scheduleHihat(now);

  // Schedule next loops ahead of time
  let nextLoopTime = now + loopDuration;
  const scheduleAhead = () => {
    if (!isPlaying) return;
    if (audioCtx.currentTime > nextLoopTime - 2) {
      scheduleBass(nextLoopTime);
      scheduleMelody(nextLoopTime);
      scheduleHihat(nextLoopTime);
      nextLoopTime += loopDuration;
      // Clean up old nodes
      const cutoff = audioCtx.currentTime - 1;
      currentNodes = currentNodes.filter(n => {
        try { if (n.context && n.playbackState === 3) { n.disconnect(); return false; } } catch {}
        return true;
      });
    }
    setTimeout(scheduleAhead, 1000);
  };
  setTimeout(scheduleAhead, 1000);
}
