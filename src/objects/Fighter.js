import {
  ZONE, ZONE_BOUNDS, PHYSICS, PLAYER, ATTACKS, COLORS, SURFACE_Y, WIDTH, HEIGHT,
} from '../config.js';
import { ComboSystem } from '../systems/ComboSystem.js';

const STATES = {
  IDLE:       'idle',
  SWIMMING:   'swimming',
  AIRBORNE:   'airborne',
  ATTACKING:  'attacking',
  BLOCKING:   'blocking',
  STUNNED:    'stunned',
  KO:         'ko',
};

export class Fighter {
  constructor(scene, x, y, playerIndex) {
    this.scene    = scene;
    this.x        = x;
    this.y        = y;
    this.vx       = 0;
    this.vy       = 0;
    this.playerIndex = playerIndex;
    this.facingRight = playerIndex === 0;

    this.hp       = PLAYER.MAX_HP;
    this.maxHp    = PLAYER.MAX_HP;
    this.state    = STATES.IDLE;
    this.zone     = ZONE.SURFACE;

    this.attackTimer   = 0;
    this.cooldownTimer = 0;
    this.stunTimer     = 0;
    this.hitboxActive  = false;
    this.hitboxData    = null;
    this.knockbackX    = 0;
    this.knockbackY    = 0;
    this.flashTimer    = 0;
    this.blocking      = false;
    this.bobOffset     = 0;
    this.bobDir        = 1;
    this.splashPending = false;

    this.comboSystem = new ComboSystem();

    // AI input fields (used by AIController)
    this.ai_moveX   = 0;
    this.ai_moveY   = 0;
    this.ai_attack  = null;
    this.ai_blocking = false;

    const colors = playerIndex === 0
      ? { body: COLORS.P1_BODY, accent: COLORS.P1_ACCENT, glow: COLORS.P1_GLOW }
      : { body: COLORS.P2_BODY, accent: COLORS.P2_ACCENT, glow: COLORS.P2_GLOW };
    this.colors = colors;

    // Graphics container
    this.container = scene.add.container(x, y);
    this.gfx       = scene.add.graphics();
    this.atkGfx    = scene.add.graphics();
    this.container.add([this.gfx, this.atkGfx]);
    this.container.setDepth(10);

    // Particle emitters for bubbles
    const particles = scene.add.particles(0, 0, '__WHITE', {
      lifespan:   { min: 400, max: 900 },
      speed:      { min: 20, max: 60 },
      angle:      { min: 250, max: 290 },
      scale:      { start: 0.4, end: 0 },
      alpha:      { start: 0.7, end: 0 },
      tint:       0x88eeff,
      frequency:  -1,
      quantity:   1,
    });
    particles.setDepth(9);
    this.bubbleEmitter = particles;

    // Impact flash texture
    this._drawBody();
  }

  _drawBody(pose = 'idle') {
    const g   = this.gfx;
    const dir = this.facingRight ? 1 : -1;
    const c   = this.colors;
    const flash = this.flashTimer > 0;
    g.clear();

    const baseColor = flash ? COLORS.HIT_FLASH : c.body;
    const accColor  = flash ? COLORS.HIT_FLASH : c.accent;

    // Glow ring
    if (this.state !== STATES.KO) {
      g.fillStyle(c.glow, 0.18);
      g.fillCircle(0, 0, 38);
    }

    // Wetsuit body
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(-14, -22, 28, 42, 6);

    // Chest accent stripe
    g.fillStyle(accColor, 1);
    g.fillRect(-6, -14, 12, 18);

    // Head / diving helmet
    g.fillStyle(baseColor, 1);
    g.fillCircle(dir * 2, -30, 12);

    // Visor / goggles
    g.fillStyle(0x111111, 1);
    g.fillEllipse(dir * 4, -31, 12, 8);
    g.fillStyle(0x44ddff, 0.7);
    g.fillEllipse(dir * 5, -32, 9, 5);

    // Arms
    const armAngle = pose === 'attack_light' ? 0.8 : (pose === 'attack_heavy' ? 1.2 : 0.15);
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(-21,  -18, 8, 24, 3);   // left arm
    g.fillRoundedRect( 13,  -18, 8, 24, 3);   // right arm
    // Fist/glove
    g.fillStyle(accColor, 1);
    g.fillCircle(-17 + (pose === 'attack_light' && !this.facingRight ? -10 : 0), 8, 5);
    g.fillCircle( 17 + (pose === 'attack_light' &&  this.facingRight ?  10 : 0), 8, 5);

    // Legs / fins
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(-12, 20, 10, 28, 3);
    g.fillRoundedRect(  2, 20, 10, 28, 3);
    // Fin tips
    g.fillStyle(accColor, 1);
    g.fillTriangle(-12, 48, -22, 54, -6, 54);
    g.fillTriangle( 12, 48,  22, 54,  6, 54);

    // Snorkel
    if (this.zone !== ZONE.UNDERWATER) {
      g.fillStyle(accColor, 1);
      g.fillRect(dir * 10, -38, 3, 12);
    }

    // KO state
    if (this.state === STATES.KO) {
      g.fillStyle(0xffffff, 0.3);
      g.fillRect(-18, -50, 36, 100);
    }

    // Hitbox debug (disabled in production)
    // if (this.hitboxActive && this.hitboxData) { ... }
  }

  getZone() {
    if (this.y < ZONE_BOUNDS.SURFACE_TOP)  return ZONE.AIR;
    if (this.y > ZONE_BOUNDS.SURFACE_BOT)  return ZONE.UNDERWATER;
    return ZONE.SURFACE;
  }

  applyMovement(input, dt) {
    if (this.state === STATES.KO) return;

    const sec  = dt / 1000;
    const zone = this.getZone();
    const prevZone = this.zone;
    this.zone = zone;

    // Zone transition effects
    if (prevZone !== zone) {
      if ((prevZone === ZONE.AIR && zone === ZONE.SURFACE) ||
          (prevZone === ZONE.UNDERWATER && zone === ZONE.SURFACE)) {
        this.splashPending = true;
      }
    }

    // --- Physics ---
    if (zone === ZONE.AIR) {
      this.vy += PHYSICS.GRAVITY_AIR * sec;
      this.vx *= PHYSICS.AIR_DRAG;
    } else if (zone === ZONE.UNDERWATER) {
      this.vy += PHYSICS.GRAVITY_UNDERWATER * sec;
      this.vx *= PHYSICS.WATER_DRAG;
      this.vy *= PHYSICS.WATER_DRAG;
    } else {
      // Surface buoyancy
      const pullDir = this.y > SURFACE_Y ? -1 : 1;
      const distFromSurf = Math.abs(this.y - SURFACE_Y);
      this.vy += pullDir * (distFromSurf * 4) * sec;
      this.vx *= PHYSICS.WATER_DRAG;
      this.vy *= 0.85;
    }

    // Clamp fall speed
    if (this.vy > PHYSICS.MAX_FALL) this.vy = PHYSICS.MAX_FALL;

    // Knockback decay
    this.knockbackX *= PHYSICS.KNOCKBACK_DECAY;
    this.knockbackY *= PHYSICS.KNOCKBACK_DECAY;

    // --- Player Input ---
    if (input && this.stunTimer <= 0 && this.state !== STATES.ATTACKING) {
      this.blocking = input.holdBlock();

      const speed = zone === ZONE.AIR ? PHYSICS.AIR_MOVE_SPEED : PHYSICS.SWIM_SPEED;

      if (input.holdLeft())  { this.vx = -speed; this.facingRight = false; }
      if (input.holdRight()) { this.vx =  speed; this.facingRight = true;  }

      if (zone === ZONE.AIR) {
        // No vertical control in air
      } else if (zone === ZONE.SURFACE) {
        if (input.justUp())   this.vy = PHYSICS.JUMP_VY;
        if (input.justDown()) this.vy = PHYSICS.DIVE_VY;
      } else {
        // Underwater: full 2D swim
        if (input.holdUp())   this.vy = -PHYSICS.SWIM_SPEED;
        if (input.holdDown()) this.vy =  PHYSICS.SWIM_SPEED;
      }
    } else if (input === null) {
      // AI control
      this.blocking = this.ai_blocking;
      const speed = zone === ZONE.AIR ? PHYSICS.AIR_MOVE_SPEED : PHYSICS.SWIM_SPEED;
      this.vx = this.ai_moveX * speed;
      if (zone === ZONE.UNDERWATER) this.vy = this.ai_moveY * speed;
      else if (zone === ZONE.SURFACE && this.ai_moveY > 0) this.vy = PHYSICS.DIVE_VY;
      else if (zone === ZONE.SURFACE && this.ai_moveY < 0) this.vy = PHYSICS.JUMP_VY;
    }

    // Apply total velocity + knockback
    this.x += (this.vx + this.knockbackX) * sec;
    this.y += (this.vy + this.knockbackY) * sec;

    // Wall clamp
    const hw = PLAYER.WIDTH / 2;
    if (this.x < hw + 20)       { this.x = hw + 20;        this.vx = 0; }
    if (this.x > WIDTH - hw - 20) { this.x = WIDTH - hw - 20; this.vx = 0; }

    // Ceiling / floor clamp
    if (this.y < 50)        { this.y = 50;       this.vy = 0; }
    if (this.y > HEIGHT - 50){ this.y = HEIGHT - 50; this.vy = 0; }

    // Bob in surface zone
    if (zone === ZONE.SURFACE) {
      this.bobOffset += this.bobDir * dt * 0.04;
      if (Math.abs(this.bobOffset) > 3) this.bobDir *= -1;
    } else {
      this.bobOffset *= 0.85;
    }

    this.container.setPosition(this.x, this.y + this.bobOffset);
    if (this.facingRight) {
      this.container.setScale(1, 1);
    } else {
      this.container.setScale(-1, 1);
    }
  }

  updateTimers(dt) {
    if (this.attackTimer > 0)   this.attackTimer   = Math.max(0, this.attackTimer   - dt);
    if (this.cooldownTimer > 0) this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    if (this.stunTimer > 0)     this.stunTimer     = Math.max(0, this.stunTimer     - dt);
    if (this.flashTimer > 0)    this.flashTimer    = Math.max(0, this.flashTimer    - dt);

    if (this.attackTimer <= 0 && this.state === STATES.ATTACKING) {
      this.state = STATES.IDLE;
      this.hitboxActive = false;
      this.hitboxData   = null;
      this.atkGfx.clear();
    }
    if (this.stunTimer > 0 && this.state !== STATES.KO) {
      this.state = STATES.STUNNED;
    } else if (this.stunTimer <= 0 && this.state === STATES.STUNNED) {
      this.state = STATES.IDLE;
    }
  }

  tryAttack(type, comboSystem) {
    if (this.cooldownTimer > 0 || this.state === STATES.STUNNED || this.state === STATES.KO) return null;
    if (this.state === STATES.ATTACKING && this.attackTimer > ATTACKS[type].cooldown * 0.4) return null;

    const atk = ATTACKS[type];
    const inputChar = type[0]; // 'L', 'H', 'S', 'G'
    const comboResult = comboSystem ? comboSystem.push(inputChar) : null;

    this.state          = STATES.ATTACKING;
    this.attackTimer    = atk.duration;
    this.cooldownTimer  = atk.cooldown;
    this.hitboxActive   = true;

    const dir = this.facingRight ? 1 : -1;
    this.hitboxData = {
      x: this.x + dir * (PLAYER.WIDTH / 2 + atk.range / 2),
      y: this.y,
      w: atk.range,
      h: PLAYER.HEIGHT * 1.2,
      damage:   comboResult ? (atk.damage + comboResult.bonus) : atk.damage,
      knockbackX: dir * atk.knockback,
      knockbackY: -atk.knockback * 0.3,
      stun:     atk.stun,
      type,
      combo:    comboResult,
    };

    // Draw attack arc
    this._drawAttackArc(type, dir);
    this.scene.sound_manager && this.scene.sound_manager.whoosh();

    return this.hitboxData;
  }

  _drawAttackArc(type, dir) {
    const ag = this.atkGfx;
    ag.clear();
    const c  = this.colors;
    const r  = type === 'LIGHT' ? 60 : type === 'HEAVY' ? 90 : 110;
    ag.fillStyle(c.accent, 0.35);
    ag.slice(0, 0, r, Phaser.Math.DegToRad(dir > 0 ? -50 : 130), Phaser.Math.DegToRad(dir > 0 ? 50 : 230), dir < 0);
    ag.fillPath();
    ag.lineStyle(2, c.glow, 0.8);
    ag.strokeCircle(0, 0, r * 0.5);

    this.scene.time.delayedCall(120, () => ag.clear());
  }

  tryBlock(comboSystem) {
    if (comboSystem) comboSystem.push('B');
  }

  receiveHit(hitbox, soundManager) {
    if (this.state === STATES.KO) return false;

    const wasBlocked = this.blocking;
    const dmg = wasBlocked ? Math.floor(hitbox.damage * 0.15) : hitbox.damage;

    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;

    this.flashTimer = 150;

    if (wasBlocked) {
      soundManager && soundManager.hitBlock();
      this.knockbackX = hitbox.knockbackX * 0.2;
    } else {
      soundManager && soundManager.hitHeavy();
      this.knockbackX = hitbox.knockbackX;
      this.knockbackY = hitbox.knockbackY;
      if (!wasBlocked) this.stunTimer = hitbox.stun;
    }

    // Bubble burst on hit
    this.bubbleEmitter.setPosition(this.x, this.y);
    this.bubbleEmitter.explode(6, this.x, this.y);

    if (this.hp <= 0) {
      this.state = STATES.KO;
      this.vx = 0;
      this.vy = -200;
      soundManager && soundManager.ko();
      return 'ko';
    }

    return wasBlocked ? 'blocked' : 'hit';
  }

  emitBubbles() {
    if (this.zone === ZONE.UNDERWATER && Math.random() < 0.07) {
      this.bubbleEmitter.explode(1, this.x + (Math.random() - 0.5) * 20, this.y - 20);
    }
  }

  draw() {
    const pose = this.state === STATES.ATTACKING ? 'attack_' + (this.hitboxData?.type || 'light').toLowerCase() : 'idle';
    this._drawBody(pose);
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.knockbackX = 0; this.knockbackY = 0;
    this.hp = PLAYER.MAX_HP;
    this.state = STATES.IDLE;
    this.stunTimer = 0; this.attackTimer = 0; this.cooldownTimer = 0; this.flashTimer = 0;
    this.hitboxActive = false; this.hitboxData = null;
    this.blocking = false;
    this.comboSystem.reset();
    this.container.setPosition(x, y);
    this.atkGfx.clear();
  }

  destroy() {
    this.container.destroy();
    this.bubbleEmitter.destroy();
  }

  getHitRect() {
    return {
      x: this.x - PLAYER.WIDTH / 2,
      y: this.y - PLAYER.HEIGHT / 2,
      width:  PLAYER.WIDTH,
      height: PLAYER.HEIGHT,
    };
  }
}
