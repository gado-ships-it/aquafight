import { WIDTH, HEIGHT } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Create a simple 4x4 white pixel texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 8; canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 8, 8);
    this.textures.addCanvas('__WHITE', canvas);
  }

  create() {
    this.scene.start('MenuScene');
  }
}
