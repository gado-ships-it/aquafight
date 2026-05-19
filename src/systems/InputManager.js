import { KEYS } from '../config.js';
import { TouchController } from './TouchController.js';

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys({
      left:    KEYS.LEFT,
      right:   KEYS.RIGHT,
      up:      KEYS.UP,
      down:    KEYS.DOWN,
      light:   KEYS.LIGHT,
      heavy:   KEYS.HEAVY,
      special: KEYS.SPECIAL,
      block:   KEYS.BLOCK,
      grab:    KEYS.GRAB,
    });
    this.pad = null;
    this._prevButtons = {};

    // Touch controller (shown on mobile, hidden on desktop)
    this.touch = new TouchController();
    if (isTouchDevice()) {
      this.touch.show();
    }

    scene.input.gamepad.once('connected', pad => { this.pad = pad; });
  }

  update() {
    if (this.scene.input.gamepad.total > 0 && !this.pad) {
      this.pad = this.scene.input.gamepad.getPad(0);
    }
  }

  _padJustDown(index) {
    if (!this.pad) return false;
    const btn = this.pad.buttons[index];
    const prev = this._prevButtons[index] || false;
    const cur = btn ? btn.pressed : false;
    this._prevButtons[index] = cur;
    return cur && !prev;
  }

  _padDown(index) {
    if (!this.pad) return false;
    return this.pad.buttons[index] ? this.pad.buttons[index].pressed : false;
  }

  _axisLeft() {
    if (!this.pad) return 0;
    const v = this.pad.axes[0] ? this.pad.axes[0].getValue() : 0;
    return Math.abs(v) > 0.2 ? v : 0;
  }

  _axisVert() {
    if (!this.pad) return 0;
    const v = this.pad.axes[1] ? this.pad.axes[1].getValue() : 0;
    return Math.abs(v) > 0.2 ? v : 0;
  }

  isLeft()    { return Phaser.Input.Keyboard.JustDown(this.keys.left)    || this._axisLeft() < -0.5 || this.touch.just.left; }
  isRight()   { return Phaser.Input.Keyboard.JustDown(this.keys.right)   || this._axisLeft() > 0.5  || this.touch.just.right; }
  holdLeft()  { return this.keys.left.isDown  || this._axisLeft() < -0.2 || this.touch.state.left; }
  holdRight() { return this.keys.right.isDown || this._axisLeft() > 0.2  || this.touch.state.right; }
  holdUp()    { return this.keys.up.isDown    || this._axisVert() < -0.5 || this.touch.state.up; }
  holdDown()  { return this.keys.down.isDown  || this._axisVert() > 0.5  || this.touch.state.down; }

  justUp()     { return Phaser.Input.Keyboard.JustDown(this.keys.up)     || this._padJustDown(12) || this.touch.just.up; }
  justDown()   { return Phaser.Input.Keyboard.JustDown(this.keys.down)   || this._padJustDown(13) || this.touch.just.down; }
  justLight()  { return Phaser.Input.Keyboard.JustDown(this.keys.light)  || this._padJustDown(0)  || this.touch.just.light; }
  justHeavy()  { return Phaser.Input.Keyboard.JustDown(this.keys.heavy)  || this._padJustDown(2)  || this.touch.just.heavy; }
  justSpecial(){ return Phaser.Input.Keyboard.JustDown(this.keys.special)|| this._padJustDown(3)  || this.touch.just.special; }
  justGrab()   { return Phaser.Input.Keyboard.JustDown(this.keys.grab)   || this._padJustDown(1)  || this.touch.just.grab; }
  holdBlock()  { return this.keys.block.isDown || this._padDown(4) || this._padDown(5) || this.touch.state.block; }

  latchPad() {
    if (!this.pad) return;
    for (let i = 0; i < this.pad.buttons.length; i++) {
      this._prevButtons[i] = this.pad.buttons[i] ? this.pad.buttons[i].pressed : false;
    }
    // Clear just-pressed touch flags after each game frame
    this.touch.clearJust();
  }

  destroy() {
    this.touch.destroy();
  }
}
