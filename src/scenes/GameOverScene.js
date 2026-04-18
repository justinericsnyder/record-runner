import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.recordIndex = data.recordIndex || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Broken record visual
    const g = this.add.graphics();
    g.fillStyle(0x111122, 0.6);
    g.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 120);
    // Crack lines
    g.lineStyle(3, 0xff2222, 0.6);
    g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, GAME_WIDTH / 2 + 80, GAME_HEIGHT / 2 - 100);
    g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 + 60);
    g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, GAME_WIDTH / 2 + 40, GAME_HEIGHT / 2 + 70);

    this.add.text(GAME_WIDTH / 2, 80, 'RECORD SCRATCHED', {
      fontSize: '32px',
      color: '#e94560',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, `Final Score: ${this.finalScore}`, {
      fontSize: '20px',
      color: '#f5c518',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, '[ RETRY ]', {
      fontSize: '20px',
      color: '#00ff88',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#88ffbb'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#00ff88'));
    retryBtn.on('pointerdown', () => {
      this.scene.start('Spin', {
        recordIndex: this.recordIndex,
        songIndex: 0,
        score: 0,
        lives: 3,
      });
    });

    // Menu button
    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, '[ MENU ]', {
      fontSize: '16px',
      color: '#888899',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ccccdd'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888899'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('Menu');
    });
  }
}
