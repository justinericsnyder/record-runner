import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { RECORDS } from '../levels.js';

export default class SongTransition extends Phaser.Scene {
  constructor() {
    super('SongTransition');
  }

  init(data) {
    this.recordIndex = data.recordIndex;
    this.songIndex = data.songIndex;
    this.score = data.score;
    this.lives = data.lives;
  }

  create() {
    const record = RECORDS[this.recordIndex];
    const song = record.songs[this.songIndex];

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Needle dropping animation
    const needle = this.add.graphics();
    needle.fillStyle(0xcccccc, 1);
    needle.fillRect(0, 0, 4, 120);
    needle.fillStyle(0xe94560, 1);
    needle.fillTriangle(2, 120, -4, 130, 8, 130);
    const needleContainer = this.add.container(GAME_WIDTH / 2 + 100, -50);
    needleContainer.add(needle);

    this.tweens.add({
      targets: needleContainer,
      y: GAME_HEIGHT / 2 - 80,
      angle: -15,
      duration: 1200,
      ease: 'Bounce.easeOut',
    });

    // Song info
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'NOW PLAYING', {
      fontSize: '14px',
      color: '#888899',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, `♪ ${song.name}`, {
      fontSize: '28px',
      color: '#e94560',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const bpmText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105, `${song.bpm} BPM`, {
      fontSize: '14px',
      color: '#f5c518',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);

    // Fade in text
    this.tweens.add({
      targets: [titleText, bpmText],
      alpha: 1,
      duration: 600,
      delay: 800,
    });

    // Auto-advance
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(400, () => {
        this.scene.start('Game', {
          recordIndex: this.recordIndex,
          songIndex: this.songIndex,
          score: this.score,
          lives: this.lives,
        });
      });
    });
  }
}
