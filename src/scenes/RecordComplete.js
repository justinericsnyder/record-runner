import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { RECORDS } from '../levels.js';

export default class RecordComplete extends Phaser.Scene {
  constructor() {
    super('RecordComplete');
  }

  init(data) {
    this.recordIndex = data.recordIndex;
    this.nextRecordIndex = data.nextRecordIndex;
    this.score = data.score;
    this.lives = data.lives;
  }

  create() {
    const record = RECORDS[this.recordIndex];
    const nextRecord = RECORDS[this.nextRecordIndex];

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Completed record spins off
    const completedContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const cg = this.add.graphics();
    cg.fillStyle(0x111122, 1);
    cg.fillCircle(0, 0, 100);
    for (let r = 95; r > 35; r -= 6) {
      cg.lineStyle(1, 0x222244, 0.4);
      cg.strokeCircle(0, 0, r);
    }
    cg.fillStyle(record.labelColor, 1);
    cg.fillCircle(0, 0, 30);
    cg.fillStyle(0x1a1a2e, 1);
    cg.fillCircle(0, 0, 4);
    completedContainer.add(cg);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, 'SIDE COMPLETE', {
      fontSize: '24px',
      color: '#00ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, record.name, {
      fontSize: '16px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Spin and shrink completed record
    this.tweens.add({
      targets: completedContainer,
      angle: 720,
      scale: 0,
      x: -100,
      duration: 1500,
      delay: 1000,
      ease: 'Cubic.easeIn',
    });

    // Next record info
    const nextText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, `Next: ${nextRecord.name}`, {
      fontSize: '18px',
      color: '#e94560',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: nextText,
      alpha: 1,
      duration: 600,
      delay: 2000,
    });

    // Score display
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, `Score: ${this.score}`, {
      fontSize: '14px',
      color: '#f5c518',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Auto-advance
    this.time.delayedCall(3500, () => {
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('SongTransition', {
          recordIndex: this.nextRecordIndex,
          songIndex: 0,
          score: this.score,
          lives: this.lives,
        });
      });
    });
  }
}
