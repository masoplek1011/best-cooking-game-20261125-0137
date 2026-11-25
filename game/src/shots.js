// Hearthrow Hustle — deterministic screenshot presets. Each ?shot= name
// builds one fixed game state (no randomness, no running clock) so the
// screenshots are reproducible renders of the game's own code. The live
// game never uses these builders; they only freeze a moment worth showing.

import { SHIFT_SECONDS } from './config.js';
import { STATION_TIMES } from './config.js';

function station(id, state, recipeId, progress, extra) {
  return {
    id,
    state,
    recipeId: recipeId || null,
    progress: progress || 0,
    cookSeconds: STATION_TIMES[id],
    queued: (extra && extra.queued) || null,
    burnt: state === 'burnt',
  };
}

function ticket(id, recipeId, patience, modifier) {
  return {
    id,
    recipeId,
    patience,
    maxPatience: 75,
    modifier: modifier || null,
    bornAt: 0,
    served: false,
    expired: false,
  };
}

function baseState(overrides) {
  const state = {
    screen: 'play',
    timeLeft: SHIFT_SECONDS,
    shiftSeconds: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    lost: 0,
    tickets: [
      ticket(1, 'omelet', 62, null),
      ticket(2, 'stew', 58, null),
      ticket(3, 'flatbread', 70, null),
    ],
    board: { items: [] },
    boardAssembled: null,
    hand: null,
    stations: {
      skillet: station('skillet', 'idle'),
      pot: station('pot', 'idle'),
      oven: station('oven', 'idle'),
    },
    plates: [],
    carried: null,
    messages: [],
    pairFlash: 0,
    chopTargetId: null,
    chopHold: 0,
    lastServeAt: null,
    lastServeRecipe: null,
    bestPair: false,
    titlePulse: 0,
  };
  return Object.assign(state, overrides || {});
}

// The cover: a complete cooking game in one frame — order board with three
// tickets, pantry bins, a dish mid-assembly on the cutting board, the shift
// timer, a station mid-cook and a finished plate ready to serve.
function playShot() {
  return baseState({
    timeLeft: 135,
    elapsed: 45,
    score: 24,
    served: 3,
    lost: 0,
    tickets: [
      ticket(4, 'omelet', 42, null),
      ticket(5, 'stew', 55, 'EXTRA CHAR'),
      ticket(6, 'flatbread', 30, null),
    ],
    board: {
      items: [
        { id: 1, ingId: 'egg', chop: 3, chopped: true },
        { id: 2, ingId: 'pepper', chop: 2, chopped: false },
      ],
    },
    chopTargetId: 2,
    stations: {
      skillet: station('skillet', 'cooking', 'omelet', 5),
      pot: station('pot', 'idle'),
      oven: station('oven', 'cooking', 'flatbread', 8),
    },
    plates: [{ recipeId: 'stew', charred: false }],
  });
}

// Title: the kitchen at rest behind the title card.
function titleShot() {
  const state = baseState({ screen: 'title', timeLeft: SHIFT_SECONDS });
  state.titlePulse = 0.9;
  return state;
}

// Serving: a plate carried to its ticket, the payout floating up.
function serveShot() {
  return baseState({
    timeLeft: 118,
    elapsed: 62,
    score: 37,
    served: 4,
    tickets: [
      ticket(7, 'omelet', 48, null),
      ticket(8, 'stew', 61, 'DOUBLE TIP'),
      ticket(9, 'flatbread', 35, null),
    ],
    board: { items: [{ id: 3, ingId: 'dough', chop: 1, chopped: false }] },
    chopTargetId: 3,
    stations: {
      skillet: station('skillet', 'idle'),
      pot: station('pot', 'cooking', 'stew', 7),
      oven: station('oven', 'ready', 'flatbread', 10),
    },
    plates: [{ recipeId: 'omelet', charred: false }],
    carried: 0,
    messages: [{ text: '+$13 SERVED!', x: 640, y: 300, ttl: 1.4, color: '#ffc93c' }],
  });
}

// Late-shift rush: the clock nearly gone, patience thin, every station hot.
function rushShot() {
  return baseState({
    timeLeft: 18,
    elapsed: 162,
    score: 86,
    served: 9,
    lost: 2,
    tickets: [
      ticket(10, 'omelet', 8, null),
      ticket(11, 'stew', 12, 'EXTRA CHAR'),
      ticket(12, 'flatbread', 5, null),
    ],
    board: {
      items: [
        { id: 4, ingId: 'root', chop: 3, chopped: true },
        { id: 5, ingId: 'broth', chop: 3, chopped: true },
        { id: 6, ingId: 'salt', chop: 2, chopped: false },
      ],
    },
    chopTargetId: 6,
    stations: {
      skillet: station('skillet', 'ready', 'omelet', 8),
      pot: station('pot', 'cooking', 'stew', 11),
      oven: station('oven', 'char', 'flatbread', 12.2),
    },
    plates: [{ recipeId: 'flatbread', charred: false }],
  });
}

export const SHOT_NAMES = ['title', 'play', 'serve', 'rush'];

export function buildShotState(name) {
  if (name === 'play') return playShot();
  if (name === 'serve') return serveShot();
  if (name === 'rush') return rushShot();
  return titleShot();
}
