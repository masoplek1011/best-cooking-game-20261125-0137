// Hearthrow Hustle — keyboard and mouse. One job: turn raw DOM events
// into game intents (clicks on named zones, held keys) and keep the cursor
// position in canvas coordinates. It knows nothing about recipes or rules.

export function makeInput(canvas) {
  const input = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseClicked: null, // { x, y } consumed once per frame by the game
    keysDown: new Set(),
    keysPressed: new Set(), // consumed once per frame by the game
    hover: null,
  };

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });

  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
  });

  canvas.addEventListener('mouseup', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = false;
    input.mouseClicked = p;
  });

  canvas.addEventListener('mouseleave', () => {
    input.mouseDown = false;
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    if (!event.repeat) input.keysPressed.add(key);
    input.keysDown.add(key);
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    input.keysDown.delete(key);
  });

  window.addEventListener('blur', () => {
    input.keysDown.clear();
    input.mouseDown = false;
  });

  // The game calls this at the end of each fixed step: clicks and key
  // presses are one-shot intents, holds stay live while the key is down.
  input.endStep = function endStep() {
    input.mouseClicked = null;
    input.keysPressed.clear();
  };

  input.consumeClick = function consumeClick() {
    const c = input.mouseClicked;
    input.mouseClicked = null;
    return c;
  };

  input.wasPressed = function wasPressed(key) {
    return input.keysPressed.has(key);
  };

  input.isDown = function isDown(key) {
    return input.keysDown.has(key);
  };

  return input;
}

// Point-in-rectangle test shared by the game and the renderer hit zones.
export function hitRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
