import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, JUMP_VELOCITY } from '../config.js';
import { RECORDS } from '../levels.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.recordIndex = data.recordIndex || 0;
    this.songIndex = data.songIndex || 0;
    this.score = data.score || 0;
    this.lives = data.lives !== undefined ? data.lives : 3;
  }

  create() {
    const record = RECORDS[this.recordIndex];
    const song = record.songs[this.songIndex];

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(record.color).rgba);

    // Draw spinning record background
    this.createRecordBackground(record);

    // HUD
    this.createHUD(record, song);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    song.platforms.forEach(([x, y, w, h]) => {
      this.createPlatform(x, y, w, h);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    song.collectibles.forEach(([x, y]) => {
      const note = this.collectibles.create(x, y, 'note');
      note.body.setAllowGravity(false);
      note.setScale(0.9);
      this.tweens.add({
        targets: note,
        y: y - 8,
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Hazards
    this.hazards = this.physics.add.staticGroup();
    song.hazards.forEach(([x, y, w]) => {
      const hz = this.hazards.create(x + w / 2, y - 4, 'hazard');
      hz.setDisplaySize(w, 8);
      hz.refreshBody();
    });

    // Exit
    this.exit = this.physics.add.sprite(song.exit[0], song.exit[1], 'exit');
    this.exit.body.setAllowGravity(false);
    this.exit.setImmovable(true);
    this.tweens.add({
      targets: this.exit,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Player
    this.player = this.physics.add.sprite(song.playerStart[0], song.playerStart[1], 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0.1);
    this.player.body.setSize(20, 34);
    this.player.body.setOffset(2, 2);

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.player, this.hazards, this.hitHazard, null, this);
    this.physics.add.overlap(this.player, this.exit, this.reachExit, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Track if we can jump (coyote time)
    this.coyoteTime = 0;
    this.jumpBufferTime = 0;
    this.isHurt = false;

    // Particles for collecting notes
    this.noteParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      tint: 0xf5c518,
      emitting: false,
    });
  }

  createRecordBackground(record) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const container = this.add.container(cx, cy);

    const g = this.add.graphics();
    // Outer disc
    g.fillStyle(0x000000, 0.15);
    g.fillCircle(0, 0, 350);
    // Grooves
    for (let r = 340; r > 80; r -= 8) {
      g.lineStyle(1, 0xffffff, 0.03);
      g.strokeCircle(0, 0, r);
    }
    // Label area
    g.fillStyle(record.labelColor, 0.08);
    g.fillCircle(0, 0, 80);
    // Center hole
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(0, 0, 8);

    container.add(g);
    container.setDepth(-1);

    this.tweens.add({
      targets: container,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  createHUD(record, song) {
    // Song info
    this.add.text(12, 10, `${record.name}`, {
      fontSize: '12px',
      color: '#888899',
      fontFamily: 'monospace',
    });
    this.add.text(12, 28, `♪ ${song.name}`, {
      fontSize: '16px',
      color: '#e94560',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    // Track progress
    const totalSongs = record.songs.length;
    this.add.text(12, 50, `Track ${this.songIndex + 1} / ${totalSongs}`, {
      fontSize: '11px',
      color: '#666677',
      fontFamily: 'monospace',
    });

    // Score
    this.scoreText = this.add.text(GAME_WIDTH - 12, 10, `Score: ${this.score}`, {
      fontSize: '14px',
      color: '#f5c518',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // Lives
    this.livesText = this.add.text(GAME_WIDTH - 12, 30, `♥ ${this.lives}`, {
      fontSize: '14px',
      color: '#e94560',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
  }

  createPlatform(x, y, w, h) {
    // Create a tiled platform from the base texture
    const tilesNeeded = Math.ceil(w / 64);
    for (let i = 0; i < tilesNeeded; i++) {
      const tileX = x + i * 64 + 32;
      const tileY = y + h / 2;
      const plat = this.platforms.create(tileX, tileY, 'platform');
      // Scale to fit if last tile
      if (i === tilesNeeded - 1) {
        const remaining = w - i * 64;
        plat.setDisplaySize(remaining, h);
      } else {
        plat.setDisplaySize(64, h);
      }
      plat.refreshBody();
    }
  }

  update(time, delta) {
    if (this.isHurt) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    // Coyote time
    if (onGround) {
      this.coyoteTime = 80; // ms
    } else {
      this.coyoteTime -= delta;
    }

    // Movement
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.space);

    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump buffer
    if (jumpPressed) {
      this.jumpBufferTime = 100;
    } else {
      this.jumpBufferTime -= delta;
    }

    // Jump
    if (this.jumpBufferTime > 0 && this.coyoteTime > 0) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.coyoteTime = 0;
      this.jumpBufferTime = 0;
    }

    // Fall off screen
    if (this.player.y > GAME_HEIGHT + 50) {
      this.playerDie();
    }
  }

  collectNote(player, note) {
    note.destroy();
    this.score += 100;
    this.scoreText.setText(`Score: ${this.score}`);

    // Particle burst
    this.noteParticles.emitParticleAt(note.x, note.y, 8);

    // Quick flash
    this.cameras.main.flash(80, 245, 197, 24, true);
  }

  hitHazard(player, hazard) {
    if (this.isHurt) return;
    this.isHurt = true;
    this.lives--;
    this.livesText.setText(`♥ ${this.lives}`);

    // Knockback
    player.setVelocityY(-250);
    player.setTint(0xff0000);
    this.cameras.main.shake(200, 0.01);

    if (this.lives <= 0) {
      this.time.delayedCall(500, () => {
        this.scene.start('GameOver', { score: this.score, recordIndex: this.recordIndex });
      });
    } else {
      this.time.delayedCall(600, () => {
        player.clearTint();
        this.isHurt = false;
      });
    }
  }

  playerDie() {
    this.lives--;
    if (this.lives <= 0) {
      this.scene.start('GameOver', { score: this.score, recordIndex: this.recordIndex });
    } else {
      // Restart current song
      this.scene.restart({
        recordIndex: this.recordIndex,
        songIndex: this.songIndex,
        score: this.score,
        lives: this.lives,
      });
    }
  }

  reachExit(player, exit) {
    // Prevent multiple triggers
    this.physics.world.disable(exit);

    // Score bonus
    this.score += 500;

    // Flash and transition
    this.cameras.main.flash(300, 0, 255, 136);

    const record = RECORDS[this.recordIndex];
    const nextSong = this.songIndex + 1;

    this.time.delayedCall(600, () => {
      if (nextSong < record.songs.length) {
        // Next song on same record
        this.scene.start('SongTransition', {
          recordIndex: this.recordIndex,
          songIndex: nextSong,
          score: this.score,
          lives: this.lives,
        });
      } else {
        // Record complete
        const nextRecord = this.recordIndex + 1;
        if (nextRecord < RECORDS.length) {
          this.scene.start('RecordComplete', {
            recordIndex: this.recordIndex,
            nextRecordIndex: nextRecord,
            score: this.score,
            lives: this.lives,
          });
        } else {
          // Game complete!
          this.scene.start('Victory', { score: this.score });
        }
      }
    });
  }
}
