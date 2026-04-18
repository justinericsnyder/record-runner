import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, JUMP_VELOCITY,
  RECORD_CENTER_X, RECORD_CENTER_Y, RECORD_RADIUS, RECORD_ROTATION_SPEED,
} from '../config.js';
import { RECORDS } from '../levels.js';

// Power-up config
const POWERUP_DURATION = 4000; // ms
const POWERUP_COLORS = {
  stop: 0x00ccff,
  slow: 0x88ff44,
  fast: 0xff8800,
};
const POWERUP_LABELS = {
  stop: '⏸ FREEZE',
  slow: '⏪ SLOW',
  fast: '⏩ FAST',
};
const POWERUP_SPEED_MULT = {
  stop: 0,
  slow: 0.35,
  fast: 2.2,
};

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
    this.currentAngle = 0;

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(record.color).rgba);

    this.recordDisc = this.createRecordDisc(record);
    this.createHUD(record, song);

    // Polar definitions
    this.platformDefs = song.platforms.map(p => ({ ...p }));
    this.collectibleDefs = song.collectibles.map(c => ({ ...c, alive: true }));
    this.hazardDefs = song.hazards.map(h => ({ ...h }));
    this.powerupDefs = (song.powerups || []).map(p => ({ ...p, alive: true }));
    this.exitDef = { ...song.exit };
    this.playerStartDef = { ...song.playerStart };

    // Platforms
    this.platformBodies = [];
    this.platformDefs.forEach((def) => {
      const sprite = this.add.rectangle(0, 0, def.width, def.height, 0x44446a, 1);
      sprite.setStrokeStyle(1, 0x6666aa, 0.4);
      this.physics.add.existing(sprite, false);
      sprite.body.setImmovable(true);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = false;
      this.platformBodies.push(sprite);
    });

    // Collectibles
    this.collectibleSprites = [];
    this.collectibleDefs.forEach(() => {
      const note = this.physics.add.sprite(0, 0, 'note').setScale(0.9);
      note.body.setAllowGravity(false);
      note.body.setImmovable(true);
      note.body.moves = false;
      this.collectibleSprites.push(note);
    });

    // Hazards
    this.hazardSprites = [];
    this.hazardDefs.forEach((def) => {
      const hz = this.physics.add.sprite(0, 0, 'hazard');
      hz.setDisplaySize(def.width, 12);
      hz.body.setAllowGravity(false);
      hz.body.setImmovable(true);
      hz.body.moves = false;
      this.hazardSprites.push(hz);
    });

    // Power-ups
    this.powerupSprites = [];
    this.powerupDefs.forEach((def) => {
      const key = `powerup_${def.type}`;
      const pu = this.physics.add.sprite(0, 0, key).setScale(1);
      pu.body.setAllowGravity(false);
      pu.body.setImmovable(true);
      pu.body.moves = false;
      pu.setDepth(5);
      // Bobbing animation
      this.tweens.add({
        targets: pu,
        y: '-=6',
        duration: 600 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.powerupSprites.push(pu);
    });

    // Exit
    this.exitSprite = this.physics.add.sprite(0, 0, 'exit');
    this.exitSprite.body.setAllowGravity(false);
    this.exitSprite.body.setImmovable(true);
    this.exitSprite.body.moves = false;
    this.tweens.add({
      targets: this.exitSprite,
      scaleX: 1.3, scaleY: 1.3,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Position everything
    this.positionAllObjects(0);

    // Player
    const startPos = this.polarToWorld(this.playerStartDef.angle, this.playerStartDef.dist, 0);
    this.player = this.physics.add.sprite(startPos.x, startPos.y - 22, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0.1);
    this.player.body.setSize(22, 30);
    this.player.body.setOffset(3, 2);
    this.player.setDepth(10);

    // Collisions
    this.physics.add.collider(this.player, this.platformBodies, this.onPlatformCollide, null, this);
    this.physics.add.overlap(this.player, this.collectibleSprites, this.collectNote, null, this);
    this.physics.add.overlap(this.player, this.hazardSprites, this.hitHazard, null, this);
    this.physics.add.overlap(this.player, this.exitSprite, this.reachExit, null, this);
    this.physics.add.overlap(this.player, this.powerupSprites, this.collectPowerup, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.coyoteTime = 0;
    this.jumpBufferTime = 0;
    this.isHurt = false;
    this.exitReached = false;
    this.recordStarted = false;
    this.standingOnPlatform = false;

    // Power-up state
    this.activePowerup = null;       // { type, timer }
    this.speedMultiplier = 1;

    // Start prompt
    this.startPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40,
      '← → to move  •  ↑ / Space to jump', {
        fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: this.startPrompt, alpha: 0.3,
      duration: 800, yoyo: true, repeat: -1,
    });

    // Particles
    this.noteParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      lifespan: 400,
      tint: 0xf5c518,
      emitting: false,
    });
    this.powerupParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 30, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      emitting: false,
    });
  }

  polarToWorld(angle, dist, rotation) {
    const a = angle + rotation;
    return {
      x: RECORD_CENTER_X + Math.cos(a) * dist,
      y: RECORD_CENTER_Y + Math.sin(a) * dist,
    };
  }

  positionAllObjects(rotation) {
    this.platformDefs.forEach((def, i) => {
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.platformBodies[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = def.angle + rotation + (def.tilt || 0);
      sprite.body.reset(pos.x, pos.y);
    });

    this.collectibleDefs.forEach((def, i) => {
      if (!def.alive) return;
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.collectibleSprites[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.body.reset(pos.x, pos.y);
    });

    this.hazardDefs.forEach((def, i) => {
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.hazardSprites[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = def.angle + rotation;
      sprite.body.reset(pos.x, pos.y);
    });

    this.powerupDefs.forEach((def, i) => {
      if (!def.alive) return;
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.powerupSprites[i];
      // Keep base position for the bobbing tween to offset from
      sprite.setData('baseX', pos.x);
      sprite.setData('baseY', pos.y);
      sprite.x = pos.x;
      // y is managed by tween offset, but we reset the base
      sprite.body.reset(pos.x, sprite.y);
    });

    const exitPos = this.polarToWorld(this.exitDef.angle, this.exitDef.dist, rotation);
    this.exitSprite.x = exitPos.x;
    this.exitSprite.y = exitPos.y;
    this.exitSprite.body.reset(exitPos.x, exitPos.y);
  }

  createRecordDisc(record) {
    const cx = RECORD_CENTER_X;
    const cy = RECORD_CENTER_Y;
    const container = this.add.container(cx, cy);
    const g = this.add.graphics();

    // Outer edge bevel
    g.fillStyle(0x0a0a18, 1);
    g.fillCircle(0, 0, RECORD_RADIUS + 3);
    // Main disc
    g.fillStyle(0x111122, 1);
    g.fillCircle(0, 0, RECORD_RADIUS);
    // Grooves with varying opacity for realism
    for (let r = RECORD_RADIUS - 4; r > 65; r -= 5) {
      const alpha = 0.02 + Math.sin(r * 0.1) * 0.015;
      g.lineStyle(1, 0xffffff, alpha);
      g.strokeCircle(0, 0, r);
    }
    // Subtle sheen (light reflection arc)
    g.lineStyle(2, 0xffffff, 0.06);
    g.beginPath();
    g.arc(0, 0, RECORD_RADIUS * 0.7, -0.8, -0.3, false);
    g.strokePath();
    g.lineStyle(1, 0xffffff, 0.04);
    g.beginPath();
    g.arc(0, 0, RECORD_RADIUS * 0.5, -0.9, -0.2, false);
    g.strokePath();
    // Label
    g.fillStyle(record.labelColor, 0.18);
    g.fillCircle(0, 0, 70);
    g.lineStyle(1, record.labelColor, 0.1);
    g.strokeCircle(0, 0, 60);
    // Center hole
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(0, 0, 8);
    g.lineStyle(1, 0x333344, 0.5);
    g.strokeCircle(0, 0, 8);

    container.add(g);
    container.setDepth(-1);
    return container;
  }

  createHUD(record, song) {
    const d = 100;
    this.add.text(12, 10, record.name, {
      fontSize: '12px', color: '#888899', fontFamily: 'monospace',
    }).setDepth(d);
    this.add.text(12, 28, `♪ ${song.name}`, {
      fontSize: '16px', color: '#e94560', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(d);
    this.add.text(12, 50, `Track ${this.songIndex + 1} / ${record.songs.length}`, {
      fontSize: '11px', color: '#666677', fontFamily: 'monospace',
    }).setDepth(d);
    this.scoreText = this.add.text(GAME_WIDTH - 12, 10, `Score: ${this.score}`, {
      fontSize: '14px', color: '#f5c518', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(d);
    this.livesText = this.add.text(GAME_WIDTH - 12, 30, `♥ ${this.lives}`, {
      fontSize: '14px', color: '#e94560', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(d);

    // Power-up indicator (hidden until active)
    this.powerupText = this.add.text(GAME_WIDTH / 2, 14, '', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(d).setAlpha(0);

    this.powerupTimerBar = this.add.rectangle(GAME_WIDTH / 2, 36, 120, 6, 0xffffff, 0.5)
      .setOrigin(0.5, 0).setDepth(d).setVisible(false);
  }

  onPlatformCollide() {
    this.standingOnPlatform = true;
  }

  // ── Power-up logic ──

  collectPowerup(player, puSprite) {
    const idx = this.powerupSprites.indexOf(puSprite);
    if (idx < 0 || !this.powerupDefs[idx].alive) return;

    this.powerupDefs[idx].alive = false;
    puSprite.destroy();

    const type = this.powerupDefs[idx].type;
    const color = POWERUP_COLORS[type];

    // Particle burst
    this.powerupParticles.setParticleTint(color);
    this.powerupParticles.emitParticleAt(puSprite.x, puSprite.y, 12);

    // Activate effect
    this.activatePowerup(type);

    this.score += 50;
    this.scoreText.setText(`Score: ${this.score}`);
    this.cameras.main.flash(100,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff, true);
  }

  activatePowerup(type) {
    // Cancel existing power-up timer if any
    if (this.activePowerup && this.activePowerup.timerEvent) {
      this.activePowerup.timerEvent.remove(false);
    }

    this.speedMultiplier = POWERUP_SPEED_MULT[type];
    const color = POWERUP_COLORS[type];

    // HUD indicator
    this.powerupText.setText(POWERUP_LABELS[type]);
    this.powerupText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.powerupText.setAlpha(1);
    this.powerupTimerBar.setVisible(true);
    this.powerupTimerBar.setFillStyle(color, 0.6);
    this.powerupTimerBar.setSize(120, 6);

    // Shrink the timer bar over the duration
    this.tweens.killTweensOf(this.powerupTimerBar);
    this.tweens.add({
      targets: this.powerupTimerBar,
      displayWidth: 0,
      duration: POWERUP_DURATION,
      ease: 'Linear',
    });

    // Flash the text near the end
    this.time.delayedCall(POWERUP_DURATION - 1000, () => {
      if (this.activePowerup && this.activePowerup.type === type) {
        this.tweens.add({
          targets: this.powerupText,
          alpha: 0.3,
          duration: 150,
          yoyo: true,
          repeat: 4,
        });
      }
    });

    const timerEvent = this.time.delayedCall(POWERUP_DURATION, () => {
      this.deactivatePowerup();
    });

    this.activePowerup = { type, timerEvent };
  }

  deactivatePowerup() {
    this.speedMultiplier = 1;
    this.activePowerup = null;
    this.powerupText.setAlpha(0);
    this.powerupTimerBar.setVisible(false);
  }

  // ── Main update loop ──

  update(time, delta) {
    if (this.exitReached) return;

    const dt = delta / 1000;

    // Input
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.space);

    if (!this.recordStarted && (left || right || jumpPressed)) {
      this.recordStarted = true;
      if (this.startPrompt) {
        this.startPrompt.destroy();
        this.startPrompt = null;
      }
    }

    // Advance rotation with speed multiplier from power-ups
    if (this.recordStarted) {
      this.currentAngle += RECORD_ROTATION_SPEED * this.speedMultiplier * dt;
    }

    this.recordDisc.setAngle(Phaser.Math.RadToDeg(this.currentAngle));
    this.positionAllObjects(this.currentAngle);

    if (this.isHurt) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    if (onGround) {
      this.coyoteTime = 100;
    } else {
      this.coyoteTime -= delta;
    }

    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      if (onGround && this.standingOnPlatform) {
        const dx = this.player.x - RECORD_CENTER_X;
        const dy = this.player.y - RECORD_CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const effectiveSpeed = RECORD_ROTATION_SPEED * this.speedMultiplier;
        const tangentSpeed = effectiveSpeed * dist;
        const angle = Math.atan2(dy, dx);
        const vx = -Math.sin(angle) * tangentSpeed;
        const vy = Math.cos(angle) * tangentSpeed;
        this.player.setVelocityX(vx);
        if (vy < 0) {
          this.player.body.velocity.y += vy * 0.3;
        }
      } else {
        this.player.setVelocityX(this.player.body.velocity.x * 0.85);
      }
    }

    if (jumpPressed) {
      this.jumpBufferTime = 100;
    } else {
      this.jumpBufferTime -= delta;
    }

    if (this.jumpBufferTime > 0 && this.coyoteTime > 0) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.coyoteTime = 0;
      this.jumpBufferTime = 0;
    }

    this.standingOnPlatform = false;

    const dx = this.player.x - RECORD_CENTER_X;
    const dy = this.player.y - RECORD_CENTER_Y;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    if (this.player.y > GAME_HEIGHT + 80 || distFromCenter > RECORD_RADIUS + 100) {
      this.playerDie();
    }
  }

  collectNote(player, note) {
    const idx = this.collectibleSprites.indexOf(note);
    if (idx >= 0) this.collectibleDefs[idx].alive = false;
    note.destroy();
    this.score += 100;
    this.scoreText.setText(`Score: ${this.score}`);
    this.noteParticles.emitParticleAt(note.x, note.y, 8);
    this.cameras.main.flash(80, 245, 197, 24, true);
  }

  hitHazard(player, hazard) {
    if (this.isHurt) return;
    this.isHurt = true;
    this.lives--;
    this.livesText.setText(`♥ ${this.lives}`);
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
      this.scene.restart({
        recordIndex: this.recordIndex,
        songIndex: this.songIndex,
        score: this.score,
        lives: this.lives,
      });
    }
  }

  reachExit(player, exit) {
    if (this.exitReached) return;
    this.exitReached = true;
    this.physics.world.disable(exit);
    this.score += 500;
    this.cameras.main.flash(300, 0, 255, 136);

    const record = RECORDS[this.recordIndex];
    const nextSong = this.songIndex + 1;

    this.time.delayedCall(600, () => {
      if (nextSong < record.songs.length) {
        this.scene.start('SongTransition', {
          recordIndex: this.recordIndex,
          songIndex: nextSong,
          score: this.score,
          lives: this.lives,
        });
      } else {
        const nextRecord = this.recordIndex + 1;
        if (nextRecord < RECORDS.length) {
          this.scene.start('RecordComplete', {
            recordIndex: this.recordIndex,
            nextRecordIndex: nextRecord,
            score: this.score,
            lives: this.lives,
          });
        } else {
          this.scene.start('Victory', { score: this.score });
        }
      }
    });
  }
}
