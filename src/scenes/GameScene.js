import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY, PLAYER_SPEED, JUMP_VELOCITY,
  RECORD_CENTER_X, RECORD_CENTER_Y, RECORD_RADIUS, RECORD_ROTATION_SPEED,
} from '../config.js';
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
    this.currentAngle = 0; // current rotation of the record in radians

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(record.color).rgba);

    // Draw the record disc (visual only, spins via tween)
    this.recordDisc = this.createRecordDisc(record);

    // HUD (on top of everything)
    this.createHUD(record, song);

    // Store polar definitions so we can reposition every frame
    this.platformDefs = song.platforms.map(p => ({ ...p }));
    this.collectibleDefs = song.collectibles.map(c => ({ ...c, alive: true }));
    this.hazardDefs = song.hazards.map(h => ({ ...h }));
    this.exitDef = { ...song.exit };
    this.playerStartDef = { ...song.playerStart };

    // Create platform physics bodies (kinematic — we move them manually)
    this.platformBodies = [];
    this.platformDefs.forEach((def) => {
      const sprite = this.add.rectangle(0, 0, def.width, def.height, 0x333355, 1);
      sprite.setStrokeStyle(1, 0x555577, 0.5);
      const body = this.physics.add.existing(sprite, false);
      sprite.body.setImmovable(true);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = false;
      this.platformBodies.push(sprite);
    });

    // Collectible sprites
    this.collectibleSprites = [];
    this.collectibleDefs.forEach(() => {
      const note = this.physics.add.sprite(0, 0, 'note').setScale(0.9);
      note.body.setAllowGravity(false);
      note.body.setImmovable(true);
      note.body.moves = false;
      this.collectibleSprites.push(note);
    });

    // Hazard sprites
    this.hazardSprites = [];
    this.hazardDefs.forEach((def) => {
      const hz = this.physics.add.sprite(0, 0, 'hazard');
      hz.setDisplaySize(def.width, 8);
      hz.body.setAllowGravity(false);
      hz.body.setImmovable(true);
      hz.body.moves = false;
      this.hazardSprites.push(hz);
    });

    // Exit sprite
    this.exitSprite = this.physics.add.sprite(0, 0, 'exit');
    this.exitSprite.body.setAllowGravity(false);
    this.exitSprite.body.setImmovable(true);
    this.exitSprite.body.moves = false;
    this.tweens.add({
      targets: this.exitSprite,
      scaleX: 1.2, scaleY: 1.2,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Position everything at angle 0
    this.positionAllObjects(0);

    // Player — spawns at the starting platform position
    const startPos = this.polarToWorld(this.playerStartDef.angle, this.playerStartDef.dist, 0);
    this.player = this.physics.add.sprite(startPos.x, startPos.y - 25, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0.1);
    this.player.body.setSize(20, 34);
    this.player.body.setOffset(2, 2);
    this.player.setDepth(10);

    // Collisions
    this.physics.add.collider(this.player, this.platformBodies, this.onPlatformCollide, null, this);
    this.physics.add.overlap(this.player, this.collectibleSprites, this.collectNote, null, this);
    this.physics.add.overlap(this.player, this.hazardSprites, this.hitHazard, null, this);
    this.physics.add.overlap(this.player, this.exitSprite, this.reachExit, null, this);

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
    this.recordStarted = false; // rotation doesn't begin until first input

    // "Press to start" prompt
    this.startPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40,
      '← → to move  •  ↑ / Space to jump', {
        fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: this.startPrompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Particles
    this.noteParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0 },
      lifespan: 400,
      tint: 0xf5c518,
      emitting: false,
    });
  }

  /** Convert polar (angle, dist) + current record rotation to screen x,y */
  polarToWorld(angle, dist, rotation) {
    const a = angle + rotation;
    return {
      x: RECORD_CENTER_X + Math.cos(a) * dist,
      y: RECORD_CENTER_Y + Math.sin(a) * dist,
    };
  }

  /** Reposition all rotating objects based on current record angle */
  positionAllObjects(rotation) {
    // Platforms
    this.platformDefs.forEach((def, i) => {
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.platformBodies[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = def.angle + rotation;
      sprite.body.reset(pos.x, pos.y);
    });

    // Collectibles
    this.collectibleDefs.forEach((def, i) => {
      if (!def.alive) return;
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.collectibleSprites[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.body.reset(pos.x, pos.y);
    });

    // Hazards
    this.hazardDefs.forEach((def, i) => {
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.hazardSprites[i];
      sprite.x = pos.x;
      sprite.y = pos.y;
      sprite.rotation = def.angle + rotation;
      sprite.body.reset(pos.x, pos.y);
    });

    // Exit
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
    // Outer disc
    g.fillStyle(0x111122, 1);
    g.fillCircle(0, 0, RECORD_RADIUS);
    // Grooves
    for (let r = RECORD_RADIUS - 5; r > 60; r -= 7) {
      g.lineStyle(1, 0xffffff, 0.04);
      g.strokeCircle(0, 0, r);
    }
    // Label
    g.fillStyle(record.labelColor, 0.15);
    g.fillCircle(0, 0, 55);
    // Center hole
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(0, 0, 6);

    container.add(g);
    container.setDepth(-1);

    // The visual disc spins via tween (synced with our angle in update)
    return container;
  }

  createHUD(record, song) {
    const hudDepth = 100;
    this.add.text(12, 10, `${record.name}`, {
      fontSize: '12px', color: '#888899', fontFamily: 'monospace',
    }).setDepth(hudDepth);
    this.add.text(12, 28, `♪ ${song.name}`, {
      fontSize: '16px', color: '#e94560', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(hudDepth);
    const totalSongs = record.songs.length;
    this.add.text(12, 50, `Track ${this.songIndex + 1} / ${totalSongs}`, {
      fontSize: '11px', color: '#666677', fontFamily: 'monospace',
    }).setDepth(hudDepth);
    this.scoreText = this.add.text(GAME_WIDTH - 12, 10, `Score: ${this.score}`, {
      fontSize: '14px', color: '#f5c518', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(hudDepth);
    this.livesText = this.add.text(GAME_WIDTH - 12, 30, `♥ ${this.lives}`, {
      fontSize: '14px', color: '#e94560', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(hudDepth);
  }

  onPlatformCollide(player, platform) {
    // When standing on a rotating platform, carry the player along
    // We store a flag so update() can apply rotational velocity
    this.standingOnPlatform = true;
  }

  update(time, delta) {
    if (this.exitReached) return;

    const dt = delta / 1000;

    // Detect first input to start the record spinning
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

    // Only advance rotation once the player has moved
    if (this.recordStarted) {
      this.currentAngle += RECORD_ROTATION_SPEED * dt;
    }

    // Sync visual disc
    this.recordDisc.setAngle(Phaser.Math.RadToDeg(this.currentAngle));

    // Reposition all objects
    this.positionAllObjects(this.currentAngle);

    if (this.isHurt) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    // Coyote time
    if (onGround) {
      this.coyoteTime = 100;
    } else {
      this.coyoteTime -= delta;
    }

    // Input already read above

    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      // When standing on a rotating platform, inherit some rotational motion
      if (onGround && this.standingOnPlatform) {
        // Approximate tangential velocity at player's distance from center
        const dx = this.player.x - RECORD_CENTER_X;
        const dy = this.player.y - RECORD_CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const tangentSpeed = RECORD_ROTATION_SPEED * dist;
        // Tangent direction (perpendicular to radius)
        const angle = Math.atan2(dy, dx);
        const vx = -Math.sin(angle) * tangentSpeed;
        const vy = Math.cos(angle) * tangentSpeed;
        this.player.setVelocityX(vx);
        // Only apply vertical component if it won't fight gravity too much
        if (vy < 0) {
          this.player.body.velocity.y += vy * 0.3;
        }
      } else {
        this.player.setVelocityX(this.player.body.velocity.x * 0.85); // friction in air
      }
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

    // Reset platform standing flag (re-set by collision callback)
    this.standingOnPlatform = false;

    // Fall off screen or too far from record
    const dx = this.player.x - RECORD_CENTER_X;
    const dy = this.player.y - RECORD_CENTER_Y;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    if (this.player.y > GAME_HEIGHT + 60 || distFromCenter > RECORD_RADIUS + 80) {
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
