// Hearthrow Hustle — the game loop and the rules that bind it together.
// Fixed timestep (1/60s) over a seeded world: read the board, route the
// pantry, chop, cook, plate, serve. Nothing here touches the network or
// the clock outside the frame pacer; the shift is fully deterministic
// from its seed and the player's inputs.

import { VIEW_W, VIEW_H, SHIFT_SECONDS, MAX_PLATES, CHOPS_PER_ITEM, CHOP_HOLD_SECONDS, KEY_BIN } from './config.js';
import { INGREDIENTS, ING_BY_ID, RECIPES, matchRecipe } from './recipes.js';
import { makeRng } from './random.js';
import { freshBoard, tickTickets, serveTicket, makeTicket } from './orders.js';
import { makeStations, stationCanLoad, loadStation, tickStation, pullStation } from './stations.js';
import { makeInput, hitRect } from './input.js';
import { drawKitchen, drawTitle, drawGameOver, zoneAt, boardRect } from './render.js';
import { buildShotState } from './shots.js';
import { initAudio, toggleMute, sfx } from './audio.js';

const STEP = 1 / 60;

function newShift(seed, shiftsPlayed) {
  const rng = makeRng(seed + shiftsPlayed);
  return {
    screen: 'title',
    seed,
    shiftsPlayed,
    rng,
    timeLeft: SHIFT_SECONDS,
    shiftSeconds: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    lost: 0,
    tickets: freshBoard(rng),
    board: { items: [] },
    boardAssembled: null,
    hand: null,
    stations: makeStations(),
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
    nextItemId: 1,
  };
}

function refreshAssembled(state) {
  const items = state.board.items;
  if (items.length !== 3 || !items.every((it) => it.chopped)) {
    state.boardAssembled = null;
    return;
  }
  state.boardAssembled = matchRecipe(items.map((it) => it.ingId));
}

function addMessage(state, text, color) {
  state.messages.push({ text, x: VIEW_W / 2, y: 330, ttl: 1.6, color: color || '#ffc93c' });
  if (state.messages.length > 4) state.messages.shift();
}

// ---- player actions ---------------------------------------------------------

function pickBin(state, index) {
  if (state.hand) {
    sfx.error();
    return;
  }
  const ing = INGREDIENTS[index];
  if (!ing) return;
  state.hand = ing.id;
  sfx.pickup();
}

function placeOnBoard(state) {
  if (!state.hand) return;
  if (state.board.items.length >= 3) {
    sfx.error();
    return;
  }
  state.board.items.push({
    id: state.nextItemId++,
    ingId: state.hand,
    chop: 0,
    chopped: false,
  });
  state.hand = null;
  sfx.place();
  refreshAssembled(state);
}

function takeBackFromBoard(state) {
  if (state.hand) return;
  const items = state.board.items;
  if (items.length === 0) return;
  const last = items[items.length - 1];
  if (last.chopped) {
    sfx.error();
    return;
  }
  items.pop();
  state.hand = last.ingId;
  sfx.pickup();
  refreshAssembled(state);
}

function chopStep(state, dt) {
  const target = state.board.items.find((it) => !it.chopped);
  if (!target) {
    state.chopTargetId = null;
    state.chopHold = 0;
    return;
  }
  state.chopTargetId = target.id;
  state.chopHold += dt;
  if (state.chopHold >= CHOP_HOLD_SECONDS) {
    state.chopHold = 0;
    target.chop += 1;
    sfx.chop();
    if (target.chop >= CHOPS_PER_ITEM) {
      target.chopped = true;
      sfx.place();
    }
    refreshAssembled(state);
  }
}

function loadOrPullStation(state, stationId) {
  const station = state.stations[stationId];
  if (station.state === 'burnt') {
    pullStation(station);
    addMessage(state, 'Burnt dish trashed', '#ff8a80');
    sfx.burnt();
    return;
  }
  if (station.state === 'ready' || station.state === 'char') {
    const recipe = RECIPES[station.recipeId];
    const portions = (recipe && recipe.portions) || 1;
    if (state.plates.length + portions > MAX_PLATES) {
      sfx.error();
      addMessage(state, 'Plate rail is full!', '#ff8a80');
      return;
    }
    const result = pullStation(station);
    if (result && result.plates) {
      for (const plate of result.plates) state.plates.push(plate);
      sfx.place();
    }
    return;
  }
  if (station.state === 'idle' || (station.id === 'oven' && station.state === 'cooking' && !station.queued)) {
    const recipe = state.boardAssembled;
    if (!recipe || !stationCanLoad(station, recipe)) {
      sfx.error();
      if (!recipe) addMessage(state, 'Finish chopping a full recipe first', '#ff8a80');
      else addMessage(state, `${recipe.name} goes in the ${recipe.station}`, '#ff8a80');
      return;
    }
    if (loadStation(station, recipe)) {
      state.board.items = [];
      state.boardAssembled = null;
      state.chopTargetId = null;
      sfx.place();
    }
  }
}

function tryServe(state, ticketIndex) {
  if (state.carried === null) return;
  const plate = state.plates[state.carried];
  const ticket = state.tickets[ticketIndex];
  if (!plate || !ticket) return;
  const sinceOther =
    state.lastServeAt !== null && state.lastServeRecipe !== plate.recipeId
      ? state.elapsed - state.lastServeAt
      : null;
  const payout = serveTicket(ticket, plate, sinceOther);
  if (!payout) {
    sfx.error();
    if (ticket.modifier === 'EXTRA CHAR' && !plate.charred) {
      addMessage(state, 'That ticket wants EXTRA CHAR!', '#ff8a80');
    } else {
      addMessage(state, 'Wrong dish for that ticket', '#ff8a80');
    }
    return;
  }
  state.plates.splice(state.carried, 1);
  state.carried = null;
  state.score += payout.total;
  state.served += 1;
  state.lastServeAt = state.elapsed;
  state.lastServeRecipe = payout.recipeId;
  if (payout.pairBonus) {
    state.pairFlash = 2;
    state.bestPair = true;
  }
  addMessage(
    state,
    `+$${payout.total} ${RECIPES[payout.recipeId].name}${payout.pairBonus ? ' · PAIR BONUS x2!' : ''}`,
    '#ffc93c',
  );
  sfx.serve();
  state.tickets[ticketIndex] = makeTicket(state.rng, state.elapsed);
}

function serveViaChute(state) {
  if (state.carried === null) return;
  const plate = state.plates[state.carried];
  const idx = state.tickets.findIndex((t) => {
    if (t.recipeId !== plate.recipeId) return false;
    if (t.modifier === 'EXTRA CHAR' && !plate.charred) return false;
    return true;
  });
  if (idx === -1) {
    sfx.error();
    addMessage(state, 'No open ticket wants that plate', '#ff8a80');
    return;
  }
  tryServe(state, idx);
}

function handleClick(state, click, input) {
  if (state.screen === 'title') {
    initAudio();
    state.screen = 'play';
    return;
  }
  if (state.screen === 'over') return;
  const zone = zoneAt(click.x, click.y, state);
  if (!zone) return;
  if (zone.kind === 'bin') pickBin(state, zone.index);
  else if (zone.kind === 'board') {
    if (state.hand) placeOnBoard(state);
    else takeBackFromBoard(state);
  } else if (zone.kind === 'station') loadOrPullStation(state, zone.id);
  else if (zone.kind === 'plate') {
    if (state.carried === zone.index) state.carried = null;
    else {
      state.carried = zone.index;
      sfx.pickup();
    }
  } else if (zone.kind === 'ticket') tryServe(state, zone.index);
  else if (zone.kind === 'chute') serveViaChute(state);
}

function handleKeys(state, input) {
  if (input.wasPressed('enter')) {
    if (state.screen === 'title') {
      initAudio();
      state.screen = 'play';
    }
  }
  if (input.wasPressed('m')) toggleMute();
  if (input.wasPressed('r')) {
    const seed = state.seed;
    const played = state.shiftsPlayed + 1;
    const fresh = newShift(seed, played);
    Object.assign(state, fresh, { screen: 'play' });
    return;
  }
  if (state.screen !== 'play') return;
  KEY_BIN.forEach((key, i) => {
    if (input.wasPressed(key)) pickBin(state, i);
  });
}

// ---- fixed step -------------------------------------------------------------

function step(state, input, dt) {
  handleKeys(state, input);
  const click = input.consumeClick();
  if (click) handleClick(state, click, input);
  if (state.screen === 'title') {
    state.titlePulse += dt;
    return;
  }
  if (state.screen !== 'play') return;

  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  if (state.timeLeft <= 0) {
    state.screen = 'over';
    sfx.burnt();
    return;
  }

  // Hold-to-chop: mouse held on the board, or SPACE held anywhere.
  const overBoard = hitRect(input.mouseX, input.mouseY, boardRect());
  if ((input.mouseDown && overBoard) || input.isDown(' ')) chopStep(state, dt);
  else {
    state.chopHold = 0;
  }

  const expired = tickTickets(state.tickets, state.rng, dt, state.elapsed);
  if (expired.length > 0) {
    state.lost += expired.length;
    addMessage(state, `${expired.length} ticket${expired.length > 1 ? 's' : ''} walked out!`, '#ff8a80');
  }

  for (const id of ['skillet', 'pot', 'oven']) {
    const event = tickStation(state.stations[id], dt);
    if (event === 'ready') sfx.ready();
    if (event === 'burnt') {
      addMessage(state, `${RECIPES[state.stations[id].recipeId]?.name || 'Dish'} burnt!`, '#ff8a80');
      sfx.burnt();
    }
  }

  if (state.pairFlash > 0) state.pairFlash -= dt;
  for (const m of state.messages) m.ttl -= dt;
  state.messages = state.messages.filter((m) => m.ttl > 0);
  if (state.timeLeft <= 10 && Math.floor(state.timeLeft) !== Math.floor(state.timeLeft + dt)) {
    sfx.tick();
  }
}

// ---- boot -------------------------------------------------------------------

export function startGame(canvas, ctx) {
  const params = new URLSearchParams(window.location.search);
  const seedParam = Number.parseInt(params.get('seed') || '1', 10);
  const seed = Number.isFinite(seedParam) ? seedParam : 1;
  const shot = params.get('shot');
  const input = makeInput(canvas);

  if (shot) {
    // A screenshot preset: one fixed state, rendered every frame, never
    // stepped, so the render is identical on every load.
    const frozen = buildShotState(shot);
    const renderFrozen = () => {
      if (frozen.screen === 'title') drawTitle(ctx, frozen, input);
      else drawKitchen(ctx, frozen, input);
    };
    renderFrozen();
    window.__hearthrow = { shot, state: frozen };
    return;
  }

  let state = newShift(seed, 0);
  window.__hearthrow = {
    get state() {
      return state;
    },
    restart() {
      state = newShift(seed, state.shiftsPlayed + 1);
      state.screen = 'play';
    },
  };

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 8) {
      step(state, input, STEP);
      input.endStep();
      acc -= STEP;
      guard++;
    }
    if (guard >= 8) acc = 0;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.screen === 'title') drawTitle(ctx, state, input);
    else if (state.screen === 'over') {
      drawKitchen(ctx, state, input);
      drawGameOver(ctx, state);
    } else drawKitchen(ctx, state, input);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
