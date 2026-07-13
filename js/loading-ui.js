// Persistent bottom-right loading/status panel. Accessibility invariant: this
// panel never toggles display, visibility, or opacity after boot; only its
// text, progress and conveyor contents change.
const loadingOverlay=document.getElementById('loadingOverlay'),loadingText=document.getElementById('loadingText'),loadingPercent=document.getElementById('loadingPercent'),loadingFill=document.getElementById('loadingFill'),loadingConsole=document.getElementById('loadingConsole'),loadingClose=document.getElementById('loadingClose'),cartonConveyor=document.getElementById('cartonConveyor');

const CONVEYOR_PACKETS={
  initialize:{gap:7,items:['Seed intake','Math.imul','Quintic fade','fBm octave','Domain warp']},
  terrain:{gap:5,items:['Ridged fBm','Alluvial mask','Curvature proxy','Strata lens','Resource seed']},
  assemble:{gap:11,items:['Chunk key','X-row copy','Circular ring','Local→physical','Sparse provenance']},
  audit:{gap:15,items:['Seam hash','Water bounds','Palette index','Dirty retention','Provenance map']},
  upload:{gap:21,items:['R8UI','texImage3D','UNPACK 1','UNSIGNED_BYTE','Palette texel']},
  prefetch:{gap:9,items:['Hysteresis box','Prefetch margin','Frontier deque','Ring modulo','Clean eviction']},
  recover:{gap:17,items:['texSubImage3D','Slab upload','ringX / ringZ','Chunk encoder','Cache commit']},
  frame:{gap:13,items:['Frame timer','Raymarch submit','Water budget','GPU fence','Scheduler yield']},
  ready:{gap:0,items:[]}
};
let conveyorPhase='',loadingActive=true;
function phaseForLoadingTask(label){
  const s=label.toLowerCase();
  if(s.includes('ready')||s.includes('task complete'))return 'ready';
  if(s.includes('frame overrun'))return 'frame';
  if(s.includes('upload'))return 'upload';
  if(s.includes('audit')||s.includes('inspect'))return 'audit';
  if(s.includes('generat'))return 'terrain';
  if(s.includes('assembl')||s.includes('resident ring'))return 'assemble';
  if(s.includes('precomput')||s.includes('predictive')||s.includes('frontier sector'))return 'prefetch';
  if(s.includes('resolv')||s.includes('cache miss')||s.includes('landscape ahead'))return 'recover';
  return 'initialize';
}
function setConveyorPhase(phase){
  if(phase===conveyorPhase)return;conveyorPhase=phase;const config=CONVEYOR_PACKETS[phase]||CONVEYOR_PACKETS.initialize;
  cartonConveyor.style.setProperty('--packet-gap',`${config.gap}px`);
  document.querySelectorAll('#cartonBelt .packet-set').forEach(track=>track.replaceChildren(...config.items.map(label=>{const item=document.createElement('span');item.textContent=label;return item;})));
}

// Boot/engine-ready flags shared with the start screen and console.
export const bootState = { engineReady: false, bootLoadStarted: 0 };

let loadingLogLines=[];
export function loadingLog(station,detail){
  const seconds=bootState.bootLoadStarted?((performance.now()-bootState.bootLoadStarted)/1000).toFixed(1):'0.0';
  const followTail=loadingConsole.scrollHeight-loadingConsole.clientHeight-loadingConsole.scrollTop<12;
  loadingLogLines.push(`${seconds.padStart(5,' ')}s  ${station.padEnd(14,' ')} ${detail}`);loadingLogLines=loadingLogLines.slice(-300);
  loadingConsole.textContent=loadingLogLines.join('\n');if(followTail)loadingConsole.scrollTop=loadingConsole.scrollHeight;
}
export function resetLoadingLog(){ loadingLogLines=[]; }
export function showLoading(text,progress=0,streaming=false){
  const phase=phaseForLoadingTask(text);setConveyorPhase(phase);loadingActive=phase!=='ready';
  if(loadingActive)loadingOverlay.style.display='block';loadingClose.disabled=loadingActive;loadingClose.setAttribute('aria-disabled',String(loadingActive));
  loadingOverlay.classList.toggle('streaming',streaming);loadingText.textContent=text;
  const pct=Math.max(0,Math.min(1,progress))*100;loadingPercent.textContent=`${pct.toFixed(1)}%`;loadingFill.style.width=`${pct.toFixed(3)}%`;
}
loadingClose.addEventListener('click',()=>{if(!loadingActive)loadingOverlay.style.display='none';});
let lastStableStatus='';
export function hideLoading(message='Task complete. Ready to play.'){
  loadingOverlay.classList.remove('streaming');
  showLoading(message,1,false);
  if(message!==lastStableStatus){lastStableStatus=message;loadingLog('Task complete','Ready to play. Predictive cache remains active.');}
}
export { loadingOverlay };
