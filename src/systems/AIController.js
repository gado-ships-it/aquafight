export class AIController {
  constructor(fighter, target) {
    this.fighter = fighter;
    this.target = target;
    this.state = 'idle';
    this.timer = 0;
    this.decideInterval = 400;
    this.aggressionBias = 0.55;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.decideInterval) {
      this.timer = 0;
      this._decide();
    }
    this._execute();
  }

  _decide() {
    const f = this.fighter;
    const t = this.target;
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const dist = Math.abs(dx);
    const hpRatio = f.hp / f.maxHp;

    if (hpRatio < 0.25) {
      this.state = Math.random() < 0.4 ? 'retreat' : 'attack';
    } else if (dist < 130) {
      const r = Math.random();
      if (r < 0.55) this.state = 'attack';
      else if (r < 0.75) this.state = 'block';
      else this.state = 'chase';
    } else if (dist < 300) {
      this.state = Math.random() < this.aggressionBias ? 'chase' : 'idle';
    } else {
      this.state = 'chase';
    }

    this.decideInterval = 300 + Math.random() * 400;
  }

  _execute() {
    const f = this.fighter;
    const t = this.target;
    if (!t || f.stunTimer > 0) return;

    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const dist = Math.abs(dx);

    switch (this.state) {
      case 'chase':
        f.ai_moveX = Math.sign(dx);
        f.ai_moveY = Math.sign(dy) * (Math.random() < 0.3 ? 1 : 0);
        f.ai_blocking = false;
        break;
      case 'attack':
        f.ai_moveX = Math.sign(dx) * (dist > 80 ? 1 : 0);
        f.ai_blocking = false;
        if (dist < 130) {
          const r = Math.random();
          if (r < 0.5)       f.ai_attack = 'light';
          else if (r < 0.75) f.ai_attack = 'heavy';
          else                f.ai_attack = 'special';
        }
        if (Math.abs(dy) > 100 && Math.random() < 0.3) {
          f.ai_moveY = Math.sign(dy);
        }
        break;
      case 'block':
        f.ai_blocking = true;
        f.ai_moveX = -Math.sign(dx) * 0.3;
        break;
      case 'retreat':
        f.ai_moveX = -Math.sign(dx);
        f.ai_blocking = Math.random() < 0.5;
        break;
      default:
        f.ai_moveX *= 0.8;
        f.ai_blocking = false;
    }
  }
}
