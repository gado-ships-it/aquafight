import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene }  from './scenes/HUDScene.js';
import { WIDTH, HEIGHT } from './config.js';

const config = {
  type: Phaser.AUTO,
  width:  WIDTH,
  height: HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000022',
  antialias: true,
  // Keep audio alive when tab loses focus (important on mobile)
  disableVisibilityChange: true,
  input: {
    gamepad: true,
    // Allow touch events to pass through to DOM for the overlay
    activePointers: 4,
  },
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      WIDTH,
    height:     HEIGHT,
    // Ensure canvas fills viewport properly on mobile
    expandParent: true,
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene],
};

const game = new Phaser.Game(config);

// Launch HUD alongside game after game starts
game.events.on('ready', () => {
  const gameScene = game.scene.getScene('GameScene');
  if (gameScene) {
    gameScene.events.on('create', () => {
      game.scene.launch('HUDScene');
    });
  }
});

export default game;
