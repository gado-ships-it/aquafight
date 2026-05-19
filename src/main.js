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
  input: {
    gamepad: true,
  },
  scale: {
    mode:            Phaser.Scale.FIT,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    width:           WIDTH,
    height:          HEIGHT,
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
