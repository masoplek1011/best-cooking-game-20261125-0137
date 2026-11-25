// Hearthrow Hustle — order tickets and the till. Three tickets stay open;
// serving one (or letting its patience run out) deals a fresh one from the
// seeded stream. Tips shrink as patience drains; serving two different
// tickets inside the pair window doubles the second tip.

import { TICKET_SLOTS, TICKET_PATIENCE, PAIR_WINDOW, PRICES } from './config.js';
import { RECIPE_LIST } from './recipes.js';
import { pickFrom } from './random.js';

let nextTicketId = 1;

export function makeTicket(rng, now) {
  const recipe = pickFrom(rng, RECIPE_LIST);
  const roll = rng();
  const modifier = roll < 0.22 ? 'EXTRA CHAR' : roll < 0.34 ? 'DOUBLE TIP' : null;
  return {
    id: nextTicketId++,
    recipeId: recipe.id,
    patience: TICKET_PATIENCE,
    maxPatience: TICKET_PATIENCE,
    modifier,
    bornAt: now,
    served: false,
    expired: false,
  };
}

export function freshBoard(rng) {
  const tickets = [];
  for (let i = 0; i < TICKET_SLOTS; i++) tickets.push(makeTicket(rng, 0));
  return tickets;
}

// Tick every open ticket's patience down. Returns the tickets that expired
// this step so the caller can deal replacements.
export function tickTickets(tickets, rng, dt, now) {
  const expired = [];
  for (const t of tickets) {
    if (t.served || t.expired) continue;
    t.patience -= dt;
    if (t.patience <= 0) {
      t.patience = 0;
      t.expired = true;
      expired.push(t);
    }
  }
  for (const t of expired) {
    const idx = tickets.indexOf(t);
    if (idx !== -1) tickets[idx] = makeTicket(rng, now);
  }
  return expired;
}

export function ticketPrice(ticket) {
  const base = PRICES[ticket.recipeId];
  const patienceFrac = Math.max(0, ticket.patience / ticket.maxPatience);
  let tip = Math.round(1 + 4 * patienceFrac);
  if (ticket.modifier === 'DOUBLE TIP') tip *= 2;
  return { base, tip };
}

// Serve a plate to a ticket. Returns the payout record, or null when the
// plate does not match the ticket. The pair bonus lives on the caller:
// pass the seconds since the last serve of a *different* recipe.
export function serveTicket(ticket, plate, secondsSinceOtherServe) {
  if (!ticket || ticket.served || ticket.expired) return null;
  if (plate.recipeId !== ticket.recipeId) return null;
  if (ticket.modifier === 'EXTRA CHAR' && !plate.charred) return null;
  const { base, tip } = ticketPrice(ticket);
  let paidTip = tip;
  let pairBonus = false;
  if (secondsSinceOtherServe !== null && secondsSinceOtherServe <= PAIR_WINDOW) {
    paidTip = tip * 2;
    pairBonus = true;
  }
  ticket.served = true;
  return {
    ticketId: ticket.id,
    recipeId: ticket.recipeId,
    base,
    tip: paidTip,
    total: base + paidTip,
    pairBonus,
    charred: !!plate.charred,
  };
}
