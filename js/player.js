//////////////////////////////////////////////////////////////////////////
// CAMERA / MOVEMENT / EDITING
//////////////////////////////////////////////////////////////////////////
import { VS, VY, PLAYER_R, PLAYER_H, EYE_H, CRAWL_EYE_H, MAT_AIR, MAT_WATER, MAT_MOSS, MAT_TALL_GRASS, MAT_FLOWER, MAT_LEAVES, MAT_GRASS } from './constants.js';
import { getVoxelA, getVoxelResourceId, setVoxel, windowState } from './world.js';
import { settings } from './settings.js';
import { materialState } from './palette.js';
import { wakeWaterNear } from './water.js';
import { uploadRegion } from './renderer.js';

export const playerState = {
  pos: null,
  spawnPos: null,
  yaw: Math.PI*0.25,
  pitch: -0.15,
  currentEyeH: EYE_H,
  velY: 0,
  grounded: false,
  jumpWasDown: false
};

export function getCamBasis(){
  const cy = Math.cos(playerState.yaw), sy = Math.sin(playerState.yaw);
  const cp = Math.cos(playerState.pitch), sp = Math.sin(playerState.pitch);
  const forward = { x: sy*cp, y: sp, z: cy*cp };
  const worldUp = {x:0,y:1,z:0};
  // right = normalize(cross(forward, worldUp))
  let rx = forward.y*worldUp.z - forward.z*worldUp.y;
  let ry = forward.z*worldUp.x - forward.x*worldUp.z;
  let rz = forward.x*worldUp.y - forward.y*worldUp.x;
  const rl = Math.hypot(rx,ry,rz)||1;
  const right = {x:rx/rl, y:ry/rl, z:rz/rl};
  const up = {
    x: right.y*forward.z - right.z*forward.y,
    y: right.z*forward.x - right.x*forward.z,
    z: right.x*forward.y - right.y*forward.x
  };
  return { forward, right, up };
}

export function gridDirection(d){
  const x=d.x/VS,y=d.y/VY,z=d.z/VS,n=Math.hypot(x,y,z)||1;
  return {x:x/n,y:y/n,z:z/n};
}

function solidAt(wx,wy,wz){
  const vx = Math.floor(wx/VS), vy = Math.floor(wy/VY), vz = Math.floor(wz/VS);
  const material=getVoxelA(vx,vy,vz);
  if(material===MAT_GRASS&&getVoxelResourceId(vx,vy,vz))return false;
  return material!==MAT_AIR && material!==MAT_WATER && material!==MAT_MOSS && material!==MAT_TALL_GRASS && material!==MAT_FLOWER && material!==MAT_LEAVES;
}
function collidesAt(px,py,pz){
  // sample cylinder corners at feet/mid/head
  const offs = [[PLAYER_R,PLAYER_R],[PLAYER_R,-PLAYER_R],[-PLAYER_R,PLAYER_R],[-PLAYER_R,-PLAYER_R],[0,0]];
  for (const [ox,oz] of offs){
    for (let h=0.1; h<PLAYER_H; h+=0.55){
      if (solidAt(px+ox, py+h, pz+oz)) return true;
    }
  }
  return false;
}

export function updatePlayer(dt, keys){
  const cam = getCamBasis();
  const crawling=!!(keys['ControlLeft']||keys['ControlRight']);
  const speed = settings.walkSpeed*(crawling?.34:1);
  playerState.currentEyeH+=( (crawling?CRAWL_EYE_H:EYE_H)-playerState.currentEyeH)*Math.min(1,dt*12);

  let mx=0, mz=0;
  const fx = cam.forward.x, fz = cam.forward.z;
  const flen = Math.hypot(fx,fz)||1;
  const fdx = fx/flen, fdz = fz/flen;
  const rdx = cam.right.x, rdz = cam.right.z;

  if (keys['KeyW']) { mx+=fdx; mz+=fdz; }
  if (keys['KeyS']) { mx-=fdx; mz-=fdz; }
  if (keys['KeyD']) { mx+=rdx; mz+=rdz; }
  if (keys['KeyA']) { mx-=rdx; mz-=rdz; }
  const mlen = Math.hypot(mx,mz);
  if (mlen>0){ mx/=mlen; mz/=mlen; }

  const dx = mx*speed*dt, dz = mz*speed*dt;

  // Resolve axes independently so the player naturally slides along walls.
  const STEP_H = 0.4;
  function moveAxis(axis, amount) {
    if (!amount) return;
    const nx=playerState.pos.x+(axis==='x'?amount:0), nz=playerState.pos.z+(axis==='z'?amount:0);
    if (!collidesAt(nx,playerState.pos.y,nz)) { playerState.pos[axis]+=amount; return; }
    if (playerState.grounded) {
      for (let lift=VS; lift<=STEP_H+1e-6; lift+=VS) {
        if (!collidesAt(nx,playerState.pos.y+lift,nz)) {
          playerState.pos[axis]+=amount; playerState.pos.y+=lift; playerState.velY=Math.max(0,playerState.velY); playerState.grounded=false; return;
        }
      }
    }
  }
  moveAxis('x',dx);
  moveAxis('z',dz);

  // gravity + vertical
  playerState.velY += settings.gravityAcceleration*dt;
  const jumpDown=!!(keys['ShiftLeft']||keys['ShiftRight']);
  if (playerState.grounded && jumpDown && !playerState.jumpWasDown) { playerState.velY=settings.jumpSpeed; playerState.grounded=false; }
  playerState.jumpWasDown=jumpDown;
  const dy=playerState.velY*dt;
  const verticalSteps=Math.max(1,Math.ceil(Math.abs(dy)/(VS*0.5)));
  const stepY=dy/verticalSteps;
  for (let i=0;i<verticalSteps;i++) {
    if (!collidesAt(playerState.pos.x,playerState.pos.y+stepY,playerState.pos.z)) { playerState.pos.y+=stepY; playerState.grounded=false; }
    else { if (playerState.velY<0) playerState.grounded=true; playerState.velY=0; break; }
  }

  // hard floor safety (in case falls out of world)
  const safetyFloor=(windowState.minY+2)*VY;
  if (playerState.pos.y < safetyFloor){ playerState.pos.y=safetyFloor; playerState.velY=0; playerState.grounded=true; }
}

// CPU-side voxel raycast for shooting/placing (Amanatides-Woo, mirrors shader)
export function raycastVoxels(ro, rd, maxDist){
  let mapX=Math.floor(ro.x), mapY=Math.floor(ro.y), mapZ=Math.floor(ro.z);
  const sx = rd.x<0?-1:1, sy = rd.y<0?-1:1, sz = rd.z<0?-1:1;
  const ddx = Math.abs(1/(rd.x||1e-9)), ddy = Math.abs(1/(rd.y||1e-9)), ddz = Math.abs(1/(rd.z||1e-9));
  let sdx = (sx>0 ? (mapX+1-ro.x) : (ro.x-mapX)) * ddx;
  let sdy = (sy>0 ? (mapY+1-ro.y) : (ro.y-mapY)) * ddy;
  let sdz = (sz>0 ? (mapZ+1-ro.z) : (ro.z-mapZ)) * ddz;
  let dist=0, lastX=mapX,lastY=mapY,lastZ=mapZ;
  for (let i=0;i<512;i++){
    // No hard bounds — world is chunked and effectively infinite for editing
    if (getVoxelA(mapX,mapY,mapZ)>0){
      return { x:mapX,y:mapY,z:mapZ, px:lastX,py:lastY,pz:lastZ, dist };
    }
    lastX=mapX; lastY=mapY; lastZ=mapZ;
    if (sdx<sdy){
      if (sdx<sdz){ dist=sdx; sdx+=ddx; mapX+=sx; } else { dist=sdz; sdz+=ddz; mapZ+=sz; }
    } else {
      if (sdy<sdz){ dist=sdy; sdy+=ddy; mapY+=sy; } else { dist=sdz; sdz+=ddz; mapZ+=sz; }
    }
    if (dist>maxDist) return null;
  }
  return null;
}

export function doAction(button){
  const cam = getCamBasis();
  // Match the renderer's camera origin exactly; editing now travels through the
  // visible center crosshair instead of starting down at the player's feet.
  const ro = { x:playerState.pos.x/VS, y:(playerState.pos.y+playerState.currentEyeH)/VY, z:playerState.pos.z/VS };
  const rd = gridDirection(cam.forward);
  const res = raycastVoxels(ro, rd, settings.editReachMeters/VS);
  if (!res) return;
  if (button === 0){
    // carve a small radius (now finer with microvoxels)
    const R = settings.carveRadius;
    for (let x=res.x-R;x<=res.x+R;x++) for (let y=res.y-R;y<=res.y+R;y++) for (let z=res.z-R;z<=res.z+R;z++){
      if (Math.hypot(x-res.x,y-res.y,z-res.z) <= R+0.4) setVoxel(x,y,z,MAT_AIR);
    }
    wakeWaterNear(res.x,res.y,res.z,R+3);
    uploadRegion(res.x-R-1,res.y-R-1,res.z-R-1,res.x+R+1,res.y+R+1,res.z+R+1);
  } else if (button === 2){
    const p = res; const t = {x:p.px,y:p.py,z:p.pz};
    const R=settings.placeRadius;
    let placedWater=false;
    for(let x=t.x-R;x<=t.x+R;x++) for(let y=t.y-R;y<=t.y+R;y++) for(let z=t.z-R;z<=t.z+R;z++){
      if(Math.hypot(x-t.x,y-t.y,z-t.z)>R+0.25 || getVoxelA(x,y,z)!==MAT_AIR) continue;
      const wx=(x+0.5)*VS,wy=(y+0.5)*VY,wz=(z+0.5)*VS;
      const insidePlayer=Math.abs(wx-playerState.pos.x)<PLAYER_R+VS*.5 && Math.abs(wz-playerState.pos.z)<PLAYER_R+VS*.5 && wy>playerState.pos.y && wy<playerState.pos.y+PLAYER_H;
      if(!insidePlayer){setVoxel(x,y,z,materialState.selected);placedWater=placedWater||materialState.selected===MAT_WATER;}
    }
    if(placedWater)wakeWaterNear(t.x,t.y,t.z,R+1);
    uploadRegion(t.x-R-1,t.y-R-1,t.z-R-1,t.x+R+1,t.y+R+1,t.z+R+1);
  }
}
