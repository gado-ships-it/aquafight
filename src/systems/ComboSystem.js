import { COMBOS, COMBO_WINDOW_MS } from '../config.js';

export class ComboSystem {
  constructor() {
    this.buffer = [];
    this.lastInputTime = 0;
  }

  push(input) {
    const now = performance.now();
    if (now - this.lastInputTime > COMBO_WINDOW_MS) {
      this.buffer = [];
    }
    this.buffer.push(input);
    this.lastInputTime = now;
    if (this.buffer.length > 8) this.buffer.shift();
    return this.check();
  }

  check() {
    for (const combo of COMBOS) {
      const len = combo.inputs.length;
      if (this.buffer.length < len) continue;
      const tail = this.buffer.slice(-len);
      if (tail.every((v, i) => v === combo.inputs[i])) {
        this.buffer = [];
        return combo;
      }
    }
    return null;
  }

  reset() {
    this.buffer = [];
    this.lastInputTime = 0;
  }

  getBuffer() {
    return [...this.buffer];
  }
}
