// Hearthrow Hustle — kitchen constants: canvas, palette, timings, scores.
// One job: every number the rest of the game agrees on lives here, so a
// balance tweak never means hunting through render or logic code.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 180;
export const TICKET_SLOTS = 3;
export const TICKET_PATIENCE = 75;
export const MAX_PLATES = 4;
export const PAIR_WINDOW = 2.0;
export const CHOPS_PER_ITEM = 3;
export const CHOP_HOLD_SECONDS = 0.45;
export const GREEN_WINDOW = 2.5;
export const CHAR_WINDOW = 1.5;
export const BURN_SECONDS = 3.0;

export const STATION_TIMES = { skillet: 8, pot: 12, oven: 10 };
export const STATION_LABELS = {
  skillet: 'SKILLET',
  pot: 'STOCK POT',
  oven: 'OVEN',
};
export const STATION_SUBS = {
  skillet: 'fast · 8s',
  pot: 'slow · 12s · 2 portions',
  oven: 'medium · 10s · stacks x2',
};

export const PRICES = { omelet: 8, stew: 10, flatbread: 9 };
export const RECIPE_NAMES = {
  omelet: 'Ember Omelet',
  stew: 'Dockhand Stew',
  flatbread: 'Honeyed Flatbread',
};

// Warm food tones against a cool flat UI — the kitchen reads at a glance
// even when the contact sheet shrinks it.
export const PALETTE = {
  wall: '#2e3a4a',
  wallDark: '#25303e',
  floor: '#3a2f28',
  counter: '#8a5a34',
  counterTop: '#a9713f',
  counterEdge: '#6e4525',
  board: '#e8c890',
  boardEdge: '#b98f4e',
  ticketBg: '#f7ead0',
  ticketEdge: '#c9a86a',
  ink: '#2b2118',
  muted: '#6b5a44',
  cream: '#f5efe2',
  accent: '#e8632c',
  accentSoft: '#f4a259',
  good: '#4caf50',
  warn: '#ffb300',
  bad: '#d32f2f',
  gold: '#ffc93c',
  steel: '#9aa7b4',
  steelDark: '#5f6d7a',
};

export const KEY_BIN = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
