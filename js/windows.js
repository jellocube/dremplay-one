// Tool-window chrome: open/close, dragging, the top menu bar, and the
// console/material-designer/simple-window open state shared across modules.
import { canvas } from './renderer.js';
import { loadingOverlay } from './loading-ui.js';
import { inputState } from './input-state.js';
import { materialState } from './palette.js';
import { loadDesignerMaterial } from './material-designer.js';
import { syncOptionsWindow } from './options-panel.js';

export const uiState = { consoleOpen: false, designerOpen: false };

const startScreen=document.getElementById('startscreen');
const consoleEl=document.getElementById('console');
const consoleInput=document.getElementById('consoleInput');
const designerEl=document.getElementById('materialDesigner');
const designerMaterial=document.getElementById('designerMaterial');

export function anyToolOpen(){return !!document.querySelector('.tool-window.open');}
export function refreshWindowState(){
  startScreen.style.display=inputState.hasEnteredWorld?'none':'flex';
  document.querySelectorAll('.menu-button').forEach(button=>button.classList.toggle('active',document.getElementById(button.dataset.window)?.classList.contains('open')));
}

let topWindowZ=2000;
function bringToFront(win){win.style.zIndex=String(++topWindowZ);}
function makeDraggable(win){
  const bar=win.querySelector('.titlebar');
  let dragging=false,dx=0,dy=0;
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    const r=win.getBoundingClientRect();
    win.classList.add('dragged');win.style.left=`${r.left}px`;win.style.top=`${r.top}px`;win.style.right='auto';win.style.bottom='auto';
    dx=e.clientX-r.left;dy=e.clientY-r.top;dragging=true;bringToFront(win);bar.setPointerCapture(e.pointerId);e.preventDefault();
  });
  bar.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const maxX=Math.max(0,innerWidth-win.offsetWidth),maxY=Math.max(0,innerHeight-win.offsetHeight);
    win.style.left=`${Math.max(0,Math.min(maxX,e.clientX-dx))}px`;win.style.top=`${Math.max(0,Math.min(maxY,e.clientY-dy))}px`;
  });
  bar.addEventListener('pointerup',()=>{dragging=false;});
  win.addEventListener('pointerdown',()=>bringToFront(win));
}
document.querySelectorAll('.tool-window').forEach(makeDraggable);
makeDraggable(loadingOverlay);

export function setConsole(open){
  uiState.consoleOpen=open;
  consoleEl.classList.toggle('open',open);
  for(const k in inputState.keys)inputState.keys[k]=false;
  if(open){if(document.pointerLockElement)document.exitPointerLock();bringToFront(consoleEl);consoleInput.value='';consoleInput.focus();}
  else{consoleInput.blur();if(!uiState.designerOpen)canvas.focus();}
  refreshWindowState();
}
export function setDesigner(open){
  uiState.designerOpen=open;designerEl.classList.toggle('open',open);
  for(const k in inputState.keys)inputState.keys[k]=false;
  if(open){if(document.pointerLockElement)document.exitPointerLock();bringToFront(designerEl);designerMaterial.value=String(materialState.selected);loadDesignerMaterial();}
  else if(!uiState.consoleOpen)canvas.focus();
  refreshWindowState();
}
consoleEl.querySelector('.window-close').addEventListener('click',()=>setConsole(false));
designerEl.querySelector('.window-close').addEventListener('click',()=>setDesigner(false));
export function setSimpleWindow(win,open){
  win.classList.toggle('open',open);for(const k in inputState.keys)inputState.keys[k]=false;
  if(open){if(document.pointerLockElement)document.exitPointerLock();bringToFront(win);if(win.id==='optionsWindow')syncOptionsWindow();}
  refreshWindowState();
}
export function setWindowById(id,open){
  if(id==='console')setConsole(open);else if(id==='materialDesigner')setDesigner(open);else setSimpleWindow(document.getElementById(id),open);
}
export function returnToGameControl(){
  document.querySelectorAll('.tool-window.open').forEach(win=>win.classList.remove('open'));
  uiState.consoleOpen=false;uiState.designerOpen=false;consoleInput.blur();refreshWindowState();canvas.requestPointerLock();
}
document.querySelectorAll('.simple-window .window-close').forEach(button=>button.addEventListener('click',()=>setSimpleWindow(button.closest('.tool-window'),false)));
document.querySelectorAll('.menu-button').forEach(button=>button.addEventListener('click',()=>{const win=document.getElementById(button.dataset.window);setWindowById(win.id,!win.classList.contains('open'));}));
