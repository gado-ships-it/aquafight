import { WIDTH, HEIGHT, SURFACE_Y, COLORS } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    // Background gradient
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.SKY_TOP, 1);
    bg.fillRect(0, 0, WIDTH, SURFACE_Y);
    bg.fillStyle(COLORS.WATER_DEEP, 1);
    bg.fillRect(0, SURFACE_Y, WIDTH, HEIGHT - SURFACE_Y);
    // Wave line
    bg.lineStyle(3, COLORS.WATER_SURF, 0.9);
    bg.beginPath();
    bg.moveTo(0, SURFACE_Y);
    for (let x = 0; x <= WIDTH; x += 8) {
      bg.lineTo(x, SURFACE_Y + Math.sin(x * 0.025) * 10);
    }
    bg.strokePath();

    // Title
    this.add.text(WIDTH / 2, HEIGHT / 2 - 160, 'AQUA DUEL', {
      fontFamily: 'Courier New',
      fontSize: '72px',
      color: '#00ffff',
      stroke: '#003355',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00aaff', blur: 30, fill: true },
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 80, 'AQUATIC FIGHTING ARENA', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      color: '#88eeff',
    }).setOrigin(0.5);

    // Controls hint
    const controls = [
      'MOVE: WASD          LIGHT: J    HEAVY: K',
      'SPECIAL: L          GRAB: U     BLOCK: I',
      'COMBOS: chain attacks within 0.5s',
    ];
    controls.forEach((line, i) => {
      this.add.text(WIDTH / 2, HEIGHT / 2 + 40 + i * 32, line, {
        fontFamily: 'Courier New',
        fontSize: '16px',
        color: '#aaddff',
      }).setOrigin(0.5);
    });

    // Zone info
    const zones = [
      { label: '▲ AIR ZONE — aerial attacks', y: HEIGHT / 2 - 30 },
      { label: '~ SURFACE — splash combat',   y: HEIGHT / 2 + 10 },
      { label: '▼ UNDERWATER — slow & deep',  y: HEIGHT / 2 + 50 },
    ];
    zones.forEach(z => {
      this.add.text(80, z.y, z.label, {
        fontFamily: 'Courier New', fontSize: '13px', color: '#66bbdd',
      });
    });

    // Start prompt
    const startText = this.add.text(WIDTH / 2, HEIGHT / 2 + 200, 'PRESS ANY KEY TO DIVE IN', {
      fontFamily: 'Courier New',
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Input to start
    this.input.keyboard.once('keydown', () => this.scene.start('GameScene'));
    this.input.gamepad.once('down', () => this.scene.start('GameScene'));
    this.input.on('pointerdown', () => this.scene.start('GameScene'));
  }
}
