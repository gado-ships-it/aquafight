export const WIDTH = 1280;
export const HEIGHT = 720;
export const SURFACE_Y = HEIGHT / 2;

export const ZONE = {
  AIR: 'air',
  SURFACE: 'surface',
  UNDERWATER: 'underwater',
};

export const ZONE_BOUNDS = {
  AIR_MAX: SURFACE_Y - 60,
  SURFACE_TOP: SURFACE_Y - 60,
  SURFACE_BOT: SURFACE_Y + 60,
  UNDERWATER_MIN: SURFACE_Y + 60,
};

export const PHYSICS = {
  GRAVITY_AIR: 700,
  GRAVITY_UNDERWATER: -80,
  BUOYANCY_AT_SURFACE: -300,
  WATER_DRAG: 0.88,
  AIR_DRAG: 0.96,
  SWIM_SPEED: 190,
  AIR_MOVE_SPEED: 230,
  JUMP_VY: -560,
  DIVE_VY: 320,
  MAX_FALL: 750,
  KNOCKBACK_DECAY: 0.75,
};

export const PLAYER = {
  WIDTH: 32,
  HEIGHT: 60,
  MAX_HP: 100,
  STUN_THRESHOLD: 15,
};

export const ATTACKS = {
  LIGHT: { damage: 8,  cooldown: 280, duration: 160, range: 90,  knockback: 180, stun: 220 },
  HEAVY: { damage: 22, cooldown: 620, duration: 280, range: 110, knockback: 350, stun: 420 },
  SPECIAL:{ damage: 35, cooldown: 900, duration: 350, range: 130, knockback: 500, stun: 600 },
  GRAB:  { damage: 12, cooldown: 700, duration: 200, range: 70,  knockback: 280, stun: 350 },
};

export const COMBOS = [
  { name: 'RAPID CURRENT', inputs: ['L','L','L'],   bonus: 28, color: '#00ffff' },
  { name: 'WAVE CRASH',    inputs: ['H','H'],        bonus: 30, color: '#ff6600' },
  { name: 'SURGE STRIKE',  inputs: ['L','L','H'],    bonus: 38, color: '#ffff00' },
  { name: 'UNDERTOW',      inputs: ['D','D','L'],    bonus: 22, color: '#8800ff' },
  { name: 'SURFACE SLAM',  inputs: ['U','H'],        bonus: 42, color: '#ff00aa' },
  { name: 'TSUNAMI',       inputs: ['L','H','S'],    bonus: 60, color: '#00ff88' },
  { name: 'DIVE SPIKE',    inputs: ['D','L','L'],    bonus: 25, color: '#00aaff' },
  { name: 'RIPTIDE',       inputs: ['L','H','L'],    bonus: 35, color: '#ff88ff' },
];

export const COMBO_WINDOW_MS = 500;

export const COLORS = {
  P1_BODY:     0xff5500,
  P1_ACCENT:   0xff9944,
  P1_GLOW:     0xff3300,
  P2_BODY:     0x0055ff,
  P2_ACCENT:   0x44aaff,
  P2_GLOW:     0x0033ff,
  WATER_DEEP:  0x002244,
  WATER_MID:   0x003366,
  WATER_SURF:  0x00aacc,
  SKY_BOT:     0x88ccff,
  SKY_TOP:     0x1133aa,
  BUBBLE:      0x88eeff,
  HUD_BG:      0x000000,
  HUD_TEXT:    0xffffff,
  HIT_FLASH:   0xffffff,
};

export const KEYS = {
  LEFT:    'A',
  RIGHT:   'D',
  UP:      'W',
  DOWN:    'S',
  LIGHT:   'J',
  HEAVY:   'K',
  SPECIAL: 'L',
  BLOCK:   'I',
  GRAB:    'U',
};

export const ROUND_TIME = 90;
export const MAX_ROUNDS = 3;
