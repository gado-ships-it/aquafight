import { WIDTH, HEIGHT, PLAYER, MAX_ROUNDS, ROUND_TIME, COLORS } from '../config.js';

export class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create() {
    this.p1Hp   = PLAYER.MAX_HP;
    this.p2Hp   = PLAYER.MAX_HP;
    this.round  = 1;
    this.timer  = ROUND_TIME;
    this.p1Wins = 0;
    this.p2Wins = 0;

    // HUD panel (top strip)
    const panelH = 54;
    const panel  = this.add.graphics();
    panel.fillStyle(COLORS.HUD_BG, 0.6);
    panel.fillRect(0, 0, WIDTH, panelH);
    panel.lineStyle(1, 0x00aaff, 0.4);
    panel.strokeRect(0, 0, WIDTH, panelH);

    // P1 health bar
    this.p1BarBg  = this.add.graphics();
    this.p1BarFg  = this.add.graphics();
    this.p1Label  = this.add.text(12, 10, 'P1', { fontFamily: 'Courier New', fontSize: '14px', color: '#ff7744' });
    this._drawBar(this.p1BarBg, 50, 14, 360, 20, 0x333333, 1);

    // P2 health bar (right, mirrored)
    this.p2BarBg  = this.add.graphics();
    this.p2BarFg  = this.add.graphics();
    this.p2Label  = this.add.text(WIDTH - 30, 10, 'P2', { fontFamily: 'Courier New', fontSize: '14px', color: '#4488ff' }).setOrigin(1, 0);
    this._drawBar(this.p2BarBg, WIDTH - 410, 14, 360, 20, 0x333333, 1);

    // Round indicator
    this.roundText = this.add.text(WIDTH / 2, 8, 'RND 1', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#aaddff',
    }).setOrigin(0.5, 0);

    // Timer
    this.timerText = this.add.text(WIDTH / 2, 26, '90', {
      fontFamily: 'Courier New', fontSize: '20px', color: '#ffffff',
      stroke: '#003355', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // Win pips
    this.p1Pips = [];
    this.p2Pips = [];
    for (let i = 0; i < MAX_ROUNDS; i++) {
      this.p1Pips.push(this.add.graphics());
      this.p2Pips.push(this.add.graphics());
    }

    // Combo text (center, transient)
    this.comboText = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, '', {
      fontFamily: 'Courier New',
      fontSize: '36px',
      color: '#ffff00',
      stroke: '#440000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff8800', blur: 20, fill: true },
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    // Zone label (debug/guide) — small indicator near center
    this.p1ZoneIcon = this.add.text(50, HEIGHT / 2 - 15, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#88ccff', alpha: 0.7,
    }).setDepth(20);
    this.p2ZoneIcon = this.add.text(WIDTH - 50, HEIGHT / 2 - 15, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#88ccff', alpha: 0.7,
    }).setDepth(20).setOrigin(1, 0);

    // Big center message
    this.centerMsg = this.add.text(WIDTH / 2, HEIGHT / 2, '', {
      fontFamily: 'Courier New',
      fontSize: '80px',
      color: '#ffffff',
      stroke: '#003355',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#00aaff', blur: 40, fill: true },
    }).setOrigin(0.5).setAlpha(0).setDepth(60);

    this._updateBars();
    this._updatePips();
  }

  _drawBar(gfx, x, y, w, h, color, alpha) {
    gfx.clear();
    gfx.fillStyle(color, alpha);
    gfx.fillRect(x, y, w, h);
  }

  _updateBars() {
    const barW = 360;
    const barX1 = 50;
    const barX2 = WIDTH - 410;
    const h = 20;

    // P1 fg bar
    const p1Ratio = Math.max(0, this.p1Hp / PLAYER.MAX_HP);
    const p1Color = p1Ratio > 0.5 ? 0x44ff44 : (p1Ratio > 0.25 ? 0xffaa00 : 0xff2200);
    this.p1BarFg.clear();
    this.p1BarFg.fillStyle(p1Color, 1);
    this.p1BarFg.fillRect(barX1, 14, barW * p1Ratio, h);

    // P2 fg bar (right-aligned, fills from right)
    const p2Ratio = Math.max(0, this.p2Hp / PLAYER.MAX_HP);
    const p2Color = p2Ratio > 0.5 ? 0x4488ff : (p2Ratio > 0.25 ? 0xaa44ff : 0xff0066);
    this.p2BarFg.clear();
    this.p2BarFg.fillStyle(p2Color, 1);
    this.p2BarFg.fillRect(barX2 + barW * (1 - p2Ratio), 14, barW * p2Ratio, h);
  }

  _updatePips() {
    const pipSize = 10;
    this.p1Pips.forEach((pip, i) => {
      pip.clear();
      pip.fillStyle(i < this.p1Wins ? 0xff7744 : 0x333333, 1);
      pip.fillCircle(60 + i * 20, 42, pipSize / 2);
    });
    this.p2Pips.forEach((pip, i) => {
      pip.clear();
      pip.fillStyle(i < this.p2Wins ? 0x4488ff : 0x333333, 1);
      pip.fillCircle(WIDTH - 60 - i * 20, 42, pipSize / 2);
    });
  }

  update(data) {
    if (!data) return;
    const { p1Hp, p2Hp, round, timer, p1Wins, p2Wins, p1Zone, p2Zone } = data;
    this.p1Hp   = p1Hp;
    this.p2Hp   = p2Hp;
    this.round  = round;
    this.timer  = timer;
    this.p1Wins = p1Wins;
    this.p2Wins = p2Wins;

    this._updateBars();
    this._updatePips();
    this.roundText.setText(`RND ${round}`);
    const t = Math.ceil(timer);
    this.timerText.setText(String(t));
    this.timerText.setColor(t <= 10 ? '#ff4400' : '#ffffff');

    if (p1Zone) this.p1ZoneIcon.setText({ air: '▲', surface: '~', underwater: '▼' }[p1Zone] || '');
    if (p2Zone) this.p2ZoneIcon.setText({ air: '▲', surface: '~', underwater: '▼' }[p2Zone] || '');
  }

  showCombo(name, color) {
    this.comboText.setText(name);
    this.comboText.setColor(color || '#ffff00');
    this.comboText.setAlpha(1);
    this.tweens.killTweensOf(this.comboText);
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      y: HEIGHT / 2 - 90,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => { this.comboText.y = HEIGHT / 2 - 60; },
    });
  }

  showCenterMsg(msg, duration = 1200) {
    this.centerMsg.setText(msg);
    this.centerMsg.setAlpha(1);
    this.tweens.killTweensOf(this.centerMsg);
    this.tweens.add({
      targets: this.centerMsg,
      alpha: 0,
      delay: duration * 0.6,
      duration: duration * 0.4,
      ease: 'Cubic.easeIn',
    });
  }

  showKO() { this.showCenterMsg('K.O.!', 1800); }
  showRoundWin(p) { this.showCenterMsg(`P${p} WINS ROUND!`, 1400); }
  showMatchWin(p) { this.showCenterMsg(`P${p} CHAMPION!`, 3000); }
  showFight()     { this.showCenterMsg('FIGHT!', 900); }
}
