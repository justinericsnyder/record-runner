import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import SpinScene from './scenes/SpinScene.js';
import SongTransition from './scenes/SongTransition.js';
import RecordComplete from './scenes/RecordComplete.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3, // support multi-touch (drag + buttons)
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    SpinScene,
    SongTransition,
    RecordComplete,
    GameOverScene,
    VictoryScene,
  ],
};

const game = new Phaser.Game(config);
