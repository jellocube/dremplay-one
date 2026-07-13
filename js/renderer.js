//////////////////////////////////////////////////////////////////////////
// GL SETUP
//////////////////////////////////////////////////////////////////////////
import { VS, VY, CHUNK_SIZE, LOADED_SIZE_X, LOADED_SIZE_Y, LOADED_SIZE_Z } from './constants.js';
import { mod } from './coords.js';
import { getChunk, windowState, loadedGrid } from './world.js';
import { PALETTE, paletteRGB, materialSlotData, materialParamData, materialModeData, syncMaterialSlots } from './palette.js';
import { settings } from './settings.js';
import { playerState, getCamBasis } from './player.js';
import { VERT_SRC, FRAG_SRC } from './shaders.js';

export const canvas = document.getElementById('glcanvas');
export const gl = canvas.getContext('webgl2', {antialias:false, powerPreference:'high-performance'});
if (!gl){
  document.getElementById('loadingText').textContent='WebGL2 unavailable';
  document.getElementById('startscreen').innerHTML =
    '<h1 style="font-size:18px;">WEBGL2 UNAVAILABLE</h1><p>Your browser/GPU does not support WebGL2, which this engine requires.</p>';
}

function compile(type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

let prog, uRes, uCamPos, uCamBasis, uFovScale, uGrid, uRing, uVoxels, uTime, uLightMode, uHour, uPaletteTex, uMaterialSlots, uMaterialParams, uMaterialModes, tex3d, paletteTex, vao;
// Fixed internal resolution: resizing the drawing buffer during play can produce
// black frames on some GPU/browser combinations, so runtime scaling is disabled.
const renderScale = 0.55;
export const perfState = { uploadBytes: 0, uploadMs: 0, streamMs: 0 };

export function initGL(){
  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(prog));

  uRes = gl.getUniformLocation(prog,'uRes');
  uCamPos = gl.getUniformLocation(prog,'uCamPos');
  uCamBasis = gl.getUniformLocation(prog,'uCamBasis');
  uFovScale = gl.getUniformLocation(prog,'uFovScale');
  uGrid = gl.getUniformLocation(prog,'uGrid');
  uRing = gl.getUniformLocation(prog,'uRing');
  uVoxels = gl.getUniformLocation(prog,'uVoxels');
  uTime = gl.getUniformLocation(prog,'uTime');
  uLightMode = gl.getUniformLocation(prog,'uLightMode');
  uHour = gl.getUniformLocation(prog,'uHour');
  uPaletteTex = gl.getUniformLocation(prog,'uPaletteTex');
  uMaterialSlots = gl.getUniformLocation(prog,'uMaterialSlots[0]');
  uMaterialParams = gl.getUniformLocation(prog,'uMaterialParams[0]');
  uMaterialModes = gl.getUniformLocation(prog,'uMaterialModes[0]');
  syncMaterialSlots();

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  tex3d = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_3D, tex3d);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  paletteTex=gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,paletteTex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB8,PALETTE.length,1,0,gl.RGB,gl.UNSIGNED_BYTE,paletteRGB);

  // Initial loaded window centered near origin
  windowState.minX = 0;
  windowState.minY = -64;
  windowState.minZ = 0;
}

export function resize(){
  const dpr = Math.min(window.devicePixelRatio||1, 1.5);
  canvas.width = Math.max(1, Math.floor(window.innerWidth*dpr*renderScale));
  canvas.height = Math.max(1, Math.floor(window.innerHeight*dpr*renderScale));
  canvas.style.width = window.innerWidth+'px';
  canvas.style.height = window.innerHeight+'px';
  if (gl) gl.viewport(0,0,canvas.width,canvas.height);
}

// One-time full-volume upload at the end of boot; incremental updates after
// that go through uploadRegion/uploadLocalBox below.
export function uploadInitialVolume(){
  gl.bindTexture(gl.TEXTURE_3D,tex3d);
  gl.texImage3D(gl.TEXTURE_3D,0,gl.R8UI,LOADED_SIZE_X,LOADED_SIZE_Y,LOADED_SIZE_Z,0,gl.RED_INTEGER,gl.UNSIGNED_BYTE,loadedGrid);
}

//////////////////////////////////////////////////////////////////////////
// VOXEL TEXTURE PARTIAL UPDATE
//////////////////////////////////////////////////////////////////////////
export function uploadRegion(x0,y0,z0,x1,y1,z1){
  // Clip the inclusive world-space dirty box to the resident GPU window.
  x0 = Math.max(Math.floor(x0), windowState.minX); y0 = Math.max(Math.floor(y0), windowState.minY); z0 = Math.max(Math.floor(z0), windowState.minZ);
  x1 = Math.min(Math.floor(x1), windowState.minX + LOADED_SIZE_X - 1);
  y1 = Math.min(Math.floor(y1), windowState.minY + LOADED_SIZE_Y - 1);
  z1 = Math.min(Math.floor(z1), windowState.minZ + LOADED_SIZE_Z - 1);
  if (x1 < x0 || y1 < y0 || z1 < z0) return;

  uploadLocalBox(x0-windowState.minX,y0-windowState.minY,z0-windowState.minZ,x1-windowState.minX,y1-windowState.minY,z1-windowState.minZ);
}

function ringSegments(a0,a1,ring,size){
  const count=a1-a0+1, p0=mod(a0+ring,size);
  if (p0+count<=size) return [{local:a0,physical:p0,count}];
  const first=size-p0;
  return [{local:a0,physical:p0,count:first},{local:a0+first,physical:0,count:count-first}];
}
export function uploadLocalBox(lx0,ly0,lz0,lx1,ly1,lz1){
  const xs=ringSegments(lx0,lx1,windowState.ringX,LOADED_SIZE_X);
  const zs=ringSegments(lz0,lz1,windowState.ringZ,LOADED_SIZE_Z);
  const h=ly1-ly0+1;
  gl.bindTexture(gl.TEXTURE_3D,tex3d);
  for (const zz of zs) for (const xx of xs) {
    const staging=new Uint8Array(xx.count*h*zz.count);
    let o=0;
    // Copy contiguous X rows directly from chunk arrays. The previous path did
    // a Map lookup, floor division and modulo operation for every voxel, making
    // one ring shift slow enough for the player to expose its boundary.
    for(let dz=0;dz<zz.count;dz++){
      const wz=windowState.minZ+zz.local+dz,cz=Math.floor(wz/CHUNK_SIZE),lz=mod(wz,CHUNK_SIZE);
      for(let y=ly0;y<=ly1;y++){
        const wy=windowState.minY+y,cy=Math.floor(wy/CHUNK_SIZE),ly=mod(wy,CHUNK_SIZE),rowStart=o;
        let wx=windowState.minX+xx.local,remaining=xx.count;
        while(remaining>0){
          const cx=Math.floor(wx/CHUNK_SIZE),lx=mod(wx,CHUNK_SIZE),take=Math.min(remaining,CHUNK_SIZE-lx),source=getChunk(cx,cy,cz,false);
          if(source)staging.set(source.subarray(lx+ly*CHUNK_SIZE+lz*CHUNK_SIZE*CHUNK_SIZE,lx+ly*CHUNK_SIZE+lz*CHUNK_SIZE*CHUNK_SIZE+take),o);
          o+=take;wx+=take;remaining-=take;
        }
        loadedGrid.set(staging.subarray(rowStart,rowStart+xx.count),xx.physical+y*LOADED_SIZE_X+(zz.physical+dz)*LOADED_SIZE_X*LOADED_SIZE_Y);
      }
    }
    const t0=performance.now();
    gl.texSubImage3D(gl.TEXTURE_3D,0,xx.physical,ly0,zz.physical,xx.count,h,zz.count,gl.RED_INTEGER,gl.UNSIGNED_BYTE,staging);
    perfState.uploadMs+=performance.now()-t0;
    perfState.uploadBytes+=staging.byteLength;
  }
}

const camMat = new Float32Array(9);
export function render(){
  if (!gl) return;
  // Sky-colored fallback prevents a black flash if a frame is delayed.
  gl.clearColor(80/255,164/255,252/255,1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);
  gl.bindVertexArray(vao);

  const cam = getCamBasis();
  camMat[0]=cam.right.x/VS; camMat[1]=cam.right.y/VY; camMat[2]=cam.right.z/VS;
  camMat[3]=cam.up.x/VS;    camMat[4]=cam.up.y/VY;    camMat[5]=cam.up.z/VS;
  camMat[6]=cam.forward.x/VS; camMat[7]=cam.forward.y/VY; camMat[8]=cam.forward.z/VS;

  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.uniform3f(uCamPos,
    playerState.pos.x/VS - windowState.minX,
    (playerState.pos.y + playerState.currentEyeH)/VY - windowState.minY,
    playerState.pos.z/VS - windowState.minZ);
  gl.uniformMatrix3fv(uCamBasis, false, camMat);
  const fovY = settings.fovDegrees * Math.PI/180;
  gl.uniform1f(uFovScale, Math.tan(fovY/2));
  gl.uniform3i(uGrid, LOADED_SIZE_X, LOADED_SIZE_Y, LOADED_SIZE_Z);
  gl.uniform3i(uRing, windowState.ringX, 0, windowState.ringZ);
  gl.uniform1f(uTime, performance.now()/1000);
  gl.uniform1i(uLightMode,settings.lightMode);
  gl.uniform1f(uHour,settings.timeOfDay);
  gl.uniform3iv(uMaterialSlots,materialSlotData);
  gl.uniform3fv(uMaterialParams,materialParamData);
  gl.uniform1iv(uMaterialModes,materialModeData);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_3D, tex3d);
  gl.uniform1i(uVoxels, 0);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,paletteTex);gl.uniform1i(uPaletteTex,1);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
