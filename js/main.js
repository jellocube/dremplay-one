// Entry point: wires up every subsystem and drives the boot sequence + game loop.
import { VS, VY, CHUNK_SIZE, LOADED_CHUNKS_XZ, LOADED_CHUNKS_Y, BOOT_PREFETCH_MARGIN, MINIMUM_BOOT_PRELOAD_MS, LOADED_SIZE_X, LOADED_SIZE_Y, LOADED_SIZE_Z, FULL_UPLOAD_BYTES } from './constants.js';
import { generateChunk, assembleLoadedGrid, groundHeightAt, windowState, chunks, dirtyChunks } from './world.js';
import { resourceChunks } from './resources.js';
import { canvas, gl, initGL, resize, render, uploadInitialVolume, perfState } from './renderer.js';
import { playerState, updatePlayer, doAction } from './player.js';
import { streamState, processStreamTask, processBackgroundPrefetch, updateLoadedWindow } from './streaming.js';
import { updateWater, waterQueue } from './water.js';
import { showLoading, hideLoading, loadingLog, resetLoadingLog, bootState } from './loading-ui.js';
import { MATERIAL_NAMES, materialState } from './palette.js';
import { settings } from './settings.js';
import { inputState } from './input-state.js';
import { uiState, refreshWindowState } from './windows.js';

import './material-designer.js';
import './resource-designer.js';
import './options-panel.js';
import './console.js';
import './input.js';

const startBtn=document.getElementById('startBtn');

//////////////////////////////////////////////////////////////////////////
// BOOT SEQUENCE
//////////////////////////////////////////////////////////////////////////
function finishInitialWorld(){
  showLoading('Uploading resident voxel volume',0.965,false);loadingLog('GPU transfer',`writing ${(FULL_UPLOAD_BYTES/1048576).toFixed(0)} MiB R8UI texture`);
  uploadInitialVolume();
  const sx=Math.floor(LOADED_SIZE_X/2),sz=Math.floor(LOADED_SIZE_Z/2),gh=groundHeightAt(windowState.minX+sx,windowState.minZ+sz);
  playerState.pos={x:(windowState.minX+sx+0.5)*VS,y:(gh+1)*VY+0.02,z:(windowState.minZ+sz+0.5)*VS};playerState.spawnPos={...playerState.pos};
  resize();window.addEventListener('resize',resize);bootState.engineReady=true;startBtn.disabled=false;startBtn.setAttribute('aria-disabled','false');startBtn.textContent='Enter world';streamState.nextCacheNoticeAt=performance.now()+20000;
  showLoading('Task complete. Ready to play.',1,false);loadingLog('Commit','24×24 resident ring verified; predictive frontier queued for background growth');hideLoading();refreshWindowState();lastT=performance.now();requestAnimationFrame(loop);
}

let verificationStarted=0,verificationDuration=1,lastAuditLog=-1;
function waitForMinimumPreload(){
  const elapsed=performance.now()-bootState.bootLoadStarted;
  if(!verificationStarted){verificationStarted=performance.now();verificationDuration=Math.max(1,MINIMUM_BOOT_PRELOAD_MS-elapsed);loadingLog('Cache audit',`${chunks.size} generated chunks entering consistency pass`);}
  if(elapsed<MINIMUM_BOOT_PRELOAD_MS){
    const inspection=Math.min(1,(performance.now()-verificationStarted)/verificationDuration);
    showLoading('Auditing resident ring',0.74+0.20*inspection,false);
    const auditSecond=Math.floor((performance.now()-verificationStarted)/5000);
    if(auditSecond!==lastAuditLog){lastAuditLog=auditSecond;loadingLog('Field audit',`pass ${auditSecond+1}: strata continuity, biome masks and water bounds`);}
    requestAnimationFrame(waitForMinimumPreload);return;
  }
  showLoading('Resident audit complete',0.95,false);loadingLog('Release','resident ring accepted; wider predictive frontier will grow during play');requestAnimationFrame(finishInitialWorld);
}

function beginInitialWorldLoad(){
  bootState.bootLoadStarted=performance.now();
  resetLoadingLog();loadingLog('Seed intake','terrain seed accepted; initializing deterministic samplers');
  const jobs=[];
  const minCX=Math.floor(windowState.minX/CHUNK_SIZE)-BOOT_PREFETCH_MARGIN,minCZ=Math.floor(windowState.minZ/CHUNK_SIZE)-BOOT_PREFETCH_MARGIN,minCY=Math.floor(windowState.minY/CHUNK_SIZE);
  const span=LOADED_CHUNKS_XZ+BOOT_PREFETCH_MARGIN*2;
  for(let cx=0;cx<span;cx++)for(let cz=0;cz<span;cz++)for(let cy=0;cy<LOADED_CHUNKS_Y;cy++)jobs.push([minCX+cx,minCY+cy,minCZ+cz]);
  let done=0,lastLoggedStep=-1;
  const batch=()=>{
    const started=performance.now();
    while(done<jobs.length&&performance.now()-started<11){generateChunk(...jobs[done++]);}
    const work=done/jobs.length;
    showLoading(`Generating ${span}×${span} chunk field`,0.02+work*0.68,false);
    const logStep=Math.floor(work*20);
    if(logStep!==lastLoggedStep){
      lastLoggedStep=logStep;const job=jobs[Math.max(0,done-1)]||jobs[0];
      const stations=['Height sampler','Domain warp','Strata solver','Biome classifier','Resource pass','Chunk encoder'];
      loadingLog(stations[logStep%stations.length],`${done}/${jobs.length} chunks · coordinate ${job[0]},${job[1]},${job[2]}`);
    }
    if(done<jobs.length){requestAnimationFrame(batch);return;}
    showLoading('Assembling resident ring',0.72,false);loadingLog('Ring encoder','mapping chunk rows into circular GPU coordinates');
    requestAnimationFrame(()=>{assembleLoadedGrid();showLoading('Resident ring assembled',0.74,false);loadingLog('Volume check',`${LOADED_SIZE_X}×${LOADED_SIZE_Y}×${LOADED_SIZE_Z} voxels indexed`);requestAnimationFrame(waitForMinimumPreload);});
  };
  requestAnimationFrame(batch);
}

//////////////////////////////////////////////////////////////////////////
// MAIN LOOP
//////////////////////////////////////////////////////////////////////////
let lastT = performance.now();
let frameCount=0, fpsAccum=0, fps=0,lastOverrunReport=0,lagNoticeUntil=0;

function describeActiveFrameWork(){
  const task=streamState.task;
  if(task){
    if(task.phase==='upload')return `GPU resident-ring slice ${Math.min(task.uploadDone+1,task.uploadBoxes.length)}/${task.uploadBoxes.length}`;
    return `frontier terrain chunk ${Math.min(task.done+1,task.jobs.length)}/${task.jobs.length}`;
  }
  if(streamState.prefetchJobs.length)return `predictive frontier generation · ${streamState.prefetchJobs.length} chunks remain`;
  if(waterQueue.length)return `water simulation queue · ${waterQueue.length} cells remain`;
  return 'raymarch render and simulation · no world load active';
}
function reportFrameOverrun(frameMs){
  const now=performance.now();if(frameMs<42||now-lastOverrunReport<750||document.hidden)return;
  lastOverrunReport=now;const work=describeActiveFrameWork();loadingLog('Frame overrun',`${frameMs.toFixed(1)} ms · ${work}`);
  if(!streamState.task&&!streamState.cacheNoticeActive){showLoading(`Frame overrun · ${work}`,0,true);lagNoticeUntil=now+1200;}
}

function loop(now){
  const frameStarted=performance.now();
  const frameGapMs=now-lastT;
  const dt = Math.min(frameGapMs/1000, 0.05);
  lastT = now;

  if(streamState.task)processStreamTask();
  else processBackgroundPrefetch();
  if (inputState.locked && !uiState.consoleOpen) {
    updatePlayer(dt, inputState.keys);
    if(!streamState.task)updateLoadedWindow(Math.floor(playerState.pos.x/VS), Math.floor(playerState.pos.z/VS));
    updateWater();
    if (inputState.mouseDown >= 0 && now >= inputState.nextEditAt) { doAction(inputState.mouseDown); inputState.nextEditAt = now + 140; }
  }

  render();
  reportFrameOverrun(Math.max(frameGapMs,performance.now()-frameStarted));
  if(lagNoticeUntil&&performance.now()>=lagNoticeUntil&&!streamState.task&&!streamState.cacheNoticeActive){lagNoticeUntil=0;hideLoading();}

  frameCount++; fpsAccum += dt;
  if (fpsAccum >= 0.5){
    fps = frameCount/fpsAccum;
    frameCount = 0; fpsAccum = 0;
    document.getElementById('stats').textContent =
      `${fps.toFixed(0)} fps · lightmode ${settings.lightMode} · ${settings.timeOfDay.toFixed(1)}h · material ${MATERIAL_NAMES[materialState.selected]} · ${canvas.width}×${canvas.height}\n`+
      `${chunks.size} chunks · ${(chunks.size*CHUNK_SIZE*CHUNK_SIZE*CHUNK_SIZE/1048576).toFixed(1)} MiB CPU · ${(FULL_UPLOAD_BYTES/1048576).toFixed(1)} MiB GPU\n`+
      `${dirtyChunks.size} edited chunks · ${resourceChunks.size} provenance chunks · ring ${windowState.ringX},${windowState.ringZ}\n`+
      `uploads ${(perfState.uploadBytes/1048576).toFixed(2)} MiB · ${perfState.uploadMs.toFixed(2)} ms · stream ${perfState.streamMs.toFixed(1)} ms\n`+
      `xyz ${playerState.pos.x.toFixed(1)}, ${playerState.pos.y.toFixed(1)}, ${playerState.pos.z.toFixed(1)} m`;
    perfState.uploadBytes=0; perfState.uploadMs=0; perfState.streamMs=0;
  }

  requestAnimationFrame(loop);
}

if (gl) { initGL(); beginInitialWorldLoad(); }
