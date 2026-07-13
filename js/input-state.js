// Raw input/session flags shared between input.js (which mutates them on
// keyboard/mouse/pointer-lock events) and modules that only need to read
// them (windows.js, player.js via main.js, console.js).
export const inputState = {
  keys: {},
  locked: false,
  hasEnteredWorld: false,
  focusMenuOnUnlock: false,
  mouseDown: -1,
  nextEditAt: 0
};
