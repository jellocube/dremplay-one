// === POSITION-ANCHORED SLIDING LOADED WINDOW ===
import { CHUNK_SIZE, LOADED_CHUNKS_XZ, LOADED_CHUNKS_Y, PREFETCH_MARGIN, LOADED_SIZE_X, LOADED_SIZE_Y, LOADED_SIZE_Z } from './constants.js';
import { mod, chunkKey } from './coords.js';
import { generateChunk, generatedChunks, evictDistantCleanChunks, windowState } from './world.js';
import { uploadLocalBox, perfState } from './renderer.js';
import { showLoading, hideLoading, loadingLog } from './loading-ui.js';

export const streamState = {
  task: null,
  prefetchJobs: [],
  prefetchSignature: '',
  lastStreamShiftAt: 0,
  nextCacheNoticeAt: Infinity,
  cacheNoticeActive: false,
  cacheNoticeTotal: 0,
  cacheNoticeHideAt: 0
};

function rebuildPrefetchQueue(){
  const minCX=Math.floor(windowState.minX/CHUNK_SIZE)-PREFETCH_MARGIN,minCZ=Math.floor(windowState.minZ/CHUNK_SIZE)-PREFETCH_MARGIN,minCY=Math.floor(windowState.minY/CHUNK_SIZE);
  const span=LOADED_CHUNKS_XZ+PREFETCH_MARGIN*2,signature=`${minCX},${minCZ}`;
  if(signature===streamState.prefetchSignature)return;
  streamState.prefetchSignature=signature;streamState.prefetchJobs=[];
  // Work from the inner edge outward so the chunks most likely to enter the
  // renderer are prepared first.
  for(let ring=PREFETCH_MARGIN-1;ring>=0;ring--){
    const lo=ring,hi=span-1-ring;
    for(let x=lo;x<=hi;x++)for(const z of [lo,hi])for(let cy=0;cy<LOADED_CHUNKS_Y;cy++){
      const job=[minCX+x,minCY+cy,minCZ+z];if(!generatedChunks.has(chunkKey(...job)))streamState.prefetchJobs.push(job);
    }
    for(let z=lo+1;z<hi;z++)for(const x of [lo,hi])for(let cy=0;cy<LOADED_CHUNKS_Y;cy++){
      const job=[minCX+x,minCY+cy,minCZ+z];if(!generatedChunks.has(chunkKey(...job)))streamState.prefetchJobs.push(job);
    }
  }
}
export function processBackgroundPrefetch(){
  rebuildPrefetchQueue();
  const now=performance.now();
  if(now>=streamState.nextCacheNoticeAt){
    streamState.nextCacheNoticeAt=now+20000;streamState.cacheNoticeActive=true;streamState.cacheNoticeTotal=Math.max(1,streamState.prefetchJobs.length);streamState.cacheNoticeHideAt=0;
    showLoading(streamState.prefetchJobs.length?'Precomputing frontier sectors':'Predictive cache ready',streamState.prefetchJobs.length?0:1,true);
    loadingLog('Motion predictor',streamState.prefetchJobs.length?`${streamState.prefetchJobs.length} frontier chunks queued by proximity`:'frontier ring is current');
    if(!streamState.prefetchJobs.length)streamState.cacheNoticeHideAt=now+1000;
  }
  const started=performance.now();
  while(streamState.prefetchJobs.length&&performance.now()-started<2){generateChunk(...streamState.prefetchJobs.shift());}
  if(streamState.cacheNoticeActive){
    if(streamState.prefetchJobs.length)showLoading('Precomputing frontier sectors',1-streamState.prefetchJobs.length/streamState.cacheNoticeTotal,true);
    else{
      showLoading('Predictive cache ready',1,true);if(!streamState.cacheNoticeHideAt){streamState.cacheNoticeHideAt=performance.now()+700;loadingLog('Frontier commit','next resident sectors available before boundary crossing');}
      if(performance.now()>=streamState.cacheNoticeHideAt){streamState.cacheNoticeActive=false;hideLoading();}
    }
  }
}
export function queueStreamShift(shiftX,shiftZ){
  const newMinX=windowState.minX+shiftX,newMinZ=windowState.minZ+shiftZ,unique=new Set(),jobs=[];
  const add=(cx,cy,cz)=>{const key=chunkKey(cx,cy,cz);if(!generatedChunks.has(key)&&!unique.has(key)){unique.add(key);jobs.push([cx,cy,cz]);}};
  const minCX=Math.floor(newMinX/CHUNK_SIZE),minCY=Math.floor(windowState.minY/CHUNK_SIZE),minCZ=Math.floor(newMinZ/CHUNK_SIZE);
  if(shiftX){const cx=minCX+(shiftX>0?LOADED_CHUNKS_XZ-1:0);for(let cz=0;cz<LOADED_CHUNKS_XZ;cz++)for(let cy=0;cy<LOADED_CHUNKS_Y;cy++)add(cx,minCY+cy,minCZ+cz);}
  if(shiftZ){const cz=minCZ+(shiftZ>0?LOADED_CHUNKS_XZ-1:0);for(let cx=0;cx<LOADED_CHUNKS_XZ;cx++)for(let cy=0;cy<LOADED_CHUNKS_Y;cy++)add(minCX+cx,minCY+cy,cz);}
  streamState.task={shiftX,shiftZ,newMinX,newMinZ,jobs,done:0,started:performance.now(),phase:'generate',uploadBoxes:[],uploadDone:0,lastLoggedSlice:-1};
  showLoading(jobs.length?'Generating missing frontier chunks':'Preparing resident frontier slices',0,true);
  loadingLog('Stream request',`${shiftX},${shiftZ} voxel ring shift · ${jobs.length} cache misses`);
}
const STREAM_UPLOAD_SLICE=32;
function buildStreamUploadBoxes(task){
  const boxes=[];
  if(task.shiftX){
    const x0=task.shiftX>0?LOADED_SIZE_X-CHUNK_SIZE:0;
    for(let z=0;z<LOADED_SIZE_Z;z+=STREAM_UPLOAD_SLICE)boxes.push([x0,0,z,x0+CHUNK_SIZE-1,LOADED_SIZE_Y-1,Math.min(LOADED_SIZE_Z-1,z+STREAM_UPLOAD_SLICE-1)]);
  }
  if(task.shiftZ){
    const z0=task.shiftZ>0?LOADED_SIZE_Z-CHUNK_SIZE:0;
    for(let x=0;x<LOADED_SIZE_X;x+=STREAM_UPLOAD_SLICE)boxes.push([x,0,z0,Math.min(LOADED_SIZE_X-1,x+STREAM_UPLOAD_SLICE-1),LOADED_SIZE_Y-1,z0+CHUNK_SIZE-1]);
  }
  return boxes;
}
export function processStreamTask(){
  const task=streamState.task,started=performance.now();
  if(task.phase==='generate'){
    while(task.done<task.jobs.length&&performance.now()-started<2)generateChunk(...task.jobs[task.done++]);
    if(task.done<task.jobs.length){showLoading('Generating missing frontier chunks',0.15*task.done/task.jobs.length,true);return;}
    windowState.minX=task.newMinX;windowState.minZ=task.newMinZ;
    windowState.ringX=mod(windowState.ringX+task.shiftX,LOADED_SIZE_X);windowState.ringZ=mod(windowState.ringZ+task.shiftZ,LOADED_SIZE_Z);
    task.uploadBoxes=buildStreamUploadBoxes(task);task.phase='upload';
    loadingLog('Ring remap',`${task.uploadBoxes.length} bounded GPU slices queued; ${STREAM_UPLOAD_SLICE}-voxel strip width`);
  }
  if(task.phase==='upload'&&task.uploadDone<task.uploadBoxes.length){
    const uploadStarted=performance.now();
    // Row-copy staging makes the complete slab cheap enough to install before
    // the next render. Never expose a partly replaced resident edge.
    while(task.uploadDone<task.uploadBoxes.length){
      const box=task.uploadBoxes[task.uploadDone++];uploadLocalBox(...box);
    }
    const batchMs=performance.now()-uploadStarted;
    loadingLog('Atomic ring swap',`${task.uploadDone} slices · ${(perfState.uploadBytes/1048576).toFixed(2)} MiB cumulative · ${batchMs.toFixed(1)} ms`);
    showLoading('Uploading resident-ring slices',0.15+0.84*task.uploadDone/task.uploadBoxes.length,true);
  }
  evictDistantCleanChunks();perfState.streamMs+=performance.now()-task.started;loadingLog('Stream commit',`${task.uploadBoxes.length} slices installed in ${perfState.streamMs.toFixed(1)} ms accumulated`);streamState.task=null;hideLoading();streamState.lastStreamShiftAt=performance.now();
}
export function updateLoadedWindow(playerVoxelX, playerVoxelZ) {
  let shiftX = 0, shiftZ = 0;
  const now=performance.now();
  if(now-streamState.lastStreamShiftAt<90)return;
  // Camera rotation never moves the resident window. A one-chunk hysteresis
  // starts relocation early enough that the player cannot catch its boundary.
  const centerX=windowState.minX+LOADED_SIZE_X*0.5,centerZ=windowState.minZ+LOADED_SIZE_Z*0.5;
  const hysteresis=CHUNK_SIZE;
  if(playerVoxelX>centerX+hysteresis)shiftX=CHUNK_SIZE;else if(playerVoxelX<centerX-hysteresis)shiftX=-CHUNK_SIZE;
  if(playerVoxelZ>centerZ+hysteresis)shiftZ=CHUNK_SIZE;else if(playerVoxelZ<centerZ-hysteresis)shiftZ=-CHUNK_SIZE;
  if(shiftX||shiftZ){streamState.lastStreamShiftAt=now;queueStreamShift(shiftX,shiftZ);}
}
