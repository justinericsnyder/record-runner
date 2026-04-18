import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { RECORDS } from '../levels.js';
import { getTopScores } from '../scores.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 40, 'RECORD RUNNER', {
      fontSize: '36px', color: '#e94560', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 78, 'Spin the record. Ride the grooves.', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Record grid — 3 columns, 2 rows
    const cols = 3;
    const cellW = 180;
    const cellH = 160;
    const gridW = cols * cellW;
    const startX = (GAME_WIDTH - gridW) / 2 + cellW / 2;
    const startY = 140;

    this.add.text(GAME_WIDTH / 2, startY - 25, 'SELECT A RECORD', {
      fontSize: '12px', color: '#666677', fontFamily: 'monospace',
    }).setOrigin(0.5);

    RECORDS.forEach((record, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH + 30;

      const mini = this.drawRecord(x, y, 40, record.color, record.labelColor);

      const label = this.add.text(x, y + 55, record.name, {
        fontSize: '11px', color: '#ccccdd', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const info = this.add.text(x, y + 72, `${record.songs.length} tracks`, {
        fontSize: '10px', color: '#666677', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(x, y + 20, cellW - 20, cellH - 20, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => { label.setColor('#e94560'); mini.setScale(1.1); });
      hitArea.on('pointerout', () => { label.setColor('#ccccdd'); mini.setScale(1); });
      hitArea.on('pointerdown', () => {
        this.scene.start('LevelSelect', { recordIndex: i });
      });
    });

    // Top scores
    const scoresY = startY + Math.ceil(RECORDS.length / cols) * cellH + 40;
    this.add.text(GAME_WIDTH / 2, scoresY, 'TOP SCORES', {
      fontSize: '12px', color: '#666677', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const scores = getTopScores(5);
    scores.forEach((s, i) => {
      this.add.text(GAME_WIDTH / 2, scoresY + 22 + i * 18,
        `${s.initials}  ${String(s.score).padStart(6, ' ')}`, {
          fontSize: '12px',
          color: i === 0 ? '#f5c518' : '#888899',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18,
      'Drag to spin  •  A/D to move  •  Space to jump', {
        fontSize: '10px', color: '#444455', fontFamily: 'monospace',
      }).setOrigin(0.5);
  }

  drawRecord(x, y, radius, color, labelColor) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, radius + 2);
    g.fillStyle(0x18182e, 1);
    g.fillCircle(0, 0, radius);
    g.fillStyle(0x0e0e1e, 1);
    g.beginPath();
    g.arc(2, 2, radius - 2, 0, Math.PI * 2, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x18182e, 1);
    g.fillCircle(0, 0, radius - 3);
    for (let r = radius - 5; r > radius * 0.4; r -= 6) {
      g.lineStyle(1.5, 0x2a2a44, 1);
      g.strokeCircle(0, 0, r);
    }
    g.fillStyle(labelColor, 1);
    g.fillCircle(0, 0, radius * 0.3);
    g.lineStyle(1.5, 0x000000, 0.5);
    g.strokeCircle(0, 0, radius * 0.3);
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(-radius * 0.08, -radius * 0.08, radius * 0.1);
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, 3);
    container.add(g);
    this.tweens.add({ targets: container, angle: 360, duration: 7000, repeat: -1, ease: 'Linear' });
    return container;
  }
}
