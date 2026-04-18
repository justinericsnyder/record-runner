import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { addScore } from '../scores.js';
import { isClean, sanitize } from '../profanity.js';

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

    const g = this.add.graphics();
    g.fillStyle(0x111122, 0.6);
    g.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 120);
    g.lineStyle(3, 0xff2222, 0.6);
    g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, GAME_WIDTH / 2 + 80, GAME_HEIGHT / 2 - 120);
    g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 + 40);

    this.add.text(GAME_WIDTH / 2, 60, 'RECORD SCRATCHED', {
      fontSize: '28px', color: '#e94560', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, `Score: ${this.finalScore}`, {
      fontSize: '22px', color: '#f5c518', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Initials input
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, 'Enter initials:', {
      fontSize: '13px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.initials = '';
    this.initialsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 158, '_ _ _', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.errorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 188, '', {
      fontSize: '11px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.saved = false;

    // Keyboard input for initials
    this.input.keyboard.on('keydown', (event) => {
      if (this.saved) return;
      const key = event.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && this.initials.length < 3) {
        this.initials += key;
        this.updateInitialsDisplay();
      } else if (event.key === 'Backspace' && this.initials.length > 0) {
        this.initials = this.initials.slice(0, -1);
        this.updateInitialsDisplay();
      } else if (event.key === 'Enter' && this.initials.length === 3) {
        this.saveScore();
      }
    });

    // Save button
    this.saveBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, '[ SAVE SCORE ]', {
      fontSize: '16px', color: '#00ff88', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.saveBtn.on('pointerdown', () => this.saveScore());
    this.saveBtn.on('pointerover', () => this.saveBtn.setColor('#88ffbb'));
    this.saveBtn.on('pointerout', () => this.saveBtn.setColor('#00ff88'));

    // Retry / Menu buttons (below save)
    const retryBtn = this.add.text(GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 + 260, '[ RETRY ]', {
      fontSize: '14px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerdown', () => this.scene.start('Spin', { recordIndex: this.recordIndex, songIndex: 0, score: 0, lives: 3 }));
    retryBtn.on('pointerover', () => retryBtn.setColor('#ccccdd'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#888899'));

    const menuBtn = this.add.text(GAME_WIDTH / 2 + 80, GAME_HEIGHT / 2 + 260, '[ MENU ]', {
      fontSize: '14px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
    menuBtn.on('pointerover', () => menuBtn.setColor('#ccccdd'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888899'));
  }

  updateInitialsDisplay() {
    const display = this.initials.padEnd(3, '_').split('').join(' ');
    this.initialsText.setText(display);
    this.errorText.setText('');
  }

  saveScore() {
    if (this.saved) return;
    if (this.initials.length < 3) {
      this.errorText.setText('Enter 3 letters');
      return;
    }
    const clean = sanitize(this.initials);
    if (!isClean(clean)) {
      this.errorText.setText('Please choose different initials');
      this.initials = '';
      this.updateInitialsDisplay();
      return;
    }
    addScore(clean, this.finalScore, this.recordIndex, 0);
    this.saved = true;
    this.saveBtn.setText('✓ Saved!');
    this.saveBtn.setColor('#888899');
    this.saveBtn.disableInteractive();
  }
}
