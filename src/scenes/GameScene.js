import Phaser from 'phaser';
import {
  WIDTH, HEIGHT, SURFACE_Y, PLAYER, ATTACKS, ROUND_TIME, MAX_ROUNDS, COLORS,
} from '../config.js';
import { Fighter }      from '../objects/Fighter.js';
import { WaterLayer }   from '../objects/WaterLayer.js';
import { InputManager } from '../systems/InputManager.js';
import { AIController } from '../systems/AIController.js';
import { SoundManager } from '../systems/SoundManager.js';

const PHASE = {
  COUNTDOWN: 'countdown',
  FIGHT:     'fight',
  ROUND_END: 'round_end',
  MATCH_END: 'match_end',
};

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.sound_manager = new SoundManager();
    this.sound_manager.resume();

    this.water = new WaterLayer(this);

    // Spawn positions
    const p1x = WIDTH * 0.3;
    const p2x = WIDTH * 0.7;
    const py  = SURFACE_Y - 20;

    this.p1 = new Fighter(this, p1x, py, 0);
    this.p2 = new Fighter(this, p2x, py, 1);

    this.input_mgr = new InputManager(this);
    this.ai = new AIController(this.p2, this.p1);

    this.phase    = PHASE.COUNTDOWN;
    this.roundNum = 1;
    this.p1Wins   = 0;
    this.p2Wins   = 0;
    this.roundTimer = ROUND_TIME;
    this.phaseTimer = 0;

    // Countdown overlay
    this.countdownText = this.add.text(WIDTH / 2, HEIGHT / 2, '3', {
      fontFamily: 'Courier New',
      fontSize: '120px',
      color: '#ffffff',
      stroke: '#003355',
      strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 40, fill: true },
    }).setOrigin(0.5).setDepth(55);
    this.countdownText.setAlpha(0);

    // Camera shake helper
    this._doShake = (intensity = 3, duration = 120) => {
      this.cameras.main.shake(duration, intensity * 0.002);
    };

    // Start the countdown
    this._startCountdown();

    // Ambient sound
    this.sound_manager.startAmbient('surface');

    // Resize handling
    this.scale.on('resize', this._onResize, this);
  }

  _startCountdown() {
    this.phase = PHASE.COUNTDOWN;
    this.phaseTimer = 0;
    let count = 3;
    const tick = () => {
      if (count > 0) {
        this._showCountdownNum(String(count));
        count--;
        this.time.delayedCall(900, tick);
      } else {
        this._showCountdownNum('FIGHT!');
        this.time.delayedCall(700, () => {
          this.countdownText.setAlpha(0);
          this.phase = PHASE.FIGHT;
          this.roundTimer = ROUND_TIME;
          this.events.emit('hud_update', this._hudData());
          // Signal HUD scene
          const hud = this.scene.get('HUDScene');
          if (hud) hud.showFight();
        });
      }
    };
    tick();
  }

  _showCountdownNum(txt) {
    const ct = this.countdownText;
    ct.setText(txt);
    ct.setScale(2);
    ct.setAlpha(1);
    this.tweens.add({
      targets: ct,
      scaleX: 1, scaleY: 1,
      alpha: txt === 'FIGHT!' ? 0 : 1,
      duration: 600,
      ease: 'Back.easeOut',
    });
  }

  update(time, dt) {
    if (this.phase === PHASE.COUNTDOWN || this.phase === PHASE.MATCH_END) return;
    if (this.phase === PHASE.ROUND_END) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) this._nextRound();
      return;
    }

    // Update input
    this.input_mgr.update();

    // Update AI
    this.ai.update(dt);

    // Player movement
    this.p1.applyMovement(this.input_mgr, dt);
    this.p2.applyMovement(null, dt);          // AI-controlled

    // Timers
    this.p1.updateTimers(dt);
    this.p2.updateTimers(dt);

    // Process P1 input attacks
    this._handlePlayerAttacks();

    // Process AI attacks
    this._handleAIAttacks();

    // Collision / hitbox detection
    this._resolveHits();

    // Zone transition splashes
    if (this.p1.splashPending) {
      this.water.splash(this.p1.x);
      this.sound_manager.splash();
      this.p1.splashPending = false;
    }
    if (this.p2.splashPending) {
      this.water.splash(this.p2.x);
      this.sound_manager.splash();
      this.p2.splashPending = false;
    }

    // Ambient bubbles
    this.p1.emitBubbles();
    this.p2.emitBubbles();

    // Draw fighters
    this.p1.draw();
    this.p2.draw();

    // Water
    this.water.update(dt);

    // Round timer
    this.roundTimer -= dt / 1000;
    if (this.roundTimer <= 0) this._onTimeOut();

    // KO check
    if (this.p1.state === 'ko') this._onKO(2);
    else if (this.p2.state === 'ko') this._onKO(1);

    // Latch gamepad state for JustDown detection
    this.input_mgr.latchPad();

    // Sync HUD
    const hud = this.scene.get('HUDScene');
    if (hud && hud.update) hud.update(this._hudData());
  }

  _handlePlayerAttacks() {
    const im = this.input_mgr;
    const p1 = this.p1;
    if (p1.state === 'ko' || p1.stunTimer > 0) return;

    let inputChar = null;

    if (im.justLight()) {
      p1.tryAttack('LIGHT', p1.comboSystem);
      inputChar = 'L';
    } else if (im.justHeavy()) {
      p1.tryAttack('HEAVY', p1.comboSystem);
      inputChar = 'H';
    } else if (im.justSpecial()) {
      p1.tryAttack('SPECIAL', p1.comboSystem);
      inputChar = 'S';
    } else if (im.justGrab()) {
      p1.tryAttack('GRAB', p1.comboSystem);
      inputChar = 'G';
    }

    // Directional inputs into combo system
    if (im.justUp())   p1.comboSystem.push('U');
    if (im.justDown()) p1.comboSystem.push('D');

    // Combo check for last attack
    const combo = p1.hitboxData?.combo;
    if (combo) {
      const hud = this.scene.get('HUDScene');
      if (hud) hud.showCombo(combo.name, combo.color);
      this.sound_manager.combo(combo.name);
      this._doShake(5, 200);
    }
  }

  _handleAIAttacks() {
    const p2 = this.p2;
    if (p2.state === 'ko' || p2.stunTimer > 0) return;

    if (p2.ai_attack) {
      const type = p2.ai_attack.toUpperCase();
      if (ATTACKS[type]) {
        p2.tryAttack(type, null);
      }
      p2.ai_attack = null;
    }
  }

  _resolveHits() {
    this._checkHit(this.p1, this.p2);
    this._checkHit(this.p2, this.p1);
  }

  _checkHit(attacker, defender) {
    if (!attacker.hitboxActive || !attacker.hitboxData) return;
    if (defender.state === 'ko') return;

    const hb = attacker.hitboxData;
    const defRect = defender.getHitRect();

    const hbLeft   = hb.x - hb.w / 2;
    const hbRight  = hb.x + hb.w / 2;
    const hbTop    = hb.y - hb.h / 2;
    const hbBottom = hb.y + hb.h / 2;
    const dLeft    = defRect.x;
    const dRight   = defRect.x + defRect.width;
    const dTop     = defRect.y;
    const dBottom  = defRect.y + defRect.height;

    if (hbRight < dLeft || hbLeft > dRight || hbBottom < dTop || hbTop > dBottom) return;

    // Hit!
    const result = defender.receiveHit(hb, this.sound_manager);
    attacker.hitboxActive = false;
    attacker.hitboxData   = null;
    attacker.atkGfx.clear();

    if (result === 'ko') {
      // Handled in update
    } else if (result === 'hit') {
      this._doShake(3, 100);
      this._spawnImpactParticles(defender.x, defender.y);
    } else if (result === 'blocked') {
      this._spawnBlockParticles(defender.x, defender.y);
    }
  }

  _spawnImpactParticles(x, y) {
    const particles = this.add.particles(x, y, '__WHITE', {
      lifespan:  { min: 200, max: 450 },
      speed:     { min: 80, max: 220 },
      scale:     { start: 0.8, end: 0 },
      alpha:     { start: 1, end: 0 },
      tint:      [0xff5500, 0xffaa00, 0xffffff],
      angle:     { min: 0, max: 360 },
      quantity:  8,
      frequency: -1,
    });
    particles.setDepth(20);
    particles.explode(8, x, y);
    this.time.delayedCall(500, () => particles.destroy());
  }

  _spawnBlockParticles(x, y) {
    const particles = this.add.particles(x, y, '__WHITE', {
      lifespan:  { min: 150, max: 300 },
      speed:     { min: 40, max: 120 },
      scale:     { start: 0.5, end: 0 },
      alpha:     { start: 0.8, end: 0 },
      tint:      [0x4488ff, 0x88ccff],
      angle:     { min: 0, max: 360 },
      quantity:  5,
      frequency: -1,
    });
    particles.setDepth(20);
    particles.explode(5, x, y);
    this.time.delayedCall(350, () => particles.destroy());
  }

  _onKO(winner) {
    if (this.phase !== PHASE.FIGHT) return;
    this.phase = PHASE.ROUND_END;
    this.phaseTimer = 2200;

    if (winner === 1) this.p1Wins++;
    else              this.p2Wins++;

    const hud = this.scene.get('HUDScene');
    if (hud) {
      hud.showKO();
      this.time.delayedCall(600, () => hud.showRoundWin(winner));
    }

    // Check match end
    const winsNeeded = Math.ceil(MAX_ROUNDS / 2);
    if (this.p1Wins >= winsNeeded || this.p2Wins >= winsNeeded) {
      this.phaseTimer = 3500;
      this.phase = PHASE.ROUND_END; // will call _nextRound which checks wins
      this.time.delayedCall(800, () => {
        if (hud) hud.showMatchWin(winner);
        this.phase = PHASE.MATCH_END;
        this.time.delayedCall(3500, () => this._restartMatch());
      });
    }
  }

  _onTimeOut() {
    if (this.phase !== PHASE.FIGHT) return;
    const winner = this.p1.hp >= this.p2.hp ? 1 : 2;
    this._onKO(winner);
    // Fake KO if not already
    if (winner === 1 && this.p2.state !== 'ko') this.p2.state = 'ko';
    if (winner === 2 && this.p1.state !== 'ko') this.p1.state = 'ko';
  }

  _nextRound() {
    if (this.phase === PHASE.MATCH_END) return;
    this.roundNum++;
    if (this.roundNum > MAX_ROUNDS) {
      this._restartMatch();
      return;
    }

    this.p1.reset(WIDTH * 0.3, SURFACE_Y - 20);
    this.p2.reset(WIDTH * 0.7, SURFACE_Y - 20);
    this.ai = new AIController(this.p2, this.p1);
    this.roundTimer = ROUND_TIME;

    const hud = this.scene.get('HUDScene');
    if (hud) hud.update(this._hudData());

    this._startCountdown();
  }

  _restartMatch() {
    this.roundNum = 1;
    this.p1Wins   = 0;
    this.p2Wins   = 0;
    this.p1.reset(WIDTH * 0.3, SURFACE_Y - 20);
    this.p2.reset(WIDTH * 0.7, SURFACE_Y - 20);
    this.ai = new AIController(this.p2, this.p1);
    this.roundTimer = ROUND_TIME;
    this._startCountdown();
  }

  _hudData() {
    return {
      p1Hp:   this.p1.hp,
      p2Hp:   this.p2.hp,
      round:  this.roundNum,
      timer:  Math.max(0, this.roundTimer),
      p1Wins: this.p1Wins,
      p2Wins: this.p2Wins,
      p1Zone: this.p1.zone,
      p2Zone: this.p2.zone,
    };
  }

  _onResize() {}

  shutdown() {
    if (this.p1) this.p1.destroy();
    if (this.p2) this.p2.destroy();
    if (this.water) this.water.destroy();
  }
}
