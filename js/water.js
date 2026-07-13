// Budgeted cellular water: only water near edits wakes up, keeping frame times stable.
import { MAT_AIR, MAT_WATER } from './constants.js';
import { hash3 } from './noise.js';
import { getVoxelA, setVoxel, windowState } from './world.js';
import { settings } from './settings.js';
import { uploadRegion } from './renderer.js';

export const waterQueue=[];
const waterQueued=new Set();
function waterKey(x,y,z){return `${x},${y},${z}`;}
export function enqueueWater(x,y,z){
  if(getVoxelA(x,y,z)!==MAT_WATER)return;
  const k=waterKey(x,y,z);
  if(!waterQueued.has(k)){waterQueued.add(k);waterQueue.push([x,y,z]);}
}
export function wakeWaterNear(cx,cy,cz,r){
  for(let x=cx-r;x<=cx+r;x++) for(let y=cy-r;y<=cy+r;y++) for(let z=cz-r;z<=cz+r;z++) enqueueWater(x,y,z);
}
export function updateWater(budget=220){
  if(!settings.waterFlowEnabled || !waterQueue.length)return;
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  const touch=(x,y,z)=>{minX=Math.min(minX,x);minY=Math.min(minY,y);minZ=Math.min(minZ,z);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);maxZ=Math.max(maxZ,z);};
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let n=0;n<budget && waterQueue.length;n++){
    const [x,y,z]=waterQueue.pop(); waterQueued.delete(waterKey(x,y,z));
    if(getVoxelA(x,y,z)!==MAT_WATER)continue;
    let tx=x,ty=y-1,tz=z;
    if(ty<windowState.minY || getVoxelA(tx,ty,tz)!==MAT_AIR){
      let moved=false;
      const start=(hash3(x,y,z,91)*4)|0;
      for(let d=0;d<4;d++){
        const [dx,dz]=dirs[(start+d)&3];
        if(getVoxelA(x+dx,y,z+dz)===MAT_AIR){tx=x+dx;ty=y;tz=z+dz;moved=true;break;}
      }
      if(!moved)continue;
    }
    setVoxel(x,y,z,MAT_AIR); setVoxel(tx,ty,tz,MAT_WATER);
    touch(x,y,z);touch(tx,ty,tz);
    enqueueWater(tx,ty,tz);
    enqueueWater(x,y+1,z);
    for(const [dx,dz] of dirs) enqueueWater(x+dx,y,z+dz);
  }
  if(minX!==Infinity)uploadRegion(minX-1,minY-1,minZ-1,maxX+1,maxY+1,maxZ+1);
}
