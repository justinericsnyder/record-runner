import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { RECORDS } from '../levels.js';
import { getTopScores } from '../scores.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  init(data) {
    this.selectedRecord = data.recordIndex || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Back button
    const backBtn = this.add.text(20, 20, '← Back', {
      fontSize: '14px', color: '#888899', fontFamily: 'monospace',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));
    backBtn.on('pointerover', () => backBtn.setColor('#e94560'));
    backBtn.on('pointerout', () => backBtn.setColor('#888899'));

    const record = RECORDS[this.selectedRecord];

    // Record title
    this.add.text(GAME_WIDTH / 2, 30, record.name, {
      fontSize: '28px', color: '#e94560', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, `${record.songs.length} tracks`, {
      fontSize: '13px', color: '#666677', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Mini spinning record
    this.drawMiniRecord(GAME_WIDTH / 2, 140, 60, record);

    // Track list
    const listY = 220;
    const rowH = 42;
    const listW = Math.min(600, GAME_WIDTH - 60);
    const listX = (GAME_WIDTH - listW) / 2;

    this.add.text(listX, listY - 25, 'TRACKLIST', {
      fontSize: '11px', color: '#555566', fontFamily: 'monospace',
    });

    record.songs.forEach((song, i) => {
      const y = listY + i * rowH;

      // Row background
      const bg = this.add.rectangle(GAME_WIDTH / 2, y + rowH / 2, listW, rowH - 4, 0x222240, 0.6)
        .setInteractive({ useHandCursor: true });

      // Track number
      this.add.text(listX + 15, y + 10, `${String(i + 1).padStart(2, '0')}`, {
        fontSize: '14px', color: '#444466', fontFamily: 'monospace',
      });

      // Song name
      const nameText = this.add.text(listX + 50, y + 10, song.name, {
        fontSize: '14px', color: '#ccccdd', fontFamily: 'monospace',
      });

      // BPM
      this.add.text(listX + listW - 15, y + 10, `${song.bpm} BPM`, {
        fontSize: '11px', color: '#666677', fontFamily: 'monospace',
      }).setOrigin(1, 0);

      // Difficulty dots
      const diff = song.platforms ? Math.min(5, Math.ceil(song.platforms.length / 6)) : 1;
      for (let d = 0; d < 5; d++) {
        this.add.circle(listX + listW - 90 + d * 12, y + 16, 4,
          d < diff ? 0xe94560 : 0x333355);
      }

      bg.on('pointerover', () => {
        bg.setFillStyle(0x333355, 0.8);
        nameText.setColor('#e94560');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x222240, 0.6);
        nameText.setColor('#ccccdd');
      });
      bg.on('pointerdown', () => {
        this.scene.start('Spin', {
          recordIndex: this.selectedRecord,
          songIndex: i,
          score: 0,
          lives: 3,
        });
      });
    });

    // High scores section
    const scoresY = listY + record.songs.length * rowH + 30;
    this.add.text(listX, scoresY, 'HIGH SCORES', {
      fontSize: '11px', color: '#555566', fontFamily: 'monospace',
    });

    const scores = getTopScores(5);
    if (scores.length === 0) {
      this.add.text(listX, scoresY + 20, 'No scores yet', {
        fontSize: '12px', color: '#444455', fontFamily: 'monospace',
      });
    } else {
      scores.forEach((s, i) => {
        this.add.text(listX, scoresY + 20 + i * 18,
          `${s.initials}  ${String(s.score).padStart(6, ' ')}`, {
            fontSize: '12px', color: i === 0 ? '#f5c518' : '#888899', fontFamily: 'monospace',
          });
      });
    }
  }

  drawMiniRecord(x, y, r, record) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, r + 2);
    g.fillStyle(0x18182e, 1);
    g.fillCircle(0, 0, r);
    for (let ri = r - 4; ri > r * 0.35; ri -= 6) {
      g.lineStyle(1.5, 0x2a2a44, 1);
      g.strokeCircle(0, 0, ri);
    }
    g.fillStyle(record.labelColor, 1);
    g.fillCircle(0, 0, r * 0.3);
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(0, 0, r * 0.3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, 3);
    container.add(g);
    this.tweens.add({ targets: container, angle: 360, duration: 6000, repeat: -1, ease: 'Linear' });
  }
}
