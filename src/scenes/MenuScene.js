import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RECORD_ROTATION_SPEED } from '../config.js';
import { RECORDS } from '../levels.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Spinning record background
    this.recordGraphic = this.drawRecord(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 180, 0x1a1a2e, 0xe94560);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'RECORD RUNNER', {
      fontSize: '42px',
      color: '#e94560',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 105, 'Ride the grooves. Collect the notes.', {
      fontSize: '14px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Record selection
    const startY = GAME_HEIGHT - 180;
    this.add.text(GAME_WIDTH / 2, startY - 30, 'SELECT A RECORD', {
      fontSize: '16px',
      color: '#888899',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    RECORDS.forEach((record, i) => {
      const x = GAME_WIDTH / 2 - (RECORDS.length - 1) * 100 + i * 200;
      const y = startY + 30;

      // Mini record
      const mini = this.drawRecord(x, y, 50, record.color, record.labelColor);

      const label = this.add.text(x, y + 70, record.name, {
        fontSize: '13px',
        color: '#ccccdd',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      const songCount = this.add.text(x, y + 88, `${record.songs.length} tracks`, {
        fontSize: '11px',
        color: '#777788',
        fontFamily: 'monospace',
      }).setOrigin(0.5);

      // Make clickable
      const hitArea = this.add.rectangle(x, y, 110, 130, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        label.setColor('#e94560');
        mini.setScale(1.1);
      });
      hitArea.on('pointerout', () => {
        label.setColor('#ccccdd');
        mini.setScale(1);
      });
      hitArea.on('pointerdown', () => {
        this.scene.start('Game', { recordIndex: i, songIndex: 0 });
      });
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Arrow Keys / WASD to move  •  Space to jump', {
      fontSize: '12px',
      color: '#555566',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  drawRecord(x, y, radius, color, labelColor) {
    const container = this.add.container(x, y);

    const g = this.add.graphics();
    // Outer disc
    g.fillStyle(0x111122, 1);
    g.fillCircle(0, 0, radius);
    // Grooves
    for (let r = radius - 5; r > radius * 0.4; r -= 6) {
      g.lineStyle(1, 0x222244, 0.4);
      g.strokeCircle(0, 0, r);
    }
    // Label
    g.fillStyle(labelColor, 1);
    g.fillCircle(0, 0, radius * 0.3);
    // Center hole
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(0, 0, 4);

    container.add(g);

    this.tweens.add({
      targets: container,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear',
    });

    return container;
  }
}
