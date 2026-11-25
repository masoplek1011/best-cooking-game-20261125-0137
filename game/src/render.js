// Hearthrow Hustle — every pixel the game draws. All art is procedural
// canvas shapes: warm food against a cool flat kitchen, laid out so one
// frame shows the whole game — order board, pantry bins, a dish mid-assembly
// on the cutting board, the three stations, the timer and a plate ready to
// serve. The hit zones live here too, so clicks and drawing never drift.

import { VIEW_W, VIEW_H, PALETTE, STATION_LABELS, STATION_SUBS, PRICES, RECIPE_NAMES, GREEN_WINDOW, CHAR_WINDOW, BURN_SECONDS, MAX_PLATES } from './config.js';
import { INGREDIENTS, ING_BY_ID, RECIPES } from './recipes.js';
import { stationFraction, stationGreenFraction } from './stations.js';
import { hitRect } from './input.js';

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: VIEW_W, h: 64 },
  board: { x: 316, y: 74, w: 648, h: 122 },
  pantry: { x: 16, y: 208, w: 284, h: 400 },
  prep: { x: 316, y: 208, w: 424, h: 352 },
  stations: { x: 756, y: 208, w: 508, h: 352 },
  rail: { x: 756, y: 576, w: 508, h: 128 },
  hints: { x: 16, y: 624, w: 724, h: 80 },
};

export function binRect(index) {
  const cols = 3;
  const bw = 84;
  const bh = 96;
  const gapX = 12;
  const gapY = 10;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: LAYOUT.pantry.x + 8 + col * (bw + gapX),
    y: LAYOUT.pantry.y + 34 + row * (bh + gapY),
    w: bw,
    h: bh,
  };
}

export function ticketRect(index) {
  const tw = 204;
  const gap = 12;
  return {
    x: LAYOUT.board.x + 8 + index * (tw + gap),
    y: LAYOUT.board.y + 8,
    w: tw,
    h: LAYOUT.board.h - 16,
  };
}

export function stationRect(id) {
  const order = ['skillet', 'pot', 'oven'];
  const idx = order.indexOf(id);
  const sw = 160;
  const gap = 14;
  return {
    x: LAYOUT.stations.x + 8 + idx * (sw + gap),
    y: LAYOUT.stations.y + 8,
    w: sw,
    h: LAYOUT.stations.h - 16,
  };
}

export function plateRect(index) {
  const pw = 96;
  return {
    x: LAYOUT.rail.x + 10 + index * (pw + 8),
    y: LAYOUT.rail.y + 34,
    w: pw,
    h: 84,
  };
}

export const CHUTE = { x: 1152, y: 576, w: 112, h: 128 };

export function boardRect() {
  return { x: LAYOUT.prep.x + 16, y: LAYOUT.prep.y + 56, w: LAYOUT.prep.w - 32, h: 220 };
}

// ---- small drawing helpers -------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || 'rgba(0,0,0,0.25)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(fw, h), h, h / 2);
    ctx.fill();
  }
}

export function drawIngredientIcon(ctx, ingId, cx, cy, r) {
  const ing = ING_BY_ID[ingId];
  if (!ing) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.deep;
  ctx.lineWidth = 2;
  if (ingId === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f6b93b';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'pepper') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, Math.PI * 0.15, Math.PI * 1.35);
    ctx.arc(-r * 0.4, -r * 0.2, r * 0.5, Math.PI * 1.2, Math.PI * 0.2, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.45, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.7, -r * 0.95, r * 0.35, -r * 1.0);
    ctx.stroke();
  } else if (ingId === 'cream') {
    rr(ctx, -r * 0.55, -r * 0.5, r * 1.1, r * 1.1, r * 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ing.deep;
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'root') {
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(-r * 0.4, -r * 1.0);
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(r * 0.35, -r * 1.0);
    ctx.stroke();
  } else if (ingId === 'broth') {
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.8, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.5);
    ctx.quadraticCurveTo(-r * 0.2, -r * 0.9, -r * 0.4, -r * 1.1);
    ctx.moveTo(r * 0.3, -r * 0.5);
    ctx.quadraticCurveTo(r * 0.5, -r * 0.9, r * 0.3, -r * 1.1);
    ctx.stroke();
  } else if (ingId === 'salt') {
    rr(ctx, -r * 0.4, -r * 0.7, r * 0.8, r * 1.3, r * 0.2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ing.deep;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * r * 0.22, -r * 0.85, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingId === 'dough') {
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.9, r * 0.6, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (ingId === 'honey') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.8, -r * 0.2);
    ctx.lineTo(r * 0.8, r * 0.7);
    ctx.lineTo(-r * 0.8, r * 0.7);
    ctx.lineTo(-r * 0.8, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-r * 0.5, r * 0.15, r, r * 0.16);
  } else if (ingId === 'sesame') {
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * r * 0.55;
      const oy = (i % 2 === 0 ? -r * 0.25 : r * 0.35);
      ctx.beginPath();
      ctx.ellipse(ox, oy, r * 0.32, r * 0.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawDishIcon(ctx, recipeId, cx, cy, r, charred) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return;
  ctx.save();
  ctx.translate(cx, cy);
  // Plate.
  ctx.fillStyle = '#fdfdf6';
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = recipe.dishColor;
  ctx.strokeStyle = recipe.dishDeep;
  if (recipeId === 'omelet') {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8542f';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.15, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.2, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (recipeId === 'stew') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.6, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c9a2d8';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.15, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2b705';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (charred) {
    ctx.fillStyle = 'rgba(40,20,8,0.45)';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'CHAR', 0, r * 0.75, 9, '#fff', 800, 'center');
  }
  ctx.restore();
}

// ---- the kitchen ----------------------------------------------------------------

function drawTopBar(ctx, state) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'HEARTHROW HUSTLE', 20, 26, 22, PALETTE.cream, 800);
  text(ctx, 'one-shift kitchen sprint', 20, 50, 12, '#9fb0c0', 600);
  // Shift timer: full-width bar with a clock you can feel.
  const tx = 330;
  const tw = 560;
  const frac = Math.max(0, state.timeLeft / state.shiftSeconds);
  const urgent = state.timeLeft <= 30;
  bar(ctx, tx, 20, tw, 16, frac, urgent ? PALETTE.bad : PALETTE.gold, 'rgba(255,255,255,0.14)');
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  ctx.fillStyle = 'rgba(20,26,34,0.55)';
  rr(ctx, tx + tw / 2 - 52, 20, 104, 16, 8);
  ctx.fill();
  text(ctx, `SHIFT ${mins}:${String(secs).padStart(2, '0')}`, tx + tw / 2, 28, 13, urgent ? '#ff8a80' : PALETTE.cream, 800, 'center');
  text(ctx, `EARNED $${state.score}`, 940, 26, 20, PALETTE.gold, 800);
  text(ctx, `${state.served} served · ${state.lost} lost`, 940, 50, 12, '#9fb0c0', 600);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, b.h - 2, VIEW_W, 2);
}

function drawTicket(ctx, ticket, index, state) {
  const r = ticketRect(index);
  const recipe = RECIPES[ticket.recipeId];
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const urgent = frac < 0.33;
  ctx.fillStyle = PALETTE.ticketBg;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  text(ctx, `#${ticket.id}`, r.x + 10, r.y + 16, 11, PALETTE.muted, 700);
  text(ctx, `$${PRICES[ticket.recipeId]}`, r.x + r.w - 10, r.y + 16, 13, '#7a5a12', 800, 'right');
  text(ctx, recipe.name, r.x + 10, r.y + 36, 15, PALETTE.ink, 800);
  // Ingredient icons the ticket needs.
  recipe.needs.forEach((ingId, i) => {
    drawIngredientIcon(ctx, ingId, r.x + 26 + i * 44, r.y + 66, 15);
  });
  // Patience ring: a countdown you read in a glance.
  const cx = r.x + r.w - 24;
  const cy = r.y + 66;
  ctx.fillStyle = '#e6d9bd';
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.good;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  text(ctx, `${Math.ceil(ticket.patience)}`, cx, cy, 11, PALETTE.ink, 800, 'center');
  if (ticket.modifier) {
    const tag = ticket.modifier === 'EXTRA CHAR' ? 'EXTRA CHAR' : 'DOUBLE TIP';
    ctx.fillStyle = ticket.modifier === 'EXTRA CHAR' ? '#5e3010' : '#7a5a12';
    rr(ctx, r.x + 10, r.y + r.h - 24, tag.length * 7 + 14, 16, 8);
    ctx.fill();
    text(ctx, tag, r.x + 17, r.y + r.h - 16, 10, '#ffe9b0', 800);
  }
  // Carried plate hovering a matching ticket: light it up.
  if (state.carried !== null && state.plates[state.carried]) {
    const plate = state.plates[state.carried];
    if (plate.recipeId === ticket.recipeId) {
      ctx.strokeStyle = PALETTE.good;
      ctx.lineWidth = 4;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12);
      ctx.stroke();
    }
  }
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#1d2733';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  state.tickets.forEach((t, i) => drawTicket(ctx, t, i, state));
}

function drawPantry(ctx, state) {
  const p = LAYOUT.pantry;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  text(ctx, 'PANTRY  ·  click a bin or press 1–9', p.x + 12, p.y + 20, 12, PALETTE.cream, 800);
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const inHand = state.hand === ing.id;
    ctx.fillStyle = inHand ? '#3d4b5c' : '#2c3947';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = inHand ? PALETTE.gold : '#4a5a6a';
    ctx.lineWidth = inHand ? 3 : 1.5;
    ctx.stroke();
    drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 32, 20);
    text(ctx, ing.short, r.x + r.w / 2, r.y + 66, 11, PALETTE.cream, 700, 'center');
    text(ctx, ing.key, r.x + 8, r.y + 14, 11, '#8fa3b5', 800);
    if (inHand) text(ctx, 'IN HAND', r.x + r.w / 2, r.y + 84, 9, PALETTE.gold, 800, 'center');
  });
}

function drawPrep(ctx, state) {
  const p = LAYOUT.prep;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, p.x, p.y, p.w, 26, 12);
  ctx.fill();
  text(ctx, 'PREP COUNTER', p.x + 14, p.y + 40, 12, '#ffe9c4', 800);
  const assembled = state.boardAssembled;
  text(
    ctx,
    assembled ? `${assembled.name} — READY · click its station` : 'Chop 3 ingredients, then load a station',
    p.x + p.w - 14, p.y + 40, 12, assembled ? '#7ddb8a' : '#ffe9c4', 800, 'right',
  );
  const b = boardRect();
  ctx.fillStyle = PALETTE.board;
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  // The dish mid-assembly: ingredients on the board, chopped ones marked.
  const items = state.board.items;
  if (items.length === 0) {
    text(ctx, 'CUTTING BOARD — empty', b.x + b.w / 2, b.y + b.h / 2 - 8, 14, '#8a6d3f', 700, 'center');
    text(ctx, 'grab ingredients from the pantry', b.x + b.w / 2, b.y + b.h / 2 + 16, 12, '#a5855a', 600, 'center');
  } else {
    items.forEach((item, i) => {
      const cx = b.x + 70 + i * 120;
      const cy = b.y + 92;
      drawIngredientIcon(ctx, item.ingId, cx, cy, 34);
      if (item.chopped) {
        ctx.strokeStyle = PALETTE.good;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy + 40);
        ctx.lineTo(cx - 4, cy + 50);
        ctx.lineTo(cx + 16, cy + 26);
        ctx.stroke();
        text(ctx, 'CHOPPED', cx, cy + 66, 10, '#2e7d32', 800, 'center');
      } else {
        // Chop meter under the item being worked.
        const frac = item.id === state.chopTargetId ? item.chop / 3 : item.chop / 3;
        bar(ctx, cx - 30, cy + 44, 60, 8, frac, PALETTE.accent, 'rgba(0,0,0,0.2)');
        text(ctx, `CHOP ${item.chop}/3`, cx, cy + 66, 10, PALETTE.muted, 800, 'center');
      }
    });
    if (assembled) {
      ctx.fillStyle = 'rgba(76,175,80,0.16)';
      rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 8);
      ctx.fill();
    }
  }
  // Hold-to-chop hint.
  text(ctx, 'HOLD mouse (or SPACE) on the board to chop', p.x + 14, p.y + p.h - 16, 12, '#ffe9c4', 600);
  const knifeX = p.x + p.w - 40;
  const knifeY = p.y + p.h - 22;
  ctx.save();
  ctx.translate(knifeX, knifeY);
  ctx.rotate(-0.6);
  ctx.fillStyle = '#dfe6ec';
  rr(ctx, -4, -16, 8, 26, 3);
  ctx.fill();
  ctx.fillStyle = '#5e3010';
  ctx.fillRect(-4, 10, 8, 12);
  ctx.restore();
}

function drawStation(ctx, station, state) {
  const r = stationRect(station.id);
  const ready = station.state === 'ready';
  const burnt = station.state === 'burnt';
  const cooking = station.state === 'cooking' || station.state === 'char';
  ctx.fillStyle = ready ? '#31483a' : '#2c3947';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = ready ? PALETTE.good : burnt ? PALETTE.bad : '#4a5a6a';
  ctx.lineWidth = ready || burnt ? 3 : 1.5;
  ctx.stroke();
  text(ctx, STATION_LABELS[station.id], r.x + r.w / 2, r.y + 18, 13, PALETTE.cream, 800, 'center');
  text(ctx, STATION_SUBS[station.id], r.x + r.w / 2, r.y + 36, 10, '#8fa3b5', 600, 'center');
  // The burner / vessel, drawn per station.
  const cx = r.x + r.w / 2;
  const cy = r.y + 108;
  ctx.save();
  ctx.translate(cx, cy);
  if (station.id === 'skillet') {
    ctx.fillStyle = '#20262e';
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(52, -8);
    ctx.lineTo(76, -16);
    ctx.lineWidth = 6;
    ctx.stroke();
  } else if (station.id === 'pot') {
    ctx.fillStyle = '#3a3f45';
    rr(ctx, -52, -34, 104, 72, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#22262b';
    ctx.beginPath();
    ctx.ellipse(0, -34, 52, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#3a3f45';
    rr(ctx, -56, -44, 112, 92, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#15181c';
    rr(ctx, -44, -30, 88, 56, 4);
    ctx.fill();
    ctx.strokeStyle = '#f4a259';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // What is cooking inside it.
  if (station.recipeId) {
    const recipe = RECIPES[station.recipeId];
    if (station.id === 'oven') {
      ctx.fillStyle = recipe.dishColor;
      ctx.beginPath();
      ctx.arc(0, -2, 24, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = recipe.dishColor;
      ctx.beginPath();
      ctx.arc(0, station.id === 'pot' ? -30 : 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-8, -8, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // Cook bar: fills to the green window, then amber (char), then red.
  const by = r.y + 196;
  const frac = stationFraction(station);
  let fill = PALETTE.accent;
  if (station.state === 'ready') fill = PALETTE.good;
  else if (station.state === 'char') fill = PALETTE.warn;
  else if (burnt) fill = PALETTE.bad;
  bar(ctx, r.x + 12, by, r.w - 24, 14, frac, fill, 'rgba(0,0,0,0.3)');
  // Green window marker on the bar.
  const doneFrac = station.cookSeconds / (station.cookSeconds + GREEN_WINDOW + CHAR_WINDOW + BURN_SECONDS);
  ctx.fillStyle = PALETTE.good;
  ctx.fillRect(r.x + 12 + doneFrac * (r.w - 24) - 1, by - 3, 2, 20);
  let status = 'EMPTY — load a dish';
  if (station.state === 'cooking') status = `COOKING ${Math.max(0, station.cookSeconds - station.progress).toFixed(0)}s…`;
  if (ready) status = 'READY — click to pull!';
  if (station.state === 'char') status = 'CHARRED — pull now!';
  if (burnt) status = 'BURNT — click to trash';
  text(ctx, status, r.x + r.w / 2, by + 32, 11, ready ? PALETTE.good : burnt ? '#ff8a80' : PALETTE.cream, 800, 'center');
  if (station.queued) {
    text(ctx, `QUEUED: ${RECIPES[station.queued].name}`, r.x + r.w / 2, by + 52, 10, PALETTE.gold, 700, 'center');
  }
  if (station.recipeId && (cooking || ready)) {
    text(ctx, RECIPES[station.recipeId].name, r.x + r.w / 2, r.y + 168, 12, '#ffe9c4', 700, 'center');
  }
}

function drawStations(ctx, state) {
  const s = LAYOUT.stations;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  text(ctx, 'STATIONS  ·  click a station to load / pull', s.x + 12, s.y + 20, 12, PALETTE.cream, 800);
  drawStation(ctx, state.stations.skillet, state);
  drawStation(ctx, state.stations.pot, state);
  drawStation(ctx, state.stations.oven, state);
}

function drawRail(ctx, state) {
  const rail = LAYOUT.rail;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, rail.x, rail.y, rail.w, rail.h, 12);
  ctx.fill();
  text(ctx, 'PLATE RAIL — click a plate, then its ticket', rail.x + 12, rail.y + 20, 12, PALETTE.cream, 800);
  state.plates.forEach((plate, i) => {
    const r = plateRect(i);
    const carried = state.carried === i;
    ctx.fillStyle = carried ? '#3d4b5c' : '#2c3947';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = carried ? PALETTE.gold : '#4a5a6a';
    ctx.lineWidth = carried ? 3 : 1.5;
    ctx.stroke();
    drawDishIcon(ctx, plate.recipeId, r.x + r.w / 2, r.y + 32, 26, plate.charred);
    text(ctx, RECIPE_NAMES[plate.recipeId].toUpperCase(), r.x + r.w / 2, r.y + 68, 9, PALETTE.cream, 800, 'center');
  });
  for (let i = state.plates.length; i < MAX_PLATES; i++) {
    const r = plateRect(i);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    text(ctx, '—', r.x + r.w / 2, r.y + r.h / 2, 16, '#5f6d7a', 700, 'center');
  }
  // Serve chute.
  const c = CHUTE;
  ctx.fillStyle = '#1d2733';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.strokeStyle = state.carried !== null ? PALETTE.good : '#4a5a6a';
  ctx.lineWidth = state.carried !== null ? 3 : 2;
  ctx.stroke();
  text(ctx, 'SERVE', c.x + c.w / 2, c.y + 26, 14, PALETTE.cream, 800, 'center');
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(c.x + 26, c.y + 66);
  ctx.lineTo(c.x + 78, c.y + 66);
  ctx.lineTo(c.x + 78, c.y + 50);
  ctx.lineTo(c.x + 100, c.y + 72);
  ctx.lineTo(c.x + 78, c.y + 94);
  ctx.lineTo(c.x + 78, c.y + 78);
  ctx.lineTo(c.x + 26, c.y + 78);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'chute', c.x + c.w / 2, c.y + 108, 11, '#8fa3b5', 600, 'center');
}

function drawHints(ctx, state) {
  const h = LAYOUT.hints;
  text(ctx, 'HOW TO PLAY', h.x + 2, h.y + 12, 12, PALETTE.cream, 800);
  const lines = [
    '1–9 pantry bin · click board to place · HOLD board / SPACE to chop (3x)',
    'Click a station to load a finished dish · pull in the GREEN window',
    'Click a plate, then its ticket to serve · 2 different tickets in 2s = DOUBLE TIP',
    'EXTRA CHAR tickets: pull one beat past full · R restarts · M mutes',
  ];
  lines.forEach((line, i) => text(ctx, line, h.x + 2, h.y + 32 + i * 16, 12, '#9fb0c0', 600));
  if (state.pairFlash > 0) {
    ctx.fillStyle = 'rgba(255,201,60,0.9)';
    rr(ctx, h.x + 430, h.y + 4, 280, 30, 8);
    ctx.fill();
    text(ctx, 'PAIR BONUS! DOUBLE TIP!', h.x + 570, h.y + 20, 14, '#5e3010', 800, 'center');
  }
}

function drawHand(ctx, state, input) {
  if (!state.hand) return;
  drawIngredientIcon(ctx, state.hand, input.mouseX, input.mouseY - 26, 18);
  text(ctx, ING_BY_ID[state.hand].name, input.mouseX, input.mouseY - 52, 11, PALETTE.cream, 700, 'center');
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(input.mouseX, input.mouseY - 26, 24, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMessages(ctx, state) {
  for (const m of state.messages) {
    ctx.globalAlpha = Math.max(0, Math.min(1, m.ttl / 0.5));
    ctx.font = '800 18px system-ui, sans-serif';
    const w = ctx.measureText(m.text).width + 28;
    ctx.fillStyle = 'rgba(20,26,34,0.88)';
    rr(ctx, m.x - w / 2, m.y - 17, w, 34, 9);
    ctx.fill();
    text(ctx, m.text, m.x, m.y, 18, m.color || PALETTE.gold, 800, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---- screens -------------------------------------------------------------------

export function drawKitchen(ctx, state, input) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tile backsplash band behind the counters.
  ctx.fillStyle = '#33414f';
  ctx.fillRect(0, 196, VIEW_W, 12);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 560, VIEW_W, 160);
  drawTopBar(ctx, state);
  drawBoard(ctx, state);
  drawPantry(ctx, state);
  drawPrep(ctx, state);
  drawStations(ctx, state);
  drawRail(ctx, state);
  drawHints(ctx, state);
  drawMessages(ctx, state);
  if (input) drawHand(ctx, state, input);
}

export function drawTitle(ctx, state, input) {
  drawKitchen(ctx, state, input);
  ctx.fillStyle = 'rgba(16,22,30,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'HEARTHROW HUSTLE', VIEW_W / 2, 190, 64, PALETTE.cream, 800, 'center');
  text(ctx, 'One shift. Three tickets. No chores — just cook.', VIEW_W / 2, 240, 20, PALETTE.accentSoft, 600, 'center');
  const lines = [
    'Read the order board, grab ingredients from the pantry (keys 1–9 or click),',
    'hold the cutting board to chop, load the skillet, pot or oven,',
    'pull in the green window, plate it and serve it before patience runs out.',
    '',
    'Pot serves two. Oven stacks two. Serve two different tickets within 2s for a double tip.',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 300 + i * 26, 16, '#c8d3de', 600, 'center'));
  // Three recipe cards.
  const cards = [
    { recipe: RECIPES.omelet, station: 'SKILLET · 8s' },
    { recipe: RECIPES.stew, station: 'POT · 12s · x2' },
    { recipe: RECIPES.flatbread, station: 'OVEN · 10s · x2' },
  ];
  cards.forEach((card, i) => {
    const x = 340 + i * 210;
    const y = 470;
    ctx.fillStyle = '#2c3947';
    rr(ctx, x, y, 190, 110, 12);
    ctx.fill();
    ctx.strokeStyle = '#4a5a6a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawDishIcon(ctx, card.recipe.id, x + 40, y + 34, 26, false);
    text(ctx, card.recipe.name, x + 76, y + 26, 14, PALETTE.cream, 800);
    text(ctx, card.station, x + 76, y + 48, 10, '#8fa3b5', 700);
    card.recipe.needs.forEach((ingId, j) => {
      drawIngredientIcon(ctx, ingId, x + 30 + j * 36, y + 82, 13);
    });
  });
  const pulse = 0.6 + 0.4 * Math.sin(state.titlePulse || 0);
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS ENTER TO START THE SHIFT', VIEW_W / 2, 640, 20, PALETTE.gold, 800, 'center');
  ctx.globalAlpha = 1;
}

export function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(16,22,30,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER', VIEW_W / 2, 220, 56, PALETTE.cream, 800, 'center');
  text(ctx, `You earned $${state.score}  ·  ${state.served} orders served  ·  ${state.lost} tickets lost`, VIEW_W / 2, 290, 22, PALETTE.gold, 700, 'center');
  const best = state.bestPair ? 'Best pair bonus: DOUBLE TIP banked!' : 'No pair bonus this shift — serve two different tickets within 2s next time.';
  text(ctx, best, VIEW_W / 2, 330, 16, '#c8d3de', 600, 'center');
  text(ctx, 'Press R to run another shift', VIEW_W / 2, 400, 18, PALETTE.cream, 800, 'center');
}

// ---- hit zones, shared by the game logic ----------------------------------------

export function zoneAt(x, y, state) {
  if (hitRect(x, y, CHUTE)) return { kind: 'chute' };
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (hitRect(x, y, binRect(i))) return { kind: 'bin', index: i };
  }
  if (hitRect(x, y, boardRect())) return { kind: 'board' };
  for (const id of ['skillet', 'pot', 'oven']) {
    if (hitRect(x, y, stationRect(id))) return { kind: 'station', id };
  }
  for (let i = 0; i < state.plates.length; i++) {
    if (hitRect(x, y, plateRect(i))) return { kind: 'plate', index: i };
  }
  for (let i = 0; i < state.tickets.length; i++) {
    if (hitRect(x, y, ticketRect(i))) return { kind: 'ticket', index: i };
  }
  return null;
}
