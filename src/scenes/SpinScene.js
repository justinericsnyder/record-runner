import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, GRAVITY,
  RECORD_CENTER_X, RECORD_CENTER_Y, RECORD_RADIUS,
} from '../config.js';
import { RECORDS } from '../levels.js';

/**
 * Spin Mode — you rotate the record by click-dragging.
 * The player is passive — only gravity, collisions, and
 * momentum from the rotating platforms move it toward the exit.
 *
 * Platforms use velocity-based movement (not teleporting) so
 * Arcade physics properly resolves collisions during rotation.
 */
export default class SpinScene extends Phaser.Scene {
  constructor() {
    super('Spin');
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
    this.prevAngle = 0;
    this.angularVelocity = 0;

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(record.color).rgba);

    this.recordDisc = this.createRecordDisc(record);
    this.createHUD(record, song);

    // Level data
    this.platformDefs = song.platforms.map(p => ({ ...p }));
    this.collectibleDefs = song.collectibles.map(c => ({ ...c, alive: true }));
    this.hazardDefs = song.hazards.map(h => ({ ...h }));
    this.powerupDefs = (song.powerups || []).map(p => ({ ...p, alive: true }));
    this.exitDef = { ...song.exit };
    this.playerStartDef = { ...song.playerStart };

    // Platforms — moves=true so they use velocity for physics resolution
    this.platformBodies = [];
    this.platformDefs.forEach((def) => {
      const sprite = this.physics.add.sprite(0, 0, 'platform');
      sprite.setDisplaySize(def.width, def.height);
      sprite.body.setImmovable(true);
      sprite.body.setAllowGravity(false);
      sprite.body.moves = true;
      sprite.body.pushable = false;
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
    this.powerupDefs.forEach((def, idx) => {
      const pu = this.physics.add.sprite(0, 0, `powerup_${def.type}`).setScale(1);
      pu.body.setAllowGravity(false);
      pu.body.setImmovable(true);
      pu.body.moves = false;
      pu.setDepth(5);
      pu.setData('bobOffset', idx * 1.7);
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

    // Initial placement (teleport is fine for frame 0)
    this.teleportAllObjects(0);

    // Player
    const startPos = this.polarToWorld(this.playerStartDef.angle, this.playerStartDef.dist, 0);
    this.player = this.physics.add.sprite(startPos.x, startPos.y - 20, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0.2);
    this.player.body.setSize(22, 30);
    this.player.body.setOffset(3, 2);
    this.player.setDepth(10);
    this.player.body.setDrag(40, 0);

    // Collisions
    this.physics.add.collider(this.player, this.platformBodies);
    this.physics.add.overlap(this.player, this.collectibleSprites, this.collectNote, null, this);
    this.physics.add.overlap(this.player, this.hazardSprites, this.hitHazard, null, this);
    this.physics.add.overlap(this.player, this.exitSprite, this.reachExit, null, this);
    this.physics.add.overlap(this.player, this.powerupSprites, this.collectPowerup, null, this);

    // ── Drag-to-rotate input ──
    this.isDragging = false;
    this.lastDragAngle = 0;
    this.pendingDragDelta = 0; // accumulated drag delta to apply in update
    this.dragSamples = [];

    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.lastDragAngle = Math.atan2(
        pointer.y - RECORD_CENTER_Y,
        pointer.x - RECORD_CENTER_X
      );
      this.dragSamples = [];
      this.angularVelocity = 0;
      this.pendingDragDelta = 0;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      const newAngle = Math.atan2(
        pointer.y - RECORD_CENTER_Y,
        pointer.x - RECORD_CENTER_X
      );
      let delta = newAngle - this.lastDragAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      // Accumulate — will be applied in update() in small steps
      this.pendingDragDelta += delta;
      this.lastDragAngle = newAngle;

      this.dragSamples.push({ delta, time: this.time.now });
      const cutoff = this.time.now - 80;
      this.dragSamples = this.dragSamples.filter(s => s.time > cutoff);
    });

    this.input.on('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.dragSamples.length >= 2) {
        const first = this.dragSamples[0];
        const last = this.dragSamples[this.dragSamples.length - 1];
        const dt = (last.time - first.time) / 1000;
        if (dt > 0) {
          const totalDelta = this.dragSamples.reduce((sum, s) => sum + s.delta, 0);
          this.angularVelocity = Phaser.Math.Clamp(totalDelta / dt, -4, 4);
        }
      }
    });

    this.isHurt = false;
    this.exitReached = false;

    // Keyboard input — A/D for horizontal movement (no jump)
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35,
      'Click & drag to spin  •  A / D to move', {
        fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(100);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16,
      'SPIN MODE', {
        fontSize: '11px', color: '#f5c518', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(100);

    this.noteParticles = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 }, scale: { start: 0.6, end: 0 },
      lifespan: 400, tint: 0xf5c518, emitting: false,
    });
  }

  polarToWorld(angle, dist, rotation) {
    const a = angle + rotation;
    return {
      x: RECORD_CENTER_X + Math.cos(a) * dist,
      y: RECORD_CENTER_Y + Math.sin(a) * dist,
    };
  }

  /** Teleport objects (used only for initial placement) */
  teleportAllObjects(rotation) {
    this.platformDefs.forEach((def, i) => {
      const pos = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.platformBodies[i];
      sprite.setPosition(pos.x, pos.y);
      sprite.rotation = def.angle + rotation + (def.tilt || 0);
      sprite.body.reset(pos.x, pos.y);
    });
    this._positionNonPlatforms(rotation);
  }

  /**
   * Move platforms via velocity so Arcade physics resolves collisions.
   * Instead of teleporting, we compute where each platform needs to be
   * and set its velocity so it arrives there in one frame.
   */
  moveAllObjects(rotation, dt) {
    const invDt = dt > 0 ? 1 / dt : 0;

    this.platformDefs.forEach((def, i) => {
      const target = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.platformBodies[i];

      // Set velocity to reach target position this frame
      sprite.body.setVelocity(
        (target.x - sprite.x) * invDt,
        (target.y - sprite.y) * invDt
      );
      sprite.rotation = def.angle + rotation + (def.tilt || 0);
    });

    this._positionNonPlatforms(rotation);
  }

  /** Snap non-platform objects (collectibles, hazards, etc.) — these don't need smooth movement */
  _positionNonPlatforms(rotation) {
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
      const bob = Math.sin(this.time.now * 0.004 + sprite.getData('bobOffset')) * 6;
      sprite.x = pos.x;
      sprite.y = pos.y + bob;
      sprite.body.reset(pos.x, pos.y + bob);
    });
    const exitPos = this.polarToWorld(this.exitDef.angle, this.exitDef.dist, rotation);
    this.exitSprite.x = exitPos.x;
    this.exitSprite.y = exitPos.y;
    this.exitSprite.body.reset(exitPos.x, exitPos.y);
  }

  /** After physics step, snap platforms to exact target so they don't drift */
  snapPlatforms(rotation) {
    this.platformDefs.forEach((def, i) => {
      const target = this.polarToWorld(def.angle, def.dist, rotation);
      const sprite = this.platformBodies[i];
      sprite.setPosition(target.x, target.y);
      sprite.body.setVelocity(0, 0);
      sprite.body.position.set(target.x - sprite.body.halfWidth, target.y - sprite.body.halfHeight);
    });
  }

  createRecordDisc(record) {
    const cx = RECORD_CENTER_X;
    const cy = RECORD_CENTER_Y;
    const container = this.add.container(cx, cy);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, RECORD_RADIUS + 4);
    g.fillStyle(0x18182e, 1);
    g.fillCircle(0, 0, RECORD_RADIUS);
    g.fillStyle(0x0e0e1e, 1);
    g.beginPath();
    g.arc(8, 8, RECORD_RADIUS - 6, 0, Math.PI * 2, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x18182e, 1);
    g.fillCircle(0, 0, RECORD_RADIUS - 8);
    for (let r = RECORD_RADIUS - 12; r > 75; r -= 10) {
      g.lineStyle(2, 0x2a2a44, 1);
      g.strokeCircle(0, 0, r);
    }
    g.lineStyle(3, 0x3a3a5c, 1);
    g.beginPath();
    g.arc(0, 0, RECORD_RADIUS * 0.72, Math.PI + 0.8, Math.PI + 1.6, false);
    g.strokePath();
    g.fillStyle(record.labelColor, 0.25);
    g.fillCircle(0, 0, 70);
    g.lineStyle(3, 0x000000, 0.6);
    g.strokeCircle(0, 0, 70);
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, 0, 10);
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
  }

  // ── Update ──
  update(time, delta) {
    if (this.exitReached) return;
    const dt = delta / 1000;

    // Max rotation per frame to prevent tunneling (~3 degrees)
    const MAX_STEP = 0.05;

    // Determine total angle change this frame
    let angleDelta = 0;

    if (this.isDragging) {
      angleDelta = this.pendingDragDelta;
      this.pendingDragDelta = 0;
    } else {
      angleDelta = this.angularVelocity * dt;
      this.angularVelocity *= 0.97;
      if (Math.abs(this.angularVelocity) < 0.01) this.angularVelocity = 0;
    }

    // Apply rotation in small sub-steps to prevent tunneling
    const steps = Math.max(1, Math.ceil(Math.abs(angleDelta) / MAX_STEP));
    const stepDelta = angleDelta / steps;
    const stepDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      this.currentAngle += stepDelta;
      this.moveAllObjects(this.currentAngle, stepDt);

      // Run a physics step for this sub-step
      // (Phaser's auto-update handles the main step, but for sub-steps
      //  we manually separate/resolve after setting velocities)
    }

    // After all sub-steps, snap platforms to final position
    this.snapPlatforms(this.currentAngle);

    this.recordDisc.setAngle(Phaser.Math.RadToDeg(this.currentAngle));

    // Push player out of any platform they're overlapping
    this.resolvePlayerPlatformOverlap();

    // A/D horizontal movement (no jump)
    if (!this.isHurt) {
      const moveLeft = this.keys.left.isDown || this.keys.arrowLeft.isDown;
      const moveRight = this.keys.right.isDown || this.keys.arrowRight.isDown;
      const MOVE_SPEED = 180;

      if (moveLeft) {
        this.player.setVelocityX(-MOVE_SPEED);
        this.player.setFlipX(true);
      } else if (moveRight) {
        this.player.setVelocityX(MOVE_SPEED);
        this.player.setFlipX(false);
      } else {
        // Apply friction when not pressing keys
        this.player.setVelocityX(this.player.body.velocity.x * 0.88);
      }
    }

    // Death check
    const dx = this.player.x - RECORD_CENTER_X;
    const dy = this.player.y - RECORD_CENTER_Y;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    if (this.player.y > GAME_HEIGHT + 80 || distFromCenter > RECORD_RADIUS + 100) {
      this.playerDie();
    }
  }

  /**
   * Manual overlap resolution: if the player is inside a platform,
   * push them out along the shortest axis. This catches any cases
   * where the velocity-based movement wasn't enough.
   */
  resolvePlayerPlatformOverlap() {
    const pb = this.player.body;
    const px = pb.x;
    const py = pb.y;
    const pw = pb.width;
    const ph = pb.height;

    for (const sprite of this.platformBodies) {
      const sb = sprite.body;
      const sx = sb.x;
      const sy = sb.y;
      const sw = sb.width;
      const sh = sb.height;

      // AABB overlap test
      const overlapX = Math.min(px + pw, sx + sw) - Math.max(px, sx);
      const overlapY = Math.min(py + ph, sy + sh) - Math.max(py, sy);

      if (overlapX > 0 && overlapY > 0) {
        // Push out along the smallest overlap axis
        if (overlapY < overlapX) {
          // Vertical push
          const playerCenterY = py + ph / 2;
          const platCenterY = sy + sh / 2;
          if (playerCenterY < platCenterY) {
            // Player is above — push up
            this.player.y -= overlapY;
            pb.position.y -= overlapY;
            if (pb.velocity.y > 0) pb.velocity.y = 0;
            pb.blocked.down = true;
          } else {
            // Player is below — push down
            this.player.y += overlapY;
            pb.position.y += overlapY;
            if (pb.velocity.y < 0) pb.velocity.y = 0;
            pb.blocked.up = true;
          }
        } else {
          // Horizontal push
          const playerCenterX = px + pw / 2;
          const platCenterX = sx + sw / 2;
          if (playerCenterX < platCenterX) {
            this.player.x -= overlapX;
            pb.position.x -= overlapX;
            if (pb.velocity.x > 0) pb.velocity.x = 0;
          } else {
            this.player.x += overlapX;
            pb.position.x += overlapX;
            if (pb.velocity.x < 0) pb.velocity.x = 0;
          }
        }
      }
    }
  }

  collectNote(player, note) {
    const idx = this.collectibleSprites.indexOf(note);
    if (idx >= 0) this.collectibleDefs[idx].alive = false;
    note.destroy();
    this.score += 100;
    this.scoreText.setText(`Score: ${this.score}`);
    this.noteParticles.emitParticleAt(note.x, note.y, 8);
  }

  collectPowerup(player, puSprite) {
    const idx = this.powerupSprites.indexOf(puSprite);
    if (idx < 0 || !this.powerupDefs[idx].alive) return;
    this.powerupDefs[idx].alive = false;
    puSprite.destroy();
    this.score += 50;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  hitHazard(player, hazard) {
    if (this.isHurt) return;
    this.isHurt = true;
    this.lives--;
    this.livesText.setText(`♥ ${this.lives}`);
    player.setVelocityY(-200);
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
          recordIndex: this.recordIndex, songIndex: nextSong,
          score: this.score, lives: this.lives, mode: 'spin',
        });
      } else {
        const nextRecord = this.recordIndex + 1;
        if (nextRecord < RECORDS.length) {
          this.scene.start('RecordComplete', {
            recordIndex: this.recordIndex, nextRecordIndex: nextRecord,
            score: this.score, lives: this.lives, mode: 'spin',
          });
        } else {
          this.scene.start('Victory', { score: this.score });
        }
      }
    });
  }
}
