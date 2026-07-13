//////////////////////////////////////////////////////////////////////////
// INPUT
//////////////////////////////////////////////////////////////////////////
import { inputState } from './input-state.js';
import { canvas } from './renderer.js';
import { playerState, doAction } from './player.js';
import { bootState } from './loading-ui.js';
import { uiState, setConsole, setWindowById, returnToGameControl, anyToolOpen, refreshWindowState } from './windows.js';

const startScreen=document.getElementById('startscreen');
const startBtn=document.getElementById('startBtn');

window.addEventListener('keydown', e => {
  if(e.code==='Slash'){setConsole(!uiState.consoleOpen);e.preventDefault();return;}
  const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement;
  if(inputState.hasEnteredWorld&&!typing&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
    const button=document.querySelector(`.menu-button[data-hotkey="${e.key.toLowerCase()}"]`);
    if(button){const win=document.getElementById(button.dataset.window);setWindowById(win.id,!win.classList.contains('open'));e.preventDefault();return;}
  }
  if(inputState.hasEnteredWorld&&!typing&&(e.code==='Escape'||e.code==='Space')){
    if(inputState.locked){if(e.code==='Escape')inputState.focusMenuOnUnlock=true;document.exitPointerLock();}else returnToGameControl();
    e.preventDefault();return;
  }
  if(anyToolOpen()){
    e.preventDefault();return;
  }
  inputState.keys[e.code]=true;
  if (e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='ControlLeft'||e.code==='ControlRight') e.preventDefault();
});
window.addEventListener('keyup', e => { inputState.keys[e.code]=false; });

startBtn.addEventListener('click',()=>{if(!bootState.engineReady)return;inputState.hasEnteredWorld=true;refreshWindowState();canvas.requestPointerLock();});
canvas.addEventListener('click',()=>{if(inputState.hasEnteredWorld&&!inputState.locked)canvas.requestPointerLock();});

document.addEventListener('pointerlockchange', () => {
  inputState.locked = document.pointerLockElement === canvas;
  document.body.classList.toggle('cursor-mode',!inputState.locked);
  refreshWindowState();
  if(!inputState.locked&&inputState.focusMenuOnUnlock){inputState.focusMenuOnUnlock=false;document.querySelector('.menu-button')?.focus();}
});

window.addEventListener('mousemove', e => {
  if (!inputState.locked || uiState.consoleOpen) return;
  playerState.yaw -= e.movementX * 0.0022;
  playerState.pitch -= e.movementY * 0.0022;
  playerState.pitch = Math.max(-1.5, Math.min(1.5, playerState.pitch));
});

window.addEventListener('mousedown', e => { if (inputState.locked && !uiState.consoleOpen && (e.button===0 || e.button===2)){ inputState.mouseDown=e.button; doAction(e.button); inputState.nextEditAt=performance.now()+140; } });
window.addEventListener('mouseup', () => { inputState.mouseDown=-1; });
window.addEventListener('blur', () => { inputState.mouseDown=-1; for (const k in inputState.keys) inputState.keys[k]=false; });
window.addEventListener('contextmenu', e => e.preventDefault());
