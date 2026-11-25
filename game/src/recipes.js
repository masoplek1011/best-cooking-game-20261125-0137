// Hearthrow Hustle — ingredients and recipes. Nine pantry bins feed three
// original dishes, one per station, so every ticket is a route decision:
// the skillet is fast, the pot is slow but serves two, the oven stacks.

export const INGREDIENTS = [
  { id: 'egg', name: 'Egg', short: 'EGG', color: '#fff3c4', deep: '#e8b93c', key: '1' },
  { id: 'pepper', name: 'Charred Pepper', short: 'PEPPER', color: '#e8542f', deep: '#8f1d0d', key: '2' },
  { id: 'cream', name: 'Cream', short: 'CREAM', color: '#fdfdf6', deep: '#b8b39a', key: '3' },
  { id: 'root', name: 'Root Veg', short: 'ROOT', color: '#c9a2d8', deep: '#6a3d8a', key: '4' },
  { id: 'broth', name: 'Broth', short: 'BROTH', color: '#d98e32', deep: '#7a4a12', key: '5' },
  { id: 'salt', name: 'Smoked Salt', short: 'SALT', color: '#cfd4d8', deep: '#5f6d7a', key: '6' },
  { id: 'dough', name: 'Dough', short: 'DOUGH', color: '#f2ddb0', deep: '#a97e3f', key: '7' },
  { id: 'honey', name: 'Honey', short: 'HONEY', color: '#f2b705', deep: '#8a5c00', key: '8' },
  { id: 'sesame', name: 'Sesame', short: 'SESAME', color: '#efe3c2', deep: '#8a6d2f', key: '9' },
];

export const ING_BY_ID = {};
for (const ing of INGREDIENTS) ING_BY_ID[ing.id] = ing;

export const RECIPES = {
  omelet: {
    id: 'omelet',
    name: 'Ember Omelet',
    station: 'skillet',
    cookSeconds: 8,
    price: 8,
    needs: ['egg', 'pepper', 'cream'],
    dishColor: '#f6c945',
    dishDeep: '#c47f17',
  },
  stew: {
    id: 'stew',
    name: 'Dockhand Stew',
    station: 'pot',
    cookSeconds: 12,
    price: 10,
    needs: ['root', 'broth', 'salt'],
    dishColor: '#b06a2e',
    dishDeep: '#5e3010',
    portions: 2,
  },
  flatbread: {
    id: 'flatbread',
    name: 'Honeyed Flatbread',
    station: 'oven',
    cookSeconds: 10,
    price: 9,
    needs: ['dough', 'honey', 'sesame'],
    dishColor: '#e8b25c',
    dishDeep: '#9a6212',
    stacks: 2,
  },
};

export const RECIPE_LIST = [RECIPES.omelet, RECIPES.stew, RECIPES.flatbread];

export function recipeForStation(stationId) {
  for (const r of RECIPE_LIST) if (r.station === stationId) return r;
  return null;
}

// True when the chopped set on the board is exactly one recipe's needs,
// in any order. Extra or wrong items block the load, never silently cook.
export function matchRecipe(ingredientIds) {
  if (ingredientIds.length !== 3) return null;
  const have = ingredientIds.slice().sort().join(',');
  for (const r of RECIPE_LIST) {
    if (r.needs.slice().sort().join(',') === have) return r;
  }
  return null;
}
