/**
 * TouchController — DOM overlay virtual gamepad for mobile/iOS.
 * Renders two zones:
 *   LEFT:  D-pad (move + up/down)
 *   RIGHT: attack buttons (L H S U I)
 *
 * State is polled each frame via InputManager.
 * Supports multi-touch (left hand + right hand simultaneously).
 */
export class TouchController {
  constructor() {
    this._state = {
      left: false, right: false, up: false, down: false,
      light: false, heavy: false, special: false, grab: false, block: false,
    };
    // "just pressed" flags — set true for one frame then cleared
    this._just = {
      left: false, right: false, up: false, down: false,
      light: false, heavy: false, special: false, grab: false, block: false,
    };
    this._prevState = { ...this._state };
    this._overlay = null;
    this._visible = false;
    this._touchIds = new Map(); // pointerId → button key
    this._build();
  }

  get state()    { return this._state; }
  get just()     { return this._just; }
  get visible()  { return this._visible; }

  /** Call once per game frame (after reading just-flags) to clear them. */
  clearJust() {
    for (const k of Object.keys(this._just)) this._just[k] = false;
  }

  show() {
    if (this._overlay) {
      this._overlay.style.display = 'flex';
      this._visible = true;
    }
  }

  hide() {
    if (this._overlay) {
      this._overlay.style.display = 'none';
      this._visible = false;
    }
  }

  destroy() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  _press(key) {
    if (!this._state[key]) {
      this._state[key] = true;
      this._just[key]  = true;
    }
  }

  _release(key) {
    this._state[key] = false;
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.id = 'touch-overlay';
    overlay.style.cssText = `
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 200px;
      z-index: 100;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    `;

    // ── Left pad ──────────────────────────────────────────
    const leftPad = document.createElement('div');
    leftPad.style.cssText = `
      position: absolute;
      left: 12px;
      bottom: 12px;
      width: 180px;
      height: 180px;
      pointer-events: auto;
    `;
    // D-pad cross shape via 3 rows
    leftPad.innerHTML = `
      <div class="dpad-wrap">
        <div class="dpad-row">
          <div class="dpad-btn dpad-up" data-key="up">▲</div>
        </div>
        <div class="dpad-row dpad-mid">
          <div class="dpad-btn dpad-left" data-key="left">◄</div>
          <div class="dpad-center"></div>
          <div class="dpad-btn dpad-right" data-key="right">►</div>
        </div>
        <div class="dpad-row">
          <div class="dpad-btn dpad-down" data-key="down">▼</div>
        </div>
      </div>
    `;

    // ── Right pad ─────────────────────────────────────────
    const rightPad = document.createElement('div');
    rightPad.style.cssText = `
      position: absolute;
      right: 12px;
      bottom: 12px;
      width: 220px;
      height: 180px;
      pointer-events: auto;
    `;
    rightPad.innerHTML = `
      <div class="abtn-wrap">
        <div class="abtn-row abtn-top">
          <div class="abtn abtn-block" data-key="block">BLK</div>
          <div class="abtn abtn-special" data-key="special">SPC</div>
        </div>
        <div class="abtn-row abtn-bot">
          <div class="abtn abtn-grab" data-key="grab">GRB</div>
          <div class="abtn abtn-light" data-key="light">LGT</div>
          <div class="abtn abtn-heavy" data-key="heavy">HVY</div>
        </div>
      </div>
    `;

    overlay.appendChild(leftPad);
    overlay.appendChild(rightPad);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Inject styles
    this._injectStyles();

    // Wire pointer events (works for touch + stylus + mouse)
    this._wireZone(leftPad);
    this._wireZone(rightPad);
  }

  _wireZone(el) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      const key = this._keyFromTarget(e.target);
      if (key) {
        this._touchIds.set(e.pointerId, key);
        this._press(key);
        e.target.classList.add('pressed');
      }
    }, { passive: false });

    el.addEventListener('pointermove', e => {
      e.preventDefault();
      // D-pad slide: follow finger as it moves across buttons
      const el2 = document.elementFromPoint(e.clientX, e.clientY);
      const newKey = this._keyFromTarget(el2);
      const oldKey = this._touchIds.get(e.pointerId);
      if (newKey !== oldKey) {
        if (oldKey) {
          this._release(oldKey);
          const oldEl = this._overlay.querySelector(`[data-key="${oldKey}"]`);
          if (oldEl) oldEl.classList.remove('pressed');
        }
        if (newKey) {
          this._touchIds.set(e.pointerId, newKey);
          this._press(newKey);
          if (el2) el2.classList.add('pressed');
        } else {
          this._touchIds.delete(e.pointerId);
        }
      }
    }, { passive: false });

    const endHandler = e => {
      e.preventDefault();
      const key = this._touchIds.get(e.pointerId);
      if (key) {
        this._release(key);
        const btn = this._overlay.querySelector(`[data-key="${key}"]`);
        if (btn) btn.classList.remove('pressed');
        this._touchIds.delete(e.pointerId);
      }
    };
    el.addEventListener('pointerup',     endHandler, { passive: false });
    el.addEventListener('pointercancel', endHandler, { passive: false });
    el.addEventListener('pointerleave',  endHandler, { passive: false });
  }

  _keyFromTarget(el) {
    if (!el) return null;
    return el.dataset?.key || el.closest?.('[data-key]')?.dataset?.key || null;
  }

  _injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      #touch-overlay {
        /* safe area for iPhone home bar */
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }

      /* ── D-Pad ─────────────────────────── */
      .dpad-wrap {
        display: grid;
        grid-template-rows: 1fr 1fr 1fr;
        width: 150px;
        height: 150px;
        gap: 4px;
        margin: 15px auto 0;
      }
      .dpad-row {
        display: flex;
        justify-content: center;
      }
      .dpad-mid {
        gap: 4px;
      }
      .dpad-center {
        width: 46px;
        height: 46px;
        background: rgba(255,255,255,0.05);
        border-radius: 4px;
      }
      .dpad-btn {
        width: 46px;
        height: 46px;
        background: rgba(0, 170, 200, 0.25);
        border: 2px solid rgba(0, 200, 255, 0.5);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(0, 220, 255, 0.9);
        font-size: 18px;
        font-family: 'Courier New', monospace;
        transition: background 0.05s;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dpad-btn.pressed {
        background: rgba(0, 200, 255, 0.55);
        border-color: #00ffff;
      }

      /* ── Action Buttons ─────────────────── */
      .abtn-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 0;
      }
      .abtn-row {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .abtn {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.5px;
        border: 2px solid;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.05s, transform 0.05s;
      }
      .abtn.pressed {
        transform: scale(0.88);
      }
      .abtn-light   { background: rgba(255,85,0,0.25);  border-color: rgba(255,120,0,0.7);  color: #ff9944; }
      .abtn-heavy   { background: rgba(255,0,80,0.25);  border-color: rgba(255,0,100,0.7);  color: #ff44aa; }
      .abtn-special { background: rgba(0,255,136,0.2);  border-color: rgba(0,255,136,0.6);  color: #00ff88; }
      .abtn-grab    { background: rgba(136,0,255,0.25); border-color: rgba(160,0,255,0.6);  color: #cc88ff; }
      .abtn-block   { background: rgba(0,100,255,0.25); border-color: rgba(0,150,255,0.6);  color: #44aaff; }
      .abtn-light.pressed   { background: rgba(255,85,0,0.6); }
      .abtn-heavy.pressed   { background: rgba(255,0,80,0.6); }
      .abtn-special.pressed { background: rgba(0,255,136,0.5); }
      .abtn-grab.pressed    { background: rgba(136,0,255,0.55); }
      .abtn-block.pressed   { background: rgba(0,100,255,0.55); }
    `;
    document.head.appendChild(s);
  }
}
