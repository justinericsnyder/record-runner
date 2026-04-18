// ── Record Runner Admin Dashboard ──
// Login credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'recordrunner';

const PI = Math.PI;
const RECORD_RADIUS = 370;
const CENTER = 400; // canvas is 800x800, center at 400,400

// ── State ──
let currentTool = 'platform';
let levelData = {
  platforms: [],
  collectibles: [],
  hazards: [],
  powerups: [],
  playerStart: { angle: PI, dist: RECORD_RADIUS - 25 },
  exit: { angle: PI * 1.95, dist: 60 },
};
let selectedItem = null;
let isDragging = false;
let dragItem = null;

// ── Login ──
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Check session
if (sessionStorage.getItem('rr_admin') === 'true') {
  showDashboard();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('rr_admin', 'true');
    showDashboard();
  } else {
    loginError.textContent = 'Invalid credentials';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('rr_admin');
  location.reload();
});

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  document.getElementById('user-display').textContent = `Logged in as ${ADMIN_USER}`;
  initEditor();
}

// ── Level Generator (same algorithm as game, parameterized) ──
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateLevel(seed, difficulty, platCount, hazardPct, puCount, rotations) {
  const rng = mulberry32(seed);
  const rand = (min, max) => min + rng() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const d = Math.min(difficulty, 2);

  const totalAngleSpan = PI * 2 * rotations;
  const startDist = RECORD_RADIUS - rand(15, 30);
  const endDist = rand(55, 80);
  const maxJumpDist = 55;
  const maxJumpAngle = PI * 0.28;

  const platforms = [];
  const collectibles = [];
  const hazards = [];
  const powerups = [];

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
      angle = baseAngle + rand(-PI * 0.08, PI * 0.12);
      dist = Math.max(endDist - 10, Math.min(startDist + 5, baseDist + rand(-25, 15)));

      const angleDiff = Math.abs(angle - prevAngle);
      if (angleDiff > maxJumpAngle) angle = prevAngle + Math.sign(angle - prevAngle) * maxJumpAngle;
      const distDiff = Math.abs(dist - prevDist);
      if (distDiff > maxJumpDist) dist = prevDist + Math.sign(dist - prevDist) * maxJumpDist;
      dist = Math.min(dist, prevDist + 10);
    }

    const widthBase = i === 0 ? 140 : rand(60, 110) - d * 8 - progress * 15;
    const width = Math.max(45, widthBase);
    const height = i === 0 ? 22 : Math.max(12, rand(14, 20) - d * 2);
    const maxTilt = 0.15 + d * 0.1 + progress * 0.1;
    const tilt = i === 0 ? 0 : rand(-maxTilt, maxTilt);

    platforms.push({ angle, dist, width, height, tilt });
    prevAngle = angle;
    prevDist = dist;

    if (i > 0 && rng() < 0.75) {
      collectibles.push({
        angle: (platforms[i - 1].angle + angle) / 2 + rand(-0.03, 0.03),
        dist: (platforms[i - 1].dist + dist) / 2 + rand(-8, 8),
      });
    }

    if (i >= 3 && rng() < hazardPct / 100) {
      hazards.push({ angle, dist: dist - 1, width: Math.min(width * 0.7, 50) });
    }
  }

  // Scatter power-ups
  const angleEnd = platforms[platforms.length - 1].angle;
  for (let i = 0; i < puCount; i++) {
    powerups.push({
      angle: rand(PI + 0.3, angleEnd - 0.2),
      dist: rand(endDist + 20, startDist - 10),
      type: pick(['stop', 'slow', 'fast']),
    });
  }

  return {
    platforms,
    collectibles,
    hazards,
    powerups,
    playerStart: { angle: PI, dist: startDist },
    exit: { angle: platforms[platforms.length - 1].angle, dist: Math.max(40, platforms[platforms.length - 1].dist - 25) },
  };
}

// ── Canvas Editor ──
let canvas, ctx;

function initEditor() {
  canvas = document.getElementById('editor-canvas');
  ctx = canvas.getContext('2d');

  // Tool selection
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      deselectItem();
    });
  });

  // Slider labels
  const sliders = [
    ['ai-platforms', 'ai-plat-val', v => v],
    ['ai-hazards', 'ai-haz-val', v => v + '%'],
    ['ai-powerups', 'ai-pu-val', v => v],
    ['ai-rotations', 'ai-rot-val', v => v],
  ];
  sliders.forEach(([id, labelId, fmt]) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      document.getElementById(labelId).textContent = fmt(el.value);
    });
  });

  // AI Generate
  document.getElementById('ai-generate').addEventListener('click', () => {
    const seed = parseInt(document.getElementById('ai-seed').value) || 42;
    const diff = parseFloat(document.getElementById('ai-difficulty').value);
    const plats = parseInt(document.getElementById('ai-platforms').value);
    const hazPct = parseInt(document.getElementById('ai-hazards').value);
    const pus = parseInt(document.getElementById('ai-powerups').value);
    const rots = parseFloat(document.getElementById('ai-rotations').value);

    levelData = generateLevel(seed, diff, plats, hazPct, pus, rots);
    deselectItem();
    render();
    updateStats();
    toast('Level generated');
  });

  document.getElementById('ai-randomize').addEventListener('click', () => {
    document.getElementById('ai-seed').value = Math.floor(Math.random() * 99999);
    document.getElementById('ai-generate').click();
  });

  // Actions
  document.getElementById('btn-clear').addEventListener('click', () => {
    levelData = {
      platforms: [], collectibles: [], hazards: [], powerups: [],
      playerStart: { angle: PI, dist: RECORD_RADIUS - 25 },
      exit: { angle: PI * 1.95, dist: 60 },
    };
    deselectItem();
    render();
    updateStats();
    toast('Level cleared');
  });

  document.getElementById('btn-validate').addEventListener('click', validateLevel);

  document.getElementById('btn-export').addEventListener('click', () => {
    const json = JSON.stringify(levelData, null, 2);
    navigator.clipboard.writeText(json).then(() => toast('JSON copied to clipboard'));
  });

  // Canvas interaction
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseup', onCanvasMouseUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Initial generate
  document.getElementById('ai-generate').click();
}

function polarToXY(angle, dist) {
  return {
    x: CENTER + Math.cos(angle) * dist,
    y: CENTER + Math.sin(angle) * dist,
  };
}

function xyToPolar(x, y) {
  const dx = x - CENTER;
  const dy = y - CENTER;
  return {
    angle: Math.atan2(dy, dx),
    dist: Math.sqrt(dx * dx + dy * dy),
  };
}

// ── Rendering ──
function render() {
  ctx.clearRect(0, 0, 800, 800);

  // Record disc
  ctx.fillStyle = '#0a0a18';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RECORD_RADIUS + 4, 0, PI * 2);
  ctx.fill();

  ctx.fillStyle = '#18182e';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RECORD_RADIUS, 0, PI * 2);
  ctx.fill();

  // Grooves
  ctx.strokeStyle = '#2a2a44';
  ctx.lineWidth = 1;
  for (let r = RECORD_RADIUS - 12; r > 75; r -= 10) {
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, r, 0, PI * 2);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = 'rgba(233, 69, 96, 0.2)';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 70, 0, PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center hole
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 8, 0, PI * 2);
  ctx.fill();

  // Draw all items
  drawPlatforms();
  drawCollectibles();
  drawHazards();
  drawPowerups();
  drawExit();
  drawPlayerStart();
}

function drawPlatforms() {
  levelData.platforms.forEach((p, i) => {
    const pos = polarToXY(p.angle, p.dist);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(p.angle + (p.tilt || 0));

    const isSelected = selectedItem && selectedItem.type === 'platform' && selectedItem.index === i;

    // Outline
    ctx.fillStyle = '#000';
    ctx.fillRect(-p.width / 2 - 2, -p.height / 2 - 2, p.width + 4, p.height + 4);
    // Fill
    ctx.fillStyle = isSelected ? '#6666aa' : '#44446a';
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    // Highlight band
    ctx.fillStyle = isSelected ? '#8888cc' : '#5555aa';
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, 3);

    if (i === 0) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('START', 0, 3);
    }

    ctx.restore();
  });
}

function drawCollectibles() {
  levelData.collectibles.forEach((c, i) => {
    const pos = polarToXY(c.angle, c.dist);
    const isSelected = selectedItem && selectedItem.type === 'collectible' && selectedItem.index === i;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, PI * 2);
    ctx.fill();

    ctx.fillStyle = isSelected ? '#ffe066' : '#f5c518';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', pos.x, pos.y + 1);
  });
}

function drawHazards() {
  levelData.hazards.forEach((h, i) => {
    const pos = polarToXY(h.angle, h.dist);
    const isSelected = selectedItem && selectedItem.type === 'hazard' && selectedItem.index === i;
    const w = h.width || 40;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(h.angle);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -4); ctx.lineTo(w / 2, 4);
    ctx.moveTo(-w / 2, 4); ctx.lineTo(w / 2, -4);
    ctx.stroke();

    ctx.strokeStyle = isSelected ? '#ff6666' : '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -4); ctx.lineTo(w / 2, 4);
    ctx.moveTo(-w / 2, 4); ctx.lineTo(w / 2, -4);
    ctx.stroke();

    ctx.restore();
  });
}

function drawPowerups() {
  const colors = { stop: '#00ccff', slow: '#88ff44', fast: '#ff8800' };
  const labels = { stop: '⏸', slow: '⏪', fast: '⏩' };

  levelData.powerups.forEach((p, i) => {
    const pos = polarToXY(p.angle, p.dist);
    const isSelected = selectedItem && selectedItem.type === 'powerup' && selectedItem.index === i;
    const color = colors[p.type] || '#fff';

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, PI * 2);
    ctx.fill();

    ctx.fillStyle = isSelected ? '#fff' : color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[p.type] || '?', pos.x, pos.y);
  });
}

function drawExit() {
  const pos = polarToXY(levelData.exit.angle, levelData.exit.dist);
  const isSelected = selectedItem && selectedItem.type === 'exit';

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 16, 0, PI * 2);
  ctx.fill();

  ctx.fillStyle = isSelected ? '#88ffbb' : '#00ff88';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 13, 0, PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 8, 0, PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', pos.x, pos.y);
}

function drawPlayerStart() {
  const pos = polarToXY(levelData.playerStart.angle, levelData.playerStart.dist);
  const isSelected = selectedItem && selectedItem.type === 'start';

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 10, 0, PI * 2);
  ctx.fill();

  ctx.fillStyle = isSelected ? '#ff8888' : '#e94560';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 8, 0, PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', pos.x, pos.y);
}

// ── Interaction ──
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (800 / rect.width),
    y: (e.clientY - rect.top) * (800 / rect.height),
  };
}

function hitTest(mx, my) {
  // Test in reverse draw order (top items first)
  // Player start
  let pos = polarToXY(levelData.playerStart.angle, levelData.playerStart.dist);
  if (Math.hypot(mx - pos.x, my - pos.y) < 12) return { type: 'start', index: 0 };

  // Exit
  pos = polarToXY(levelData.exit.angle, levelData.exit.dist);
  if (Math.hypot(mx - pos.x, my - pos.y) < 16) return { type: 'exit', index: 0 };

  // Power-ups
  for (let i = levelData.powerups.length - 1; i >= 0; i--) {
    pos = polarToXY(levelData.powerups[i].angle, levelData.powerups[i].dist);
    if (Math.hypot(mx - pos.x, my - pos.y) < 14) return { type: 'powerup', index: i };
  }

  // Hazards
  for (let i = levelData.hazards.length - 1; i >= 0; i--) {
    pos = polarToXY(levelData.hazards[i].angle, levelData.hazards[i].dist);
    if (Math.hypot(mx - pos.x, my - pos.y) < 20) return { type: 'hazard', index: i };
  }

  // Collectibles
  for (let i = levelData.collectibles.length - 1; i >= 0; i--) {
    pos = polarToXY(levelData.collectibles[i].angle, levelData.collectibles[i].dist);
    if (Math.hypot(mx - pos.x, my - pos.y) < 10) return { type: 'collectible', index: i };
  }

  // Platforms
  for (let i = levelData.platforms.length - 1; i >= 0; i--) {
    pos = polarToXY(levelData.platforms[i].angle, levelData.platforms[i].dist);
    const p = levelData.platforms[i];
    if (Math.abs(mx - pos.x) < p.width / 2 + 5 && Math.abs(my - pos.y) < p.height / 2 + 8) {
      return { type: 'platform', index: i };
    }
  }

  return null;
}

function onCanvasMouseDown(e) {
  const { x, y } = getCanvasPos(e);
  const dist = Math.hypot(x - CENTER, y - CENTER);

  // Right-click to delete
  if (e.button === 2) {
    const hit = hitTest(x, y);
    if (hit && hit.type !== 'start' && hit.type !== 'exit') {
      const arr = getArray(hit.type);
      if (arr) arr.splice(hit.index, 1);
      deselectItem();
      render();
      updateStats();
    }
    return;
  }

  // Left-click: try to select existing item first
  const hit = hitTest(x, y);
  if (hit) {
    selectItem(hit);
    isDragging = true;
    dragItem = hit;
    render();
    return;
  }

  // Place new item if within record bounds
  if (dist > RECORD_RADIUS + 5) return;

  const polar = xyToPolar(x, y);

  switch (currentTool) {
    case 'platform':
      levelData.platforms.push({ angle: polar.angle, dist: polar.dist, width: 80, height: 18, tilt: 0 });
      break;
    case 'collectible':
      levelData.collectibles.push({ angle: polar.angle, dist: polar.dist });
      break;
    case 'hazard':
      levelData.hazards.push({ angle: polar.angle, dist: polar.dist, width: 40 });
      break;
    case 'powerup_stop':
      levelData.powerups.push({ angle: polar.angle, dist: polar.dist, type: 'stop' });
      break;
    case 'powerup_slow':
      levelData.powerups.push({ angle: polar.angle, dist: polar.dist, type: 'slow' });
      break;
    case 'powerup_fast':
      levelData.powerups.push({ angle: polar.angle, dist: polar.dist, type: 'fast' });
      break;
    case 'exit':
      levelData.exit = { angle: polar.angle, dist: polar.dist };
      break;
    case 'start':
      levelData.playerStart = { angle: polar.angle, dist: polar.dist };
      break;
  }

  deselectItem();
  render();
  updateStats();
}

function onCanvasMouseMove(e) {
  if (!isDragging || !dragItem) return;
  const { x, y } = getCanvasPos(e);
  const polar = xyToPolar(x, y);

  if (dragItem.type === 'start') {
    levelData.playerStart.angle = polar.angle;
    levelData.playerStart.dist = Math.min(polar.dist, RECORD_RADIUS);
  } else if (dragItem.type === 'exit') {
    levelData.exit.angle = polar.angle;
    levelData.exit.dist = Math.min(polar.dist, RECORD_RADIUS);
  } else {
    const arr = getArray(dragItem.type);
    if (arr && arr[dragItem.index]) {
      arr[dragItem.index].angle = polar.angle;
      arr[dragItem.index].dist = Math.min(polar.dist, RECORD_RADIUS);
    }
  }

  render();
  updateInspector();
}

function onCanvasMouseUp() {
  isDragging = false;
  dragItem = null;
  updateStats();
}

function getArray(type) {
  switch (type) {
    case 'platform': return levelData.platforms;
    case 'collectible': return levelData.collectibles;
    case 'hazard': return levelData.hazards;
    case 'powerup': return levelData.powerups;
    default: return null;
  }
}

function selectItem(item) {
  selectedItem = item;
  showInspector(item);
}

function deselectItem() {
  selectedItem = null;
  document.getElementById('inspector').classList.add('hidden');
}

// ── Inspector Panel ──
function showInspector(item) {
  const panel = document.getElementById('inspector');
  const content = document.getElementById('inspector-content');
  panel.classList.remove('hidden');

  let html = '';

  if (item.type === 'platform') {
    const p = levelData.platforms[item.index];
    html = `
      <label>Angle <input type="number" step="0.01" value="${p.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(p.dist)}" data-field="dist" /></label>
      <label>Width <input type="number" value="${Math.round(p.width)}" data-field="width" /></label>
      <label>Height <input type="number" value="${Math.round(p.height)}" data-field="height" /></label>
      <label>Tilt <input type="number" step="0.01" value="${(p.tilt || 0).toFixed(3)}" data-field="tilt" /></label>
      <button id="inspector-delete">Delete</button>
    `;
  } else if (item.type === 'collectible') {
    const c = levelData.collectibles[item.index];
    html = `
      <label>Angle <input type="number" step="0.01" value="${c.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(c.dist)}" data-field="dist" /></label>
      <button id="inspector-delete">Delete</button>
    `;
  } else if (item.type === 'hazard') {
    const h = levelData.hazards[item.index];
    html = `
      <label>Angle <input type="number" step="0.01" value="${h.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(h.dist)}" data-field="dist" /></label>
      <label>Width <input type="number" value="${Math.round(h.width)}" data-field="width" /></label>
      <button id="inspector-delete">Delete</button>
    `;
  } else if (item.type === 'powerup') {
    const p = levelData.powerups[item.index];
    html = `
      <label>Type <select data-field="type">
        <option value="stop" ${p.type === 'stop' ? 'selected' : ''}>Freeze</option>
        <option value="slow" ${p.type === 'slow' ? 'selected' : ''}>Slow</option>
        <option value="fast" ${p.type === 'fast' ? 'selected' : ''}>Fast</option>
      </select></label>
      <label>Angle <input type="number" step="0.01" value="${p.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(p.dist)}" data-field="dist" /></label>
      <button id="inspector-delete">Delete</button>
    `;
  } else if (item.type === 'exit') {
    html = `
      <label>Angle <input type="number" step="0.01" value="${levelData.exit.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(levelData.exit.dist)}" data-field="dist" /></label>
    `;
  } else if (item.type === 'start') {
    html = `
      <label>Angle <input type="number" step="0.01" value="${levelData.playerStart.angle.toFixed(3)}" data-field="angle" /></label>
      <label>Distance <input type="number" value="${Math.round(levelData.playerStart.dist)}" data-field="dist" /></label>
    `;
  }

  content.innerHTML = `<p style="color:#aaa;margin-bottom:8px;font-size:10px;text-transform:uppercase">${item.type} #${item.index}</p>${html}`;

  // Bind inputs
  content.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', () => {
      const field = input.dataset.field;
      const val = input.tagName === 'SELECT' ? input.value : parseFloat(input.value);
      let target;

      if (item.type === 'exit') target = levelData.exit;
      else if (item.type === 'start') target = levelData.playerStart;
      else {
        const arr = getArray(item.type);
        target = arr ? arr[item.index] : null;
      }

      if (target) {
        target[field] = val;
        render();
        updateStats();
      }
    });
  });

  const delBtn = content.querySelector('#inspector-delete');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      const arr = getArray(item.type);
      if (arr) arr.splice(item.index, 1);
      deselectItem();
      render();
      updateStats();
    });
  }
}

function updateInspector() {
  if (!selectedItem) return;
  showInspector(selectedItem);
}

// ── Stats & Validation ──
function updateStats() {
  const stats = document.getElementById('level-stats');
  stats.innerHTML = `
    Platforms: ${levelData.platforms.length}<br>
    Collectibles: ${levelData.collectibles.length}<br>
    Hazards: ${levelData.hazards.length}<br>
    Power-ups: ${levelData.powerups.length}<br>
    Start: ${levelData.playerStart.angle.toFixed(2)} @ ${Math.round(levelData.playerStart.dist)}<br>
    Exit: ${levelData.exit.angle.toFixed(2)} @ ${Math.round(levelData.exit.dist)}
  `;
}

function validateLevel() {
  const issues = [];

  if (levelData.platforms.length < 3) issues.push('Need at least 3 platforms');
  if (levelData.exit.dist > RECORD_RADIUS) issues.push('Exit is outside the record');
  if (levelData.playerStart.dist > RECORD_RADIUS) issues.push('Start is outside the record');

  // Check platform reachability
  for (let i = 1; i < levelData.platforms.length; i++) {
    const prev = levelData.platforms[i - 1];
    const curr = levelData.platforms[i];
    const angleDiff = Math.abs(curr.angle - prev.angle);
    const distDiff = Math.abs(curr.dist - prev.dist);
    if (angleDiff > PI * 0.35 && distDiff > 70) {
      issues.push(`Platform ${i} may be unreachable from ${i - 1}`);
    }
  }

  // Check items outside record
  levelData.powerups.forEach((p, i) => {
    if (p.dist > RECORD_RADIUS) issues.push(`Power-up ${i} is outside the record`);
  });

  if (issues.length === 0) {
    toast('✓ Level looks good!');
  } else {
    toast('⚠ ' + issues.join(' | '));
  }
}

// ── Toast ──
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 3000);
}
