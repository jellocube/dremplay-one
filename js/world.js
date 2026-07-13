import {
  CHUNK_SIZE, LOADED_CHUNKS_XZ, LOADED_CHUNKS_Y, PREFETCH_MARGIN, LOADED_SIZE_X, LOADED_SIZE_Y, LOADED_SIZE_Z,
  MAT_AIR, MAT_GRASS, MAT_DIRT, MAT_STONE, MAT_WATER, MAT_SNOW, MAT_MOSS,
  MAT_MUD, MAT_SAND, MAT_CLAY, MAT_PEAT, MAT_DRY_GRASS, MAT_TALL_GRASS,
  MAT_ALPINE_GRASS, MAT_GRANITE, MAT_QUARTZ, MAT_SLATE, MAT_LIMESTONE,
  MAT_FLOWER, MAT_LEAVES, WATER_LEVEL, SNOW_LINE
} from './constants.js';
import { hash3, fbm2, smoothstep, warpedCoords, terrainSample } from './noise.js';
import { chunkKey, worldToChunk } from './coords.js';
import { resourceChunks, stampNaturalResources } from './resources.js';

// Chunk storage (sparse, can grow to millions of chunks for huge worlds)
export const chunks = new Map(); // key "cx,cy,cz" -> Uint8Array (chunk local data)
export const generatedChunks = new Set(); // includes implicit all-air chunks
export const dirtyChunks = new Set(); // edited chunks are retained until persistence is added

export function getChunk(cx, cy, cz, createIfMissing = false) {
  const key = chunkKey(cx, cy, cz);
  let chunk = chunks.get(key);
  if (!chunk && createIfMissing) {
    chunk = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    chunks.set(key, chunk);
    generatedChunks.add(key);
  }
  return chunk;
}

export function setVoxel(wx, wy, wz, material, resourceId=0) {
  const { cx, cy, cz } = worldToChunk(wx, wy, wz);
  const chunk = getChunk(cx, cy, cz, true);
  if (!chunk) return;
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const i = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
  chunk[i] = material;
  const key=chunkKey(cx,cy,cz),existing=resourceChunks.get(key);
  if(resourceId){const provenance=existing||new Map();provenance.set(i,resourceId);resourceChunks.set(key,provenance);}
  else if(existing){existing.delete(i);if(!existing.size)resourceChunks.delete(key);}
  dirtyChunks.add(key);
}

export function getVoxelResourceId(wx,wy,wz){
  const {cx,cy,cz}=worldToChunk(wx,wy,wz),metadata=resourceChunks.get(chunkKey(cx,cy,cz));if(!metadata)return 0;
  const lx=((wx%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE,ly=((wy%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE,lz=((wz%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE;
  return metadata.get(lx+ly*CHUNK_SIZE+lz*CHUNK_SIZE*CHUNK_SIZE)||0;
}

// Position-anchored sliding loaded window: physical GPU texture origin
// (ringX/ringZ) and the world-space minimum corner it currently represents.
export const windowState = { minX: 0, minY: -64, minZ: 0, ringX: 0, ringZ: 0 };

export function evictDistantCleanChunks(){
  const minCX=Math.floor(windowState.minX/CHUNK_SIZE), minCZ=Math.floor(windowState.minZ/CHUNK_SIZE);
  const maxCX=minCX+LOADED_CHUNKS_XZ-1, maxCZ=minCZ+LOADED_CHUNKS_XZ-1;
  const keep=PREFETCH_MARGIN; // retain the prestream safety ring, evict beyond it
  for (const key of chunks.keys()) {
    if (dirtyChunks.has(key)) continue;
    const [cx,,cz]=key.split(',').map(Number);
    // Hard safety invariant: neither the resident window nor its two-chunk
    // guard may ever be evicted. Streaming can recycle only remote CPU cache.
    if(cx>=minCX-2&&cx<=maxCX+2&&cz>=minCZ-2&&cz<=maxCZ+2)continue;
    if (cx<minCX-keep || cx>maxCX+keep || cz<minCZ-keep || cz>maxCZ+keep) {
      chunks.delete(key); resourceChunks.delete(key); generatedChunks.delete(key);
    }
  }
}

export function getVoxelA(wx, wy, wz) {
  const { cx, cy, cz } = worldToChunk(wx, wy, wz);
  const chunk = getChunk(cx, cy, cz, false);
  if (!chunk) return 0;
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const i = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
  return chunk[i];
}

let terrainColumnCacheKey='',terrainColumnCache=null;
export function prepareTerrainColumns(cx,cz){
  const key=`${cx},${cz}`;if(key===terrainColumnCacheKey)return terrainColumnCache;
  const data=new Array(CHUNK_SIZE*CHUNK_SIZE),baseX=cx*CHUNK_SIZE,baseZ=cz*CHUNK_SIZE;let minSurface=Infinity,maxSurface=-Infinity,minSoilBottom=Infinity;
  // One padded height tile supplies the center and all four slope taps. The
  // former implementation recomputed the full terrain stack five times for
  // every column.
  const pad=4,sampleStep=4,tileSize=(CHUNK_SIZE+pad*2)/sampleStep+1,heightTile=new Array(tileSize*tileSize);
  for(let tx=-pad,gx=0;tx<=CHUNK_SIZE+pad;tx+=sampleStep,gx++)for(let tz=-pad,gz=0;tz<=CHUNK_SIZE+pad;tz+=sampleStep,gz++)heightTile[gx+gz*tileSize]=terrainSample(baseX+tx,baseZ+tz);
  const terrainAt=(x,z)=>{
    const px=(x+pad)/sampleStep,pz=(z+pad)/sampleStep,ix=Math.floor(px),iz=Math.floor(pz),fx=px-ix,fz=pz-iz;
    const a=heightTile[ix+iz*tileSize],b=heightTile[Math.min(tileSize-1,ix+1)+iz*tileSize],c=heightTile[ix+Math.min(tileSize-1,iz+1)*tileSize],d=heightTile[Math.min(tileSize-1,ix+1)+Math.min(tileSize-1,iz+1)*tileSize];
    const mix=key=>((a[key]+(b[key]-a[key])*fx)*(1-fz)+(c[key]+(d[key]-c[key])*fx)*fz);
    return {height:Math.round(mix('height')),rawHeight:Math.round(mix('rawHeight')),valleyMask:mix('valleyMask'),poolMask:mix('poolMask'),poolDepth:Math.round(mix('poolDepth')),continental:mix('continental'),ridges:mix('ridges')};
  };
  for(let lx=0;lx<CHUNK_SIZE;lx++)for(let lz=0;lz<CHUNK_SIZE;lz++){
    const wx=baseX+lx,wz=baseZ+lz,terrain=terrainAt(lx,lz),h=terrain.height;minSurface=Math.min(minSurface,h);maxSurface=Math.max(maxSurface,h);
    const hx1=terrainAt(lx+2,lz).height,hx0=terrainAt(lx-2,lz).height,hz1=terrainAt(lx,lz+2).height,hz0=terrainAt(lx,lz-2).height;
    const slope=Math.hypot(hx1-hx0,hz1-hz0)*.25,curvature=(hx1+hx0+hz1+hz0-4*h)*.25;
    const [qx,qz]=warpedCoords(wx,wz);
    const patch=fbm2(qx*.011,qz*.011,4,2,.5,1801);       // broad irregular patches, never voxel dither
    const detail=fbm2(qx*.037,qz*.037,3,2.1,.45,1907);
    const moisture=Math.max(0,Math.min(1,.24+terrain.valleyMask*.52+terrain.poolMask*.38-patch*.12-slope*.045));
    // A separate long-wave heave field moves the whole soil/rock boundary up
    // and down. Mountain mantles thin gradually, rather than vanishing on any
    // ordinary slope.
    const soilHeave=fbm2(qx*.0073-23,qz*.0073+41,5,2,.52,1951)*6+detail*2.2;
    const mantle=Math.max(3,Math.min(30,Math.round(6+moisture*14+Math.max(0,-curvature)*2.4-slope*.28+patch*3.5+soilHeave*.34)));
    minSoilBottom=Math.min(minSoilBottom,h-mantle-Math.abs(soilHeave)-12);
    const rockPatch=fbm2(qx*.018+31,qz*.018-7,4,2,.5,2003);
    const stoneField=fbm2(qx*.006-17,qz*.006+43,4,2,.52,2111);
    const exposedRock=slope>12.5||(slope>8.0&&rockPatch>.44)||(h>140&&slope>5.5&&rockPatch>.18);
    // Snow favors high, sheltered and leeward/concave sites; steep faces shed it.
    const lee=(hx0-hx1)*.08;
    const snowCoverage=(h-SNOW_LINE)/18+Math.max(-.35,Math.min(.35,lee))-slope*.045-curvature*.06+patch*.14;
    const snowDepth=Math.max(0,Math.min(8,Math.floor(smoothstep(-.15,.65,snowCoverage)*7))),snowy=snowDepth>0&&!exposedRock;
    const saturatedMud=terrain.poolMask>.10&&moisture>.70&&h<=WATER_LEVEL+2&&patch<.26;
    const sandy=terrain.poolMask>.045&&terrain.poolMask<.52&&h<=WATER_LEVEL+2&&patch>.16;
    const grassCoverage=moisture+.28-patch*.10-slope*.018-(h-SNOW_LINE)*.005;
    const grassy=!saturatedMud&&!sandy&&!snowy&&!exposedRock&&grassCoverage>.27;
    let rockMaterial=MAT_STONE;
    if(stoneField>.42)rockMaterial=MAT_GRANITE;else if(stoneField<-.48)rockMaterial=MAT_SLATE;else if(rockPatch>.55)rockMaterial=MAT_LIMESTONE;
    if(h>118&&rockPatch>.68)rockMaterial=MAT_QUARTZ;
    const surfaceMaterial=snowy?MAT_SNOW:exposedRock?rockMaterial:saturatedMud?MAT_MUD:sandy?MAT_SAND:grassy?(h>90?MAT_ALPINE_GRASS:moisture>.72?MAT_MOSS:moisture<.38?MAT_DRY_GRASS:MAT_GRASS):(patch>.28?MAT_CLAY:MAT_DIRT);
    data[lx+lz*CHUNK_SIZE]={terrain,h,mantle,soilHeave,patch,detail,slope,curvature,moisture,rockMaterial,stoneField,exposedRock,snowDepth,snowy,saturatedMud,sandy,grassy,surfaceMaterial};
  }
  data.minSurface=minSurface;data.maxSurface=maxSurface;data.minSoilBottom=minSoilBottom;terrainColumnCacheKey=key;terrainColumnCache=data;return data;
}

// Generate a single chunk with seamless terrain (using world coordinates for continuity)
export function generateChunk(cx, cy, cz) {
  const key = chunkKey(cx, cy, cz);
  if (generatedChunks.has(key)) return;
  generatedChunks.add(key);

  const chunk = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
  chunks.set(key, chunk);

  const baseX = cx * CHUNK_SIZE;
  const baseY = cy * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;
  const columns=prepareTerrainColumns(cx,cz);

  // Most vertical chunks contain either no world data or only deep bedrock.
  // Resolve them without 32,768 voxel tests and hundreds of thousands of noise
  // samples. Surface-bearing chunks retain the full material model below.
  if(baseY>columns.maxSurface+24){chunks.delete(key);return;}
  if(baseY+CHUNK_SIZE-1<columns.minSoilBottom){chunk.fill(MAT_STONE);return;}

  // Multi-octave Voxlap-style organic terrain
  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      const {terrain,h,mantle,soilHeave,patch,detail,slope,curvature,moisture,rockMaterial,stoneField,exposedRock,snowDepth,snowy,saturatedMud,sandy,grassy,surfaceMaterial}=columns[lx+lz*CHUNK_SIZE];

      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        const wy = baseY + ly;
        const i = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;
        if (wy<=h) {
          const depth=h-wy;
          if(snowy&&depth<snowDepth)chunk[i]=MAT_SNOW;
          else if(exposedRock&&depth<2)chunk[i]=rockMaterial;
          else if(depth===0)chunk[i]=surfaceMaterial;
          else {
            if(depth>mantle+Math.abs(soilHeave)+18){chunk[i]=rockMaterial;continue;}
            // Three-dimensional domain-warped lenses replace horizontal layer
            // tests. Both the mantle boundary and the material mixtures wander
            // vertically, merge, split and reappear across a mountain face.
            const cellA=hash3(Math.floor((wx+wy*.83)/7),Math.floor(wy/5),Math.floor((wz-wy*.61)/7),2237)*2-1;
            const cellB=hash3(Math.floor((wx-wy*.47)/11),Math.floor(wy/8),Math.floor((wz+wy*.72)/11),2269)*2-1;
            const volumeWarp=cellA*3.4+detail*1.3;
            const warpedDepth=depth-soilHeave-volumeWarp;
            const lensA=cellB*.78+cellA*.22;
            const lensB=patch*.48+cellA*.34+cellB*.18;
            const soilLimit=mantle+lensB*4.0;
            if(warpedDepth<soilLimit||(!exposedRock&&depth<4)){
              const rockyLens=warpedDepth>soilLimit*.48&&lensA>.42+moisture*.08;
              if(rockyLens)chunk[i]=rockMaterial;
              else if(saturatedMud&&depth<4+lensB*2)chunk[i]=MAT_MUD;
              else if(sandy&&depth<5+lensA*2)chunk[i]=MAT_SAND;
              else if(moisture>.70&&lensA<-.38&&warpedDepth<soilLimit*.58)chunk[i]=MAT_PEAT;
              else if(lensB>.34&&warpedDepth>2)chunk[i]=MAT_CLAY;
              else chunk[i]=MAT_DIRT;
            }else if(warpedDepth<soilLimit+7&&lensA<-.48){
              // Eroded pockets carry the same soil mixture down into fractured
              // bedrock instead of producing one clean, level cutoff.
              chunk[i]=lensB>.28?MAT_CLAY:MAT_DIRT;
            }else chunk[i]=rockMaterial;
          }
        } else if (terrain.poolMask>.30 && h<WATER_LEVEL && wy<=Math.min(WATER_LEVEL,h+20)) {
          chunk[i]=MAT_WATER;
        }
      }
    }
  }

  stampNaturalResources(chunk,baseX,baseY,baseZ,columns,cx,cy,cz);

  // Empty high-altitude chunks are represented implicitly and cost no voxel array.
  if (!chunk.some(Boolean)){chunks.delete(key);resourceChunks.delete(key);}
}

// simple deterministic pseudo-random
let seed = 1337;
export function rnd(){ seed = (seed*1664525+1013904223)>>>0; return seed/4294967296; }

// Old dense buildWorld removed — world is now fully chunk-based with on-demand generateChunk()
// Initial chunks around spawn are generated in initGL / first frame.

export function groundHeightAt(wx, wz) {
  // Find highest solid voxel in column (for spawn)
  for (let wy = 200; wy >= 0; wy--) {
    const material=getVoxelA(wx,wy,wz);
    if (material!==MAT_AIR && material!==MAT_WATER && material!==MAT_MOSS && material!==MAT_TALL_GRASS && material!==MAT_FLOWER && material!==MAT_LEAVES && !(material===MAT_GRASS&&getVoxelResourceId(wx,wy,wz))) return wy;
  }
  return 0;
}

// Loaded window assembly (for single-texture rendering while we have chunk storage)
export const loadedGrid = new Uint8Array(LOADED_SIZE_X * LOADED_SIZE_Y * LOADED_SIZE_Z);

export function assembleLoadedGrid() {
  loadedGrid.fill(0);
  for (let cx = 0; cx < LOADED_CHUNKS_XZ; cx++) {
    for (let cy = 0; cy < LOADED_CHUNKS_Y; cy++) {
      for (let cz = 0; cz < LOADED_CHUNKS_XZ; cz++) {
        const cwx = windowState.minX + cx * CHUNK_SIZE;
        const cwy = windowState.minY + cy * CHUNK_SIZE;
        const cwz = windowState.minZ + cz * CHUNK_SIZE;
        const key = chunkKey(Math.floor(cwx / CHUNK_SIZE), Math.floor(cwy / CHUNK_SIZE), Math.floor(cwz / CHUNK_SIZE));
        const chunk = chunks.get(key);
        if (!chunk) continue;
        // Copy contiguous X rows natively instead of visiting 32K voxels in JS.
        for(let lz=0;lz<CHUNK_SIZE;lz++)for(let ly=0;ly<CHUNK_SIZE;ly++){
          const source=ly*CHUNK_SIZE+lz*CHUNK_SIZE*CHUNK_SIZE;
          const target=cx*CHUNK_SIZE+(cy*CHUNK_SIZE+ly)*LOADED_SIZE_X+(cz*CHUNK_SIZE+lz)*LOADED_SIZE_X*LOADED_SIZE_Y;
          loadedGrid.set(chunk.subarray(source,source+CHUNK_SIZE),target);
        }
      }
    }
  }
}
