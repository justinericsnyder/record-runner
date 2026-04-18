import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Golden spinning record
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    const g = this.add.graphics();
    g.fillStyle(0x222233, 1);
    g.fillCircle(0, 0, 130);
    for (let r = 125; r > 45; r -= 6) {
      g.lineStyle(1, 0xf5c518, 0.08);
      g.strokeCircle(0, 0, r);
    }
    g.fillStyle(0xf5c518, 1);
    g.fillCircle(0, 0, 40);
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(0, 0, 6);
    container.add(g);

    this.tweens.add({
      targets: container,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });

    this.add.text(GAME_WIDTH / 2, 50, 'ALL RECORDS COMPLETE!', {
      fontSize: '28px',
      color: '#f5c518',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 90, 'You played through the whole collection', {
      fontSize: '13px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, `Final Score: ${this.finalScore}`, {
      fontSize: '24px',
      color: '#f5c518',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Floating notes celebration
    for (let i = 0; i < 20; i++) {
      const note = this.add.image(
        Phaser.Math.Between(50, GAME_WIDTH - 50),
        Phaser.Math.Between(GAME_HEIGHT, GAME_HEIGHT + 200),
        'note'
      ).setAlpha(0.6).setScale(Phaser.Math.FloatBetween(0.5, 1.2));

      this.tweens.add({
        targets: note,
        y: -30,
        x: note.x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          note.y = GAME_HEIGHT + 30;
          note.setAlpha(0.6);
        },
      });
    }

    // Menu button
    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ PLAY AGAIN ]', {
      fontSize: '18px',
      color: '#00ff88',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#88ffbb'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#00ff88'));
    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
  }
}
