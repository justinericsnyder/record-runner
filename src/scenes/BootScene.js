import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// Cel-shading helpers
function darken(color, amount) {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount);
  const g = Math.max(0, ((color >> 8) & 0xff) - amount);
  const b = Math.max(0, (color & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}
function lighten(color, amount) {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount);
  const g = Math.min(255, ((color >> 8) & 0xff) + amount);
  const b = Math.min(255, (color & 0xff) + amount);
  return (r << 16) | (g << 8) | b;
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px', color: '#e94560', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  create() {
    this.generateTextures();
    this.scene.start('Menu');
  }

  generateTextures() {
    this.genPlayer();
    this.genPlatform();
    this.genNote();
    this.genHazard();
    this.genExit();
    this.genParticle();
    this.genPowerUpStop();
    this.genPowerUpSlow();
    this.genPowerUpFast();
    this.genSpring();
    this.genArcWall();
  }

  // ── Guitar Pick (cel-shaded) ──
  genPlayer() {
    const w = 30, h = 38;
    const g = this.add.graphics();
    const base = 0xe94560;
    const shadow = darken(base, 50);
    const highlight = lighten(base, 40);

    // Black outline shape (drawn slightly larger)
    g.fillStyle(0x000000, 1);
    g.beginPath();
    g.moveTo(w / 2, h);
    g.lineTo(0, 9);
    g.arc(w / 2, 9, w / 2, Math.PI, 0, false);
    g.closePath();
    g.fillPath();

    // Main fill (inset by 2px)
    g.fillStyle(base, 1);
    g.beginPath();
    g.moveTo(w / 2, h - 2);
    g.lineTo(3, 10);
    g.arc(w / 2, 10, w / 2 - 3, Math.PI, 0, false);
    g.closePath();
    g.fillPath();

    // Hard shadow band (right side)
    g.fillStyle(shadow, 1);
    g.beginPath();
    g.moveTo(w / 2 + 2, h - 3);
    g.lineTo(w - 3, 11);
    g.arc(w / 2, 10, w / 2 - 3, 0, -0.3, true);
    g.closePath();
    g.fillPath();

    // Hard highlight band (top-left)
    g.fillStyle(highlight, 1);
    g.fillRect(6, 10, 8, 4);

    // Center circle logo
    g.lineStyle(2, 0x000000, 1);
    g.strokeCircle(w / 2, 16, 5);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(w / 2, 16, 3);

    // Tip — darker wedge
    g.fillStyle(shadow, 1);
    g.fillTriangle(w / 2, h - 2, w / 2 - 5, h - 10, w / 2 + 5, h - 10);

    g.generateTexture('player', w, h);
    g.destroy();
  }

  // ── Platform (cel-shaded groove segment) ──
  genPlatform() {
    const w = 80, h = 20;
    const g = this.add.graphics();
    const base = 0x44446a;
    const shadow = darken(base, 40);
    const highlight = lighten(base, 35);

    // Black outline
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(0, 0, w, h, 4);

    // Main flat fill
    g.fillStyle(base, 1);
    g.fillRoundedRect(2, 2, w - 4, h - 4, 3);

    // Top highlight band (hard edge, top 4px)
    g.fillStyle(highlight, 1);
    g.fillRect(4, 2, w - 8, 4);

    // Bottom shadow band (hard edge, bottom 4px)
    g.fillStyle(shadow, 1);
    g.fillRect(4, h - 6, w - 8, 4);

    // Groove lines (bold, spaced)
    g.lineStyle(2, 0x000000, 0.2);
    for (let i = 10; i < w - 8; i += 8) {
      g.lineBetween(i, 5, i, h - 5);
    }

    g.generateTexture('platform', w, h);
    g.destroy();
  }

  // ── Music Note (cel-shaded eighth note) ──
  genNote() {
    const w = 24, h = 30;
    const g = this.add.graphics();
    const base = 0xf5c518;
    const shadow = darken(base, 60);
    const highlight = lighten(base, 50);

    // Black outline — note head
    g.fillStyle(0x000000, 1);
    g.fillEllipse(9, 22, 15, 11);
    // Black outline — stem
    g.fillRect(15, 3, 4, 20);
    // Black outline — flag
    g.fillStyle(0x000000, 1);
    g.fillTriangle(19, 3, 23, 9, 19, 15);

    // Flat fill — note head
    g.fillStyle(base, 1);
    g.fillEllipse(9, 22, 12, 8);
    // Shadow band on head
    g.fillStyle(shadow, 1);
    g.fillEllipse(11, 24, 8, 4);
    // Highlight on head
    g.fillStyle(highlight, 1);
    g.fillEllipse(7, 20, 5, 3);

    // Stem fill
    g.fillStyle(base, 1);
    g.fillRect(16, 4, 2, 18);

    // Flag fill
    g.fillStyle(base, 1);
    g.fillTriangle(18, 4, 22, 9, 18, 14);
    // Flag shadow
    g.fillStyle(shadow, 1);
    g.fillTriangle(18, 10, 21, 9, 18, 14);

    g.generateTexture('note', w, h);
    g.destroy();
  }

  // ── Hazard (cel-shaded scratch) ──
  genHazard() {
    const w = 42, h = 14;
    const g = this.add.graphics();

    // Black outline backing
    g.lineStyle(4, 0x000000, 1);
    g.lineBetween(2, 2, w - 2, h - 2);
    g.lineBetween(2, h - 2, w - 2, 2);

    // Red X — flat color
    g.lineStyle(3, 0xff3333, 1);
    g.lineBetween(2, 2, w - 2, h - 2);
    g.lineBetween(2, h - 2, w - 2, 2);

    // Highlight streak
    g.lineStyle(1, 0xff8888, 1);
    g.lineBetween(4, 3, w / 2, h / 2);

    // Spark dots with outlines
    [{ x: 5, y: 2 }, { x: w - 5, y: h - 2 }, { x: w / 2, y: 1 }].forEach(p => {
      g.fillStyle(0x000000, 1);
      g.fillCircle(p.x, p.y, 3);
      g.fillStyle(0xff6666, 1);
      g.fillCircle(p.x, p.y, 2);
    });

    g.generateTexture('hazard', w, h);
    g.destroy();
  }

  // ── Exit (cel-shaded glowing disc) ──
  genExit() {
    const r = 22;
    const s = r * 2;
    const g = this.add.graphics();
    const base = 0x00ff88;
    const shadow = darken(base, 60);
    const highlight = lighten(base, 50);

    // Black outline
    g.fillStyle(0x000000, 1);
    g.fillCircle(r, r, r);

    // Main fill
    g.fillStyle(base, 1);
    g.fillCircle(r, r, r - 3);

    // Shadow crescent (bottom-right)
    g.fillStyle(shadow, 1);
    g.beginPath();
    g.arc(r + 3, r + 3, r - 5, 0, Math.PI * 2, false);
    g.closePath();
    g.fillPath();
    // Re-fill main to create crescent effect
    g.fillStyle(base, 1);
    g.fillCircle(r, r, r - 5);

    // Hard highlight spot (top-left)
    g.fillStyle(highlight, 1);
    g.fillCircle(r - 5, r - 5, 5);

    // Inner ring outline
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(r, r, r - 8);

    // Center hole
    g.fillStyle(0x000000, 0.6);
    g.fillCircle(r, r, 4);

    g.generateTexture('exit', s, s);
    g.destroy();
  }

  // ── Particle (simple outlined dot) ──
  genParticle() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(5, 5, 3);
    g.generateTexture('particle', 10, 10);
    g.destroy();
  }

  // ── FREEZE power-up: Snowflake / hexagon shape ──
  genPowerUpStop() {
    const s = 36;
    const cx = s / 2, cy = s / 2;
    const g = this.add.graphics();
    const color = 0x00ccff;
    const hi = lighten(color, 60);

    // Black outline hexagon
    g.fillStyle(0x000000, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      g[method](cx + Math.cos(a) * 16, cy + Math.sin(a) * 16);
    }
    g.closePath();
    g.fillPath();

    // Colored fill
    g.fillStyle(color, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      g[method](cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
    }
    g.closePath();
    g.fillPath();

    // Cross lines (snowflake arms)
    g.lineStyle(2, hi, 0.8);
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI / 3) * i;
      g.lineBetween(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10,
                     cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
    }

    // Center dot
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, cy, 3);

    g.generateTexture('powerup_stop', s, s);
    g.destroy();
  }

  // ── SLOW power-up: Diamond shape ──
  genPowerUpSlow() {
    const s = 34;
    const cx = s / 2, cy = s / 2;
    const g = this.add.graphics();
    const color = 0x88ff44;
    const shadow = darken(color, 60);
    const hi = lighten(color, 50);

    // Black outline diamond
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx, 1, s - 2, cy, cx, s - 1);
    g.fillTriangle(cx, 1, 2, cy, cx, s - 1);

    // Colored fill
    g.fillStyle(color, 1);
    g.fillTriangle(cx, 4, s - 5, cy, cx, s - 4);
    g.fillTriangle(cx, 4, 5, cy, cx, s - 4);

    // Shadow on right half
    g.fillStyle(shadow, 1);
    g.fillTriangle(cx, 5, s - 5, cy, cx, s - 5);

    // Highlight on top-left
    g.fillStyle(hi, 1);
    g.fillTriangle(cx, 5, 7, cy - 2, cx - 3, cy - 5);

    // Center line
    g.lineStyle(2, 0x000000, 0.3);
    g.lineBetween(cx, 4, cx, s - 4);

    // Specular
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx - 3, cy - 5, 2);

    g.generateTexture('powerup_slow', s, s);
    g.destroy();
  }

  // ── FAST power-up: Lightning bolt shape ──
  genPowerUpFast() {
    const w = 30, h = 36;
    const g = this.add.graphics();
    const color = 0xff8800;
    const shadow = darken(color, 60);
    const hi = lighten(color, 60);

    // Black outline bolt
    g.fillStyle(0x000000, 1);
    g.beginPath();
    g.moveTo(18, 0);
    g.lineTo(4, 16);
    g.lineTo(13, 16);
    g.lineTo(10, h);
    g.lineTo(26, 18);
    g.lineTo(17, 18);
    g.lineTo(22, 0);
    g.closePath();
    g.fillPath();

    // Colored fill
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(17, 3);
    g.lineTo(7, 15);
    g.lineTo(14, 15);
    g.lineTo(11, h - 3);
    g.lineTo(24, 19);
    g.lineTo(16, 19);
    g.lineTo(20, 3);
    g.closePath();
    g.fillPath();

    // Shadow on right side
    g.fillStyle(shadow, 1);
    g.beginPath();
    g.moveTo(16, 19);
    g.lineTo(24, 19);
    g.lineTo(11, h - 3);
    g.lineTo(14, 22);
    g.closePath();
    g.fillPath();

    // Highlight streak
    g.fillStyle(hi, 1);
    g.beginPath();
    g.moveTo(17, 3);
    g.lineTo(15, 8);
    g.lineTo(19, 3);
    g.closePath();
    g.fillPath();

    // Specular
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(14, 7, 2);

    g.generateTexture('powerup_fast', w, h);
    g.destroy();
  }

  // ── Spring (cel-shaded coil on a base) ──
  genSpring() {
    const w = 26, h = 22;
    const g = this.add.graphics();
    const base = 0x44dd66;
    const shadow = darken(base, 60);
    const highlight = lighten(base, 50);

    // Black outline base plate
    g.fillStyle(0x000000, 1);
    g.fillRect(2, h - 6, w - 4, 6);
    // Base plate fill
    g.fillStyle(0x888888, 1);
    g.fillRect(3, h - 5, w - 6, 4);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(3, h - 5, w - 6, 2);

    // Coil zigzag — black outline first
    g.lineStyle(4, 0x000000, 1);
    g.beginPath();
    g.moveTo(w / 2, h - 6);
    g.lineTo(6, h - 10);
    g.lineTo(w - 6, h - 14);
    g.lineTo(8, h - 18);
    g.lineTo(w - 8, h - 22);
    g.strokePath();

    // Coil zigzag — colored fill
    g.lineStyle(2, base, 1);
    g.beginPath();
    g.moveTo(w / 2, h - 6);
    g.lineTo(6, h - 10);
    g.lineTo(w - 6, h - 14);
    g.lineTo(8, h - 18);
    g.lineTo(w - 8, h - 22);
    g.strokePath();

    // Highlight on top coil
    g.lineStyle(1, highlight, 1);
    g.beginPath();
    g.moveTo(8, h - 18);
    g.lineTo(w - 8, h - 22);
    g.strokePath();

    // Top cap
    g.fillStyle(0x000000, 1);
    g.fillRect(w / 2 - 8, 0, 16, 4);
    g.fillStyle(shadow, 1);
    g.fillRect(w / 2 - 7, 1, 14, 2);
    g.fillStyle(highlight, 1);
    g.fillRect(w / 2 - 7, 1, 14, 1);

    g.generateTexture('spring', w, h);
    g.destroy();
  }

  // ── Arc wall segment (small block used to build curved walls) ──
  genArcWall() {
    const w = 14, h = 14;
    const g = this.add.graphics();
    const base = 0x6a4488;
    const shadow = darken(base, 45);
    const highlight = lighten(base, 40);

    // Black outline
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(0, 0, w, h, 3);
    // Main fill
    g.fillStyle(base, 1);
    g.fillRoundedRect(2, 2, w - 4, h - 4, 2);
    // Top highlight
    g.fillStyle(highlight, 1);
    g.fillRect(3, 2, w - 6, 3);
    // Bottom shadow
    g.fillStyle(shadow, 1);
    g.fillRect(3, h - 5, w - 6, 3);

    g.generateTexture('arcwall', w, h);
    g.destroy();
  }
}
