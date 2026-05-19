export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNodes = [];
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _noise(duration, freq, decay = 0.3, volume = 0.4) {
    if (!this.ctx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + decay);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    src.stop(this.ctx.currentTime + decay);
  }

  _tone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  hitLight() {
    this._noise(0.12, 800, 0.12, 0.45);
    this._tone(320, 0.08, 'square', 0.2);
  }

  hitHeavy() {
    this._noise(0.25, 300, 0.25, 0.6);
    this._tone(120, 0.2, 'sawtooth', 0.35);
    this._noise(0.15, 1200, 0.15, 0.3);
  }

  hitSpecial() {
    this._noise(0.35, 200, 0.35, 0.7);
    this._tone(80, 0.3, 'sawtooth', 0.5);
    this._tone(160, 0.2, 'square', 0.3);
    this._tone(400, 0.15, 'sine', 0.25);
  }

  hitBlock() {
    this._tone(600, 0.08, 'square', 0.2);
    this._tone(900, 0.06, 'sine', 0.15);
  }

  splash() {
    this._noise(0.4, 600, 0.4, 0.35);
    this._noise(0.2, 2000, 0.2, 0.2);
  }

  combo(name) {
    if (!this.ctx) return;
    const notes = [330, 440, 550, 660, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone(freq, 0.12, 'sine', 0.25), i * 60);
    });
  }

  whoosh() {
    this._noise(0.15, 1500, 0.15, 0.2);
  }

  startAmbient(zone) {
    this.stopAmbient();
    if (!this.ctx) return;
    if (zone === 'underwater') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = 60;
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      gain.gain.value = 0.08;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.ambientNodes = [osc, gain];
    }
  }

  stopAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop && n.stop(); } catch(_) {} });
    this.ambientNodes = [];
  }

  win() {
    if (!this.ctx) return;
    [330, 440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.25, 'sine', 0.3), i * 80);
    });
  }

  ko() {
    this._noise(0.5, 150, 0.5, 0.8);
    this._tone(200, 0.4, 'sawtooth', 0.4);
  }
}
