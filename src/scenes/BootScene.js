import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Show loading text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px',
      color: '#e94560',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  create() {
    this.generateTextures();
    this.scene.start('Menu');
  }

  generateTextures() {
    // Player (stylus/needle shape)
    const pg = this.add.graphics();
    pg.fillStyle(0xe94560, 1);
    pg.fillRoundedRect(0, 0, 24, 32, 4);
    pg.fillStyle(0xffffff, 0.8);
    pg.fillRect(8, 2, 8, 4);
    // Needle tip
    pg.fillStyle(0xcccccc, 1);
    pg.fillTriangle(12, 32, 8, 38, 16, 38);
    pg.generateTexture('player', 24, 38);
    pg.destroy();

    // Platform (groove segment)
    const plat = this.add.graphics();
    plat.fillStyle(0x333355, 1);
    plat.fillRoundedRect(0, 0, 64, 16, 3);
    plat.lineStyle(1, 0x555577, 0.5);
    for (let i = 4; i < 60; i += 6) {
      plat.lineBetween(i, 3, i, 13);
    }
    plat.generateTexture('platform', 64, 16);
    plat.destroy();

    // Music note collectible
    const note = this.add.graphics();
    note.fillStyle(0xf5c518, 1);
    note.fillCircle(8, 16, 6);
    note.fillRect(14, 2, 3, 14);
    note.fillRect(14, 2, 8, 3);
    note.generateTexture('note', 24, 22);
    note.destroy();

    // Hazard (scratch mark)
    const hz = this.add.graphics();
    hz.lineStyle(3, 0xff2222, 0.8);
    hz.lineBetween(0, 0, 30, 8);
    hz.lineBetween(0, 8, 30, 0);
    hz.generateTexture('hazard', 30, 8);
    hz.destroy();

    // Exit (record label center)
    const ex = this.add.graphics();
    ex.fillStyle(0x00ff88, 0.9);
    ex.fillCircle(16, 16, 16);
    ex.fillStyle(0x00cc66, 1);
    ex.fillCircle(16, 16, 6);
    ex.lineStyle(2, 0xffffff, 0.3);
    ex.strokeCircle(16, 16, 12);
    ex.generateTexture('exit', 32, 32);
    ex.destroy();

    // Particle
    const pt = this.add.graphics();
    pt.fillStyle(0xffffff, 1);
    pt.fillCircle(3, 3, 3);
    pt.generateTexture('particle', 6, 6);
    pt.destroy();
  }
}
