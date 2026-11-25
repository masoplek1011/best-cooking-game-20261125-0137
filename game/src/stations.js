// Hearthrow Hustle — the three cooking stations. Each station is a small
// state machine: idle -> cooking -> ready (green window) -> overcooked
// (char window, for EXTRA CHAR tickets) -> burnt. Pulling in the green
// window plates the dish; pulling in the char window plates it charred;
// pulling a burnt dish trashes it. The pot plates two portions, the oven
// can stack a second dish while one cooks.

import { STATION_TIMES, GREEN_WINDOW, CHAR_WINDOW, BURN_SECONDS } from './config.js';
import { RECIPES } from './recipes.js';

export function makeStations() {
  return {
    skillet: makeStation('skillet'),
    pot: makeStation('pot'),
    oven: makeStation('oven'),
  };
}

function makeStation(id) {
  return {
    id,
    state: 'idle', // idle | cooking | ready | char | burnt
    recipeId: null,
    progress: 0,
    cookSeconds: STATION_TIMES[id],
    queued: null, // oven stack: a second recipe waiting its turn
    burnt: false,
  };
}

export function stationCanLoad(station, recipe) {
  if (!recipe || recipe.station !== station.id) return false;
  if (station.id === 'oven' && station.state === 'cooking' && !station.queued) return true;
  return station.state === 'idle';
}

export function loadStation(station, recipe) {
  if (!stationCanLoad(station, recipe)) return false;
  if (station.id === 'oven' && station.state === 'cooking' && !station.queued) {
    station.queued = recipe.id;
    return true;
  }
  station.state = 'cooking';
  station.recipeId = recipe.id;
  station.progress = 0;
  station.burnt = false;
  return true;
}

// Advance one station by dt seconds. Returns 'ready' on the step the dish
// finishes, 'burnt' on the step it burns, else null.
export function tickStation(station, dt) {
  if (station.state === 'idle') return null;
  station.progress += dt;
  const done = station.cookSeconds;
  if (station.state === 'cooking' && station.progress >= done) {
    station.state = 'ready';
    return 'ready';
  }
  if (station.state === 'ready' && station.progress >= done + GREEN_WINDOW) {
    station.state = 'char';
    return 'char';
  }
  if (station.state === 'char' && station.progress >= done + GREEN_WINDOW + CHAR_WINDOW) {
    station.state = 'burnt';
    station.burnt = true;
    return 'burnt';
  }
  if (station.state === 'burnt' && station.progress >= done + GREEN_WINDOW + CHAR_WINDOW + BURN_SECONDS) {
    station.progress = done + GREEN_WINDOW + CHAR_WINDOW + BURN_SECONDS;
  }
  return null;
}

// Pull a finished dish off a station. Returns plates (1, or 2 for the pot)
// each { recipeId, charred }, or null when nothing is ready to pull.
// A burnt dish pulls as trash: returns { trashed: true }.
export function pullStation(station) {
  if (station.state === 'burnt') {
    clearStation(station);
    return { trashed: true, recipeId: station.recipeId };
  }
  if (station.state !== 'ready' && station.state !== 'char') return null;
  const recipe = RECIPES[station.recipeId];
  const charred = station.state === 'char';
  const count = recipe.portions || 1;
  const plates = [];
  for (let i = 0; i < count; i++) plates.push({ recipeId: recipe.id, charred });
  clearStation(station);
  return { plates };
}

function clearStation(station) {
  station.state = 'idle';
  station.recipeId = null;
  station.progress = 0;
  station.burnt = false;
  if (station.queued) {
    const nextId = station.queued;
    station.queued = null;
    station.state = 'cooking';
    station.recipeId = nextId;
    station.progress = 0;
  }
}

// Fraction of the cook bar to fill, 0..1, clamped at the burn point.
export function stationFraction(station) {
  const total = station.cookSeconds + GREEN_WINDOW + CHAR_WINDOW + BURN_SECONDS;
  return Math.min(1, station.progress / total);
}

// Fraction inside the green window only, for the glow pulse.
export function stationGreenFraction(station) {
  if (station.state !== 'ready') return 0;
  return (station.progress - station.cookSeconds) / GREEN_WINDOW;
}
