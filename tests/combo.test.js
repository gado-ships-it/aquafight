import { describe, it, expect, beforeEach } from 'vitest';
import { ComboSystem } from '../src/systems/ComboSystem.js';
import { COMBOS } from '../src/config.js';

describe('ComboSystem', () => {
  let cs;

  beforeEach(() => {
    cs = new ComboSystem();
  });

  it('detects RAPID CURRENT (L L L)', () => {
    cs.push('L');
    cs.push('L');
    const result = cs.push('L');
    expect(result).not.toBeNull();
    expect(result.name).toBe('RAPID CURRENT');
  });

  it('detects WAVE CRASH (H H)', () => {
    cs.push('H');
    const result = cs.push('H');
    expect(result).not.toBeNull();
    expect(result.name).toBe('WAVE CRASH');
  });

  it('detects SURGE STRIKE (L L H)', () => {
    cs.push('L');
    cs.push('L');
    const result = cs.push('H');
    expect(result).not.toBeNull();
    expect(result.name).toBe('SURGE STRIKE');
  });

  it('detects SURFACE SLAM (U H)', () => {
    cs.push('U');
    const result = cs.push('H');
    expect(result).not.toBeNull();
    expect(result.name).toBe('SURFACE SLAM');
  });

  it('detects TSUNAMI (L H S)', () => {
    cs.push('L');
    cs.push('H');
    const result = cs.push('S');
    expect(result).not.toBeNull();
    expect(result.name).toBe('TSUNAMI');
  });

  it('returns null for incomplete combos', () => {
    const result = cs.push('L');
    expect(result).toBeNull();
  });

  it('returns null for non-matching sequence', () => {
    cs.push('H');
    cs.push('L');
    const result = cs.push('S');
    expect(result).toBeNull();
  });

  it('resets buffer after successful combo', () => {
    cs.push('H');
    cs.push('H');
    // buffer now empty
    const result = cs.push('H');
    // single H doesn't match anything
    expect(result).toBeNull();
  });

  it('detects combo after noise inputs', () => {
    // "noise" then valid combo tail
    cs.buffer = ['X', 'Y'];
    cs.push('L');
    cs.push('L');
    const result = cs.push('L');
    expect(result).not.toBeNull();
    expect(result.name).toBe('RAPID CURRENT');
  });

  it('clears buffer when window expires', () => {
    cs.push('L');
    // Manually expire window
    cs.lastInputTime = performance.now() - 600;
    cs.push('L');
    const result = cs.push('L');
    // After timeout, buffer restarted at second L, then 3rd L → only 2 Ls since restart
    expect(result).toBeNull();
  });

  it('reports buffer state', () => {
    cs.push('A');
    cs.push('B');
    expect(cs.getBuffer()).toEqual(['A', 'B']);
  });

  it('covers all defined combos', () => {
    COMBOS.forEach(combo => {
      const cs2 = new ComboSystem();
      combo.inputs.slice(0, -1).forEach(inp => cs2.push(inp));
      const result = cs2.push(combo.inputs[combo.inputs.length - 1]);
      expect(result?.name).toBe(combo.name);
    });
  });
});
