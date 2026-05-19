import { WIDTH, HEIGHT, SURFACE_Y, COLORS } from '../config.js';

export class WaterLayer {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.numWaves = 5;

    // Sky gradient
    this.skyGfx = scene.add.graphics().setDepth(0);
    this._drawSky();

    // Underwater gradient
    this.underwaterGfx = scene.add.graphics().setDepth(1);
    this._drawUnderwater();

    // Surface wave graphics (redrawn each frame)
    this.waveGfx = scene.add.graphics().setDepth(2);

    // Bubble particles
    const bubbleParticles = scene.add.particles(0, 0, '__WHITE', {
      x:          { min: 20, max: WIDTH - 20 },
      y:          { min: SURFACE_Y + 50, max: HEIGHT - 40 },
      lifespan:   { min: 1500, max: 3500 },
      speedY:     { min: -25, max: -60 },
      speedX:     { min: -8, max: 8 },
      scale:      { start: 0.3, end: 0 },
      alpha:      { start: 0.45, end: 0 },
      tint:       0x88eeff,
      frequency:  120,
    });
    bubbleParticles.setDepth(3);
    this.bubbleParticles = bubbleParticles;

    // Splash emitter (manual)
    this.splashEmitter = scene.add.particles(0, SURFACE_Y, '__WHITE', {
      lifespan:   { min: 350, max: 700 },
      speed:      { min: 60, max: 200 },
      angle:      { min: 250, max: 290 },
      scale:      { start: 0.6, end: 0 },
      alpha:      { start: 0.85, end: 0 },
      tint:       0x00ccff,
      frequency:  -1,
    });
    this.splashEmitter.setDepth(6);

    // Decorations
    this._createDecorations();
  }

  _drawSky() {
    const g = this.skyGfx;
    g.clear();
    // Sky gradient (4 bands)
    const bands = [
      { y: 0,          h: HEIGHT * 0.2, color: COLORS.SKY_TOP, alpha: 1 },
      { y: HEIGHT*0.2, h: HEIGHT * 0.2, color: 0x2255cc,       alpha: 1 },
      { y: HEIGHT*0.4, h: HEIGHT * 0.1, color: COLORS.SKY_BOT, alpha: 1 },
    ];
    bands.forEach(b => {
      g.fillStyle(b.color, b.alpha);
      g.fillRect(0, b.y, WIDTH, b.h);
    });
    // Horizon haze
    g.fillStyle(0xaaddff, 0.15);
    g.fillRect(0, SURFACE_Y - 80, WIDTH, 80);

    // Distant waves (static)
    g.lineStyle(2, 0xaaffee, 0.3);
    for (let i = 0; i < 6; i++) {
      const yw = SURFACE_Y - 120 + i * 18;
      g.beginPath();
      g.moveTo(0, yw);
      for (let x = 0; x <= WIDTH; x += 40) {
        g.lineTo(x, yw + Math.sin(x * 0.02 + i) * 4);
      }
      g.strokePath();
    }
  }

  _drawUnderwater() {
    const g = this.underwaterGfx;
    g.clear();
    // Underwater gradient (deep to mid)
    const bands = [
      { y: SURFACE_Y,   h: 120,         color: 0x004466 },
      { y: SURFACE_Y+120, h: 120,       color: COLORS.WATER_DEEP },
      { y: SURFACE_Y+240, h: HEIGHT,    color: 0x001122 },
    ];
    bands.forEach(b => {
      g.fillStyle(b.color, 1);
      g.fillRect(0, b.y, WIDTH, b.h);
    });
    // Light rays from surface
    g.fillStyle(0x0088bb, 0.07);
    for (let i = 0; i < 8; i++) {
      const rx = 100 + i * 160;
      g.fillTriangle(rx, SURFACE_Y, rx + 30, HEIGHT, rx - 30, HEIGHT);
    }
    // Seabed hints
    g.fillStyle(0x334411, 0.5);
    g.fillRect(0, HEIGHT - 40, WIDTH, 40);
    g.fillStyle(0x334411, 0.3);
    for (let i = 0; i < 12; i++) {
      const bx = i * 110 + Math.sin(i * 0.7) * 20;
      g.fillTriangle(bx, HEIGHT - 40, bx + 30, HEIGHT - 55, bx + 60, HEIGHT - 40);
    }
  }

  _createDecorations() {
    const scene = this.scene;
    const decGfx = scene.add.graphics().setDepth(2);

    // Floating buoys
    const buoyPositions = [200, 550, 900, 1150];
    buoyPositions.forEach((bx, i) => {
      decGfx.fillStyle(0xff3300, 1);
      decGfx.fillCircle(bx, SURFACE_Y - 18, 10);
      decGfx.fillStyle(0xffffff, 1);
      decGfx.fillRect(bx - 1, SURFACE_Y - 28, 2, 20);
      // String to water
      decGfx.lineStyle(1, 0x888888, 0.5);
      decGfx.strokeRect(bx - 1, SURFACE_Y - 8, 2, 14);
    });

    // Small palm island (right side)
    const px = WIDTH - 180;
    decGfx.fillStyle(0xcc9944, 1);
    decGfx.fillEllipse(px, SURFACE_Y - 8, 90, 18);  // sand
    decGfx.fillStyle(0x553311, 1);
    decGfx.fillRect(px, SURFACE_Y - 45, 5, 38);  // trunk
    decGfx.fillStyle(0x22aa33, 1);
    // Fronds
    [[-30, -10], [-20, -25], [10, -25], [25, -10], [5, -8]].forEach(([dx, dy]) => {
      decGfx.fillEllipse(px + dx, SURFACE_Y - 50 + dy, 40, 12);
    });

    // Inflatable ring on left
    const rx = 180;
    decGfx.lineStyle(10, 0xff4444, 1);
    decGfx.strokeCircle(rx, SURFACE_Y + 5, 22);
    decGfx.lineStyle(10, 0xffff44, 1);
    decGfx.beginPath();
    decGfx.arc(rx, SURFACE_Y + 5, 22, 0, Math.PI * 0.5, false);
    decGfx.strokePath();
    decGfx.beginPath();
    decGfx.arc(rx, SURFACE_Y + 5, 22, Math.PI, Math.PI * 1.5, false);
    decGfx.strokePath();

    this.decGfx = decGfx;
  }

  splash(x) {
    this.splashEmitter.emitParticleAt(x, SURFACE_Y, 12);
  }

  update(dt) {
    this.t += dt * 0.001;
    this._drawWaves();
  }

  _drawWaves() {
    const g = this.waveGfx;
    g.clear();

    // Underwater fill up to surface (dynamic top edge)
    g.fillStyle(0x003355, 1);
    g.beginPath();
    g.moveTo(0, SURFACE_Y + 18);
    g.lineTo(0, HEIGHT);
    g.lineTo(WIDTH, HEIGHT);
    g.lineTo(WIDTH, SURFACE_Y + 18);
    // Top wave curve
    for (let x = WIDTH; x >= 0; x -= 6) {
      const yw = SURFACE_Y + 18 + Math.sin(x * 0.015 + this.t * 1.2) * 6
                             + Math.sin(x * 0.025 - this.t * 0.8) * 3;
      g.lineTo(x, yw);
    }
    g.closePath();
    g.fillPath();

    // Glow lines
    for (let layer = 0; layer < 3; layer++) {
      const alpha = 0.6 - layer * 0.15;
      const amp   = 8 + layer * 3;
      const freq  = 0.012 + layer * 0.005;
      const speed = 1.5 - layer * 0.3;
      g.lineStyle(3 - layer, 0x00ddff, alpha);
      g.beginPath();
      g.moveTo(0, SURFACE_Y + Math.sin(this.t * speed) * amp);
      for (let x = 0; x <= WIDTH; x += 8) {
        const yw = SURFACE_Y + Math.sin(x * freq + this.t * speed) * amp
                             + Math.sin(x * 0.03  - this.t * 0.6)  * (amp * 0.4);
        g.lineTo(x, yw);
      }
      g.strokePath();
    }

    // Foam dots
    g.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 16; i++) {
      const fx = (i * 83 + this.t * 30) % WIDTH;
      const fy = SURFACE_Y + Math.sin(fx * 0.015 + this.t * 1.2) * 6;
      g.fillCircle(fx, fy - 3, 2 + Math.sin(i + this.t) * 1.5);
    }
  }

  destroy() {
    this.skyGfx.destroy();
    this.underwaterGfx.destroy();
    this.waveGfx.destroy();
    this.decGfx.destroy();
    this.bubbleParticles.destroy();
    this.splashEmitter.destroy();
  }
}
