import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

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
    // ── Player: Guitar Pick ──
    const pw = 28, ph = 34;
    const pg = this.add.graphics();
    // Pick body — rounded triangle shape
    pg.fillStyle(0xe94560, 1);
    pg.beginPath();
    pg.moveTo(pw / 2, ph);          // bottom tip
    pg.lineTo(1, 8);                // top-left curve
    pg.arc(pw / 2, 8, pw / 2 - 1, Math.PI, 0, false); // rounded top
    pg.lineTo(pw - 1, 8);           // top-right
    pg.closePath();
    pg.fillPath();
    // Glossy highlight
    pg.fillStyle(0xff6b8a, 0.6);
    pg.beginPath();
    pg.moveTo(pw / 2, ph - 6);
    pg.lineTo(6, 10);
    pg.arc(pw / 2, 10, pw / 2 - 6, Math.PI, 0, false);
    pg.closePath();
    pg.fillPath();
    // Pick text/logo mark
    pg.fillStyle(0xffffff, 0.7);
    pg.fillCircle(pw / 2, 14, 4);
    pg.fillStyle(0xe94560, 1);
    pg.fillCircle(pw / 2, 14, 2);
    // Tip accent
    pg.fillStyle(0xcc3355, 1);
    pg.fillTriangle(pw / 2, ph, pw / 2 - 4, ph - 6, pw / 2 + 4, ph - 6);
    pg.generateTexture('player', pw, ph);
    pg.destroy();

    // ── Platform: Vinyl groove segment with depth ──
    const platW = 80, platH = 18;
    const pl = this.add.graphics();
    // Shadow
    pl.fillStyle(0x1a1a33, 1);
    pl.fillRoundedRect(1, 2, platW - 2, platH - 2, 4);
    // Main body
    const bodyGrad = [0x3a3a5c, 0x44446a, 0x3a3a5c];
    bodyGrad.forEach((c, idx) => {
      pl.fillStyle(c, 1);
      pl.fillRect(0, idx * 5 + 1, platW, 5);
    });
    pl.fillStyle(0x44446a, 1);
    pl.fillRoundedRect(0, 0, platW, platH, 4);
    // Groove lines
    pl.lineStyle(1, 0x5555aa, 0.3);
    for (let i = 6; i < platW - 4; i += 5) {
      pl.lineBetween(i, 3, i, platH - 3);
    }
    // Top highlight
    pl.lineStyle(1, 0x8888cc, 0.4);
    pl.lineBetween(4, 1, platW - 4, 1);
    // Bottom edge
    pl.lineStyle(1, 0x222244, 0.6);
    pl.lineBetween(4, platH - 1, platW - 4, platH - 1);
    pl.generateTexture('platform', platW, platH);
    pl.destroy();

    // ── Music Note: Detailed eighth note ──
    const nw = 22, nh = 28;
    const ng = this.add.graphics();
    // Glow
    ng.fillStyle(0xf5c518, 0.2);
    ng.fillCircle(8, 20, 10);
    // Note head
    ng.fillStyle(0xf5c518, 1);
    ng.fillEllipse(8, 21, 12, 9);
    // Stem
    ng.fillStyle(0xf5c518, 1);
    ng.fillRect(13, 3, 2.5, 18);
    // Flag
    ng.lineStyle(2.5, 0xf5c518, 1);
    ng.beginPath();
    ng.moveTo(15, 3);
    ng.lineTo(20, 8);
    ng.lineTo(16, 14);
    ng.strokePath();
    // Shine
    ng.fillStyle(0xffffff, 0.5);
    ng.fillEllipse(6, 19, 5, 3);
    ng.generateTexture('note', nw, nh);
    ng.destroy();

    // ── Hazard: Vinyl scratch with sparks ──
    const hzW = 40, hzH = 12;
    const hz = this.add.graphics();
    // Scratch lines
    hz.lineStyle(2, 0xff3333, 0.9);
    hz.lineBetween(2, 2, hzW - 2, hzH - 2);
    hz.lineBetween(2, hzH - 2, hzW - 2, 2);
    hz.lineStyle(1, 0xff6666, 0.5);
    hz.lineBetween(0, hzH / 2, hzW, hzH / 2);
    // Spark dots
    hz.fillStyle(0xff8888, 0.8);
    hz.fillCircle(5, 3, 2);
    hz.fillCircle(hzW - 5, hzH - 3, 2);
    hz.fillCircle(hzW / 2, 2, 1.5);
    hz.generateTexture('hazard', hzW, hzH);
    hz.destroy();

    // ── Exit: Glowing label center ──
    const exR = 20;
    const ex = this.add.graphics();
    // Outer glow
    ex.fillStyle(0x00ff88, 0.15);
    ex.fillCircle(exR, exR, exR);
    ex.fillStyle(0x00ff88, 0.3);
    ex.fillCircle(exR, exR, exR - 4);
    // Main circle
    ex.fillStyle(0x00ff88, 0.9);
    ex.fillCircle(exR, exR, exR - 6);
    // Inner ring
    ex.lineStyle(2, 0xffffff, 0.3);
    ex.strokeCircle(exR, exR, exR - 10);
    // Center dot
    ex.fillStyle(0x00cc66, 1);
    ex.fillCircle(exR, exR, 4);
    // Shine
    ex.fillStyle(0xffffff, 0.4);
    ex.fillCircle(exR - 4, exR - 4, 3);
    ex.generateTexture('exit', exR * 2, exR * 2);
    ex.destroy();

    // ── Particle ──
    const pt = this.add.graphics();
    pt.fillStyle(0xffffff, 1);
    pt.fillCircle(4, 4, 4);
    pt.fillStyle(0xffffff, 0.5);
    pt.fillCircle(4, 4, 6);
    pt.generateTexture('particle', 10, 10);
    pt.destroy();

    // ── Power-ups ──
    this.generatePowerUpTexture('powerup_stop', 0x00ccff, '⏸');
    this.generatePowerUpTexture('powerup_slow', 0x88ff44, '⏪');
    this.generatePowerUpTexture('powerup_fast', 0xff8800, '⏩');
  }

  generatePowerUpTexture(key, color, symbol) {
    const size = 30;
    const g = this.add.graphics();
    // Outer glow
    g.fillStyle(color, 0.2);
    g.fillCircle(size / 2, size / 2, size / 2);
    // Ring
    g.lineStyle(2, color, 0.8);
    g.strokeCircle(size / 2, size / 2, size / 2 - 3);
    // Inner fill
    g.fillStyle(color, 0.5);
    g.fillCircle(size / 2, size / 2, size / 2 - 5);
    // Center bright dot
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(size / 2, size / 2, 4);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
