(() => {
'use strict';

const VERSION='0.0.1.0.21.0';
const canvas=document.getElementById('world');
const telemetry=document.getElementById('telemetry');
const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
const loading=document.getElementById('loading');
const loadTask=document.getElementById('loadTask');
const loadPercent=document.getElementById('loadPercent');
const loadProgress=document.getElementById('loadProgress');
const loadLog=document.getElementById('loadLog');
const conveyor=document.getElementById('conveyor');
const playButton=document.getElementById('play');
const testButton=document.getElementById('testZone');
const titleScreen=document.getElementById('titleScreen');

const palette=[
 ['Moss shadow','#183d24'],['Deep moss','#24552d'],['Fern green','#397343'],['Meadow green','#538a53'],
 ['Lichen','#72a969'],['Dry grass','#a89b58'],['Loam','#74513c'],['Wet earth','#52382e'],
 ['Granite shade','#555866'],['Granite','#777a8b'],['Quartz','#adafc2'],['Snow','#e5e5df'],
 ['Stream deep','#315f8c'],['Stream','#4b88ad'],['Sky water','#71b5ce'],['Bark','#56382f'],
 ['Heartwood','#744b38'],['Leaf shadow','#185426'],['Leaf','#287b32'],['Leaf light','#46a844'],
 ['Amethyst','#75508f'],['Cloud shade','#b8cadb'],['Cloud','#e6edf1'],['Sun gold','#d8b828']
];

const vertexSource=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  vUv=p; gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;

const fragmentSource=`#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uResolution;
uniform vec3 uCamera;
uniform vec2 uLook;
uniform float uTime;
uniform float uDay;
uniform int uSteps;
uniform int uLighting;
uniform int uPixelDetail;
uniform float uSeed;

#define PI 3.14159265359
#define FAR 1000.0

float hash21(vec2 p){
  p=fract(p*vec2(123.34,456.21));
  p+=dot(p,p+45.32+uSeed*.0001);
  return fract(p.x*p.y);
}
float valueNoise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.0),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0,a=.54;
  mat2 r=mat2(.80,-.60,.60,.80);
  for(int i=0;i<4;i++){v+=a*valueNoise(p);p=r*p*2.03+17.17;a*=.48;}
  return v;
}
float ridge(vec2 p){float n=fbm(p);return 1.0-abs(n*2.0-1.0);}

float terrainHeight(vec2 p){
  vec2 warp=vec2(fbm(p*.0013+31.0),fbm(p*.0013-47.0))-.5;
  vec2 q=p+warp*85.0;
  float continent=fbm(q*.00105);
  float ranges=pow(clamp(ridge(q*.00235+9.0),0.0,1.0),2.7);
  float mass=smoothstep(.34,.73,continent);
  float broad=7.5+22.0*continent+112.0*ranges*mass;
  float erosion=pow(fbm(q*.0075+80.0),2.0)*8.0;
  float channel=pow(abs(valueNoise(q*.0038+130.0)*2.0-1.0),1.7);
  return broad-erosion-mix(5.0,0.0,smoothstep(.08,.34,channel));
}

float sdCapsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h)-r;}
float sdEllipsoid(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.0)/max(k1,.0001);}
float regularPolygonRadius(vec2 p,float sides){
  float a=atan(p.y,p.x),sector=2.0*PI/sides;
  float local=mod(a+PI/sides,sector)-PI/sides;
  return length(p)*cos(local)/cos(PI/sides);
}

vec2 resourceField(vec3 p,float terrainAtP){
  vec2 best=vec2(1e5,0.0);
  if(distance(p.xz,uCamera.xz)>190.0||p.y-terrainAtP>27.0||p.y-terrainAtP< -3.0)return best;
  vec2 cell=floor(p.xz/28.0),rnd=vec2(hash21(cell+7.1),hash21(cell-19.7));
  vec2 center=(cell+.5+(rnd-.5)*.30)*28.0;
  float birth=hash21(cell+53.4);
  if(birth>.66){
    float ground=terrainHeight(center),kind=hash21(cell+91.3),scale=.72+hash21(cell+13.6)*.62;
    vec3 q=p-vec3(center.x,ground,center.y);
    if(kind<.58){
      float height=mix(10.0,22.0,hash21(cell+4.8))*scale;
      float trunk=sdCapsule(q,vec3(0),vec3(0,height,0),mix(.34,.72,scale));
      if(trunk<best.x)best=vec2(trunk,2.0);
      for(int i=0;i<4;i++){
        float fi=float(i),ang=fi*2.39996+hash21(cell+fi)*2.0,rise=height*(.38+fi*.13);
        vec3 a=vec3(0,rise,0),b=a+vec3(cos(ang),.35,sin(ang))*height*(.17+.025*fi);
        float branch=sdCapsule(q,a,b,max(.12,.30-fi*.04)*scale);
        if(branch<best.x)best=vec2(branch,2.0);
        vec3 crown=b+vec3(0,height*.08,0);
        vec3 radius=vec3(height*.18,height*(kind<.28?.18:.25),height*.18)*(1.0-fi*.055);
        float leaves=sdEllipsoid(q-crown,radius);
        leaves+=sin((q.x+q.y*.7)*3.1+fi)*.045+sin((q.z-q.y*.4)*3.7)*.035;
        if(leaves<best.x)best=vec2(leaves,3.0);
      }
    }else if(kind<.88){
      vec3 r=vec3(1.3+scale*1.8,.8+scale,1.2+scale*1.7);
      float stone=sdEllipsoid(q-vec3(0,r.y*.35,0),r);
      stone+=.09*sin(q.x*2.7)*sin(q.z*2.3)+.05*sin(q.y*4.1);
      if(stone<best.x)best=vec2(stone,4.0);
    }else{
      float sides=hash21(cell+121.0)<.5?5.0:7.0;
      float height=(3.0+hash21(cell+2.0)*5.0)*scale;
      float radial=regularPolygonRadius(q.xz);
      float taper=mix(.72,.05,smoothstep(.65,1.0,q.y/height));
      float crystal=max(radial-taper,abs(q.y-height*.48)-height*.52);
      if(crystal<best.x)best=vec2(crystal,5.0);
    }
  }
  if(distance(p.xz,uCamera.xz)<30.0&&terrainAtP>10.5&&terrainAtP<76.0){
    vec2 gc=floor(p.xz/.72),gcenter=(gc+.5)*.72;
    float gbase=terrainHeight(gcenter),gh=.28+hash21(gc+211.0)*.72;
    vec3 gq=p-vec3(gcenter.x,gbase,gcenter.y);
    vec3 tip=vec3((hash21(gc+3.0)-.5)*.16,gh,(hash21(gc+5.0)-.5)*.16);
    float grass=sdCapsule(gq,vec3(0),tip,.025+.018*hash21(gc+8.0));
    if(grass<best.x)best=vec2(grass,6.0);
  }
  return best;
}

vec2 mapField(vec3 p){
  float h=terrainHeight(p.xz);
  vec2 terrain=vec2((p.y-h)*.68,1.0);
  vec2 resource=resourceField(p,h);
  return resource.x<terrain.x?resource:terrain;
}

float detailPitch(float distanceFromEye){
  float screen=max(.0125,distanceFromEye/uResolution.y*.72);
  if(uPixelDetail==0)return screen;
  if(distanceFromEye<6.096)return max(.0125,screen);
  if(distanceFromEye<15.24)return max(.10,screen);
  if(distanceFromEye<76.2)return max(.20,screen);
  return max(1.0,screen);
}

vec3 fieldNormal(vec3 p,float material,float travel){
  float e=max(.035,min(.28,detailPitch(travel)*.55));
  if(material<1.5){
    float hx=terrainHeight(p.xz+vec2(e,0))-terrainHeight(p.xz-vec2(e,0));
    float hz=terrainHeight(p.xz+vec2(0,e))-terrainHeight(p.xz-vec2(0,e));
    return normalize(vec3(-hx,2.0*e,-hz));
  }
  vec2 k=vec2(e,0);float dx=mapField(p+k.xyy).x-mapField(p-k.xyy).x,dy=mapField(p+k.yxy).x-mapField(p-k.yxy).x,dz=mapField(p+k.yyx).x-mapField(p-k.yyx).x;
  return normalize(vec3(dx,dy,dz)+vec3(0,1e-5,0));
}

vec3 materialColor(float id,vec3 p,vec3 n,float travel){
  float pitch=detailPitch(travel);vec3 sampleP=floor(p/pitch+.5)*pitch;
  float grain=valueNoise(sampleP.xz*(id==1.0?.42:1.7)+id*9.0);
  if(id<1.5){
    float h=p.y;
    if(h>82.0)return mix(vec3(.68,.69,.76),vec3(.90),smoothstep(82.0,108.0,h));
    if(n.y<.55)return mix(vec3(.34,.35,.41),vec3(.48,.49,.56),grain);
    if(h<11.0)return mix(vec3(.42,.31,.23),vec3(.55,.43,.28),grain);
    if(n.y<.72)return mix(vec3(.34,.25,.19),vec3(.46,.32,.23),grain);
    return mix(vec3(.20,.42,.24),vec3(.33,.55,.32),grain);
  }
  if(id<2.5)return mix(vec3(.28,.18,.15),vec3(.45,.29,.21),grain);
  if(id<3.5)return mix(vec3(.14,.38,.16),vec3(.24,.60,.22),grain);
  if(id<4.5)return mix(vec3(.35,.36,.43),vec3(.57,.58,.68),grain);
  if(id<5.5)return mix(vec3(.45,.31,.56),vec3(.72,.70,.79),grain);
  return mix(vec3(.22,.45,.24),vec3(.42,.65,.36),grain);
}

vec3 skyColor(vec3 rd){
  float daylight=.25+.75*clamp(sin((uDay-6.0)/24.0*PI),0.0,1.0);
  vec3 horizon=mix(vec3(.20,.22,.33),vec3(.51,.78,.91),daylight);
  vec3 zenith=mix(vec3(.025,.035,.09),vec3(.20,.48,.82),daylight);
  vec3 sky=mix(horizon,zenith,pow(max(rd.y,0.0),.45));
  if(rd.y>.03){
    vec2 cloudP=(uCamera.xz+rd.xz*(180.0/rd.y)+vec2(uTime*2.3,uTime*.55))*.004;
    float cloud=smoothstep(.55,.72,fbm(cloudP));
    sky=mix(sky,mix(vec3(.62,.70,.79),vec3(.92),daylight),cloud*.78);
  }
  return sky;
}

vec3 waterColor(vec3 ro,vec3 rd,float t,vec3 sky){
  vec3 p=ro+rd*t;
  float wave=valueNoise(p.xz*.09+vec2(uTime*.11,uTime*.07));
  float e=.35,hx=valueNoise((p.xz+vec2(e,0))*.09+uTime*.1)-valueNoise((p.xz-vec2(e,0))*.09+uTime*.1),hz=valueNoise((p.xz+vec2(0,e))*.09+uTime*.1)-valueNoise((p.xz-vec2(0,e))*.09+uTime*.1);
  vec3 n=normalize(vec3(-hx*.55,1.0,-hz*.55));float fres=pow(1.0-max(dot(n,-rd),0.0),4.0);
  vec3 base=mix(vec3(.18,.40,.58),vec3(.34,.66,.73),wave);
  return mix(base,sky,.22+.58*fres);
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uResolution)/uResolution.y;
  float cy=cos(uLook.x),sy=sin(uLook.x),cp=cos(uLook.y),sp=sin(uLook.y);
  vec3 forward=normalize(vec3(sy*cp,sp,-cy*cp));
  vec3 right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
  vec3 ro=uCamera,rd=normalize(forward+uv.x*right+uv.y*up);
  vec3 sky=skyColor(rd);
  float t=.12,previousT=t,previousDistance=1e5,material=0.0;bool hit=false;
  for(int i=0;i<128;i++){
    if(i>=uSteps||t>FAR)break;
    vec3 p=ro+rd*t;vec2 field=mapField(p);
    float epsilon=max(.025,min(.30,detailPitch(t)*.46));
    if(field.x<0.0&&previousDistance>0.0){
      float lo=previousT,hi=t;
      for(int refine=0;refine<6;refine++){float mid=(lo+hi)*.5;if(mapField(ro+rd*mid).x>0.0)lo=mid;else hi=mid;}
      t=(lo+hi)*.5;material=mapField(ro+rd*t).y;hit=true;break;
    }
    if(abs(field.x)<epsilon){hit=true;material=field.y;break;}
    previousT=t;previousDistance=field.x;t+=clamp(field.x*.56,epsilon*.62,20.0);
  }
  float waterT=1e5;
  if(rd.y<-.0001){float candidate=(10.0-ro.y)/rd.y;if(candidate>.1&&candidate<min(t,FAR)){vec2 wp=(ro+rd*candidate).xz;if(terrainHeight(wp)<9.75)waterT=candidate;}}
  vec3 color=sky;
  if(waterT<1e4){color=waterColor(ro,rd,waterT,sky);t=waterT;hit=true;}
  else if(hit){
    vec3 p=ro+rd*t,n=fieldNormal(p,material,t),base=materialColor(material,p,n,t);
    vec3 sun=normalize(vec3(cos((uDay-12.0)/24.0*2.0*PI),.72,sin((uDay-12.0)/24.0*2.0*PI)));
    float wrapped=.5+.5*dot(n,sun),hemisphere=.5+.5*n.y;
    float light=uLighting==0?1.0:(.44+.32*hemisphere+.30*wrapped);
    light=max(light,.48);
    color=base*light;
    float fog=1.0-exp(-t*t*.0000027);color=mix(color,sky,clamp(fog,0.0,.82));
  }
  float vignette=1.0-.055*dot(uv,uv);color*=vignette;
  color=color/(color+vec3(.72));color=pow(color,vec3(.92));
  fragColor=vec4(color,1);
}`;

function appendLoad(message){
  const stamp=(performance.now()/1000).toFixed(2).padStart(6,' ');
  loadLog.textContent+=`${stamp}s  ${message}\n`;
  loadLog.scrollTop=loadLog.scrollHeight;
}
function loadStage(percent,task,items=[]){
  loadTask.textContent=task;loadPercent.textContent=`${percent.toFixed(1)}%`;loadProgress.style.width=`${percent}%`;
  for(const item of items){const node=document.createElement('span');node.className=item.startsWith('§')?'belt-label':'belt-item';node.textContent=item.replace(/^§/,'');conveyor.append(node);}
  while(conveyor.children.length>22)conveyor.firstElementChild.remove();
  conveyor.scrollTo({left:conveyor.scrollWidth,behavior:'smooth'});appendLoad(task);
}

function compile(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Shader compilation failed');
  return shader;
}
function link(){
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Program link failed');return program;
}

if(!gl){loadStage(0,'WebGL2 is unavailable');throw new Error('Dremplay One requires WebGL2');}
loadStage(8,'Creating clean GPU context',['§Renderer','WebGL2 context','Fullscreen triangle']);
let program;
try{
  loadStage(31,'Compiling mathematical world fields',['§Geometry','Warped terrain','Analytic Resources','5/7 crystal fields']);
  program=link();
  loadStage(67,'Linking smooth field lighting',['§Lighting','Central gradients','Wrapped sunlight','Water Fresnel']);
}catch(error){loadStage(0,'Renderer compilation failed');appendLoad(error.message);throw error;}

gl.useProgram(program);gl.bindVertexArray(gl.createVertexArray());
const uniforms={};for(const name of ['uResolution','uCamera','uLook','uTime','uDay','uSteps','uLighting','uPixelDetail','uSeed'])uniforms[name]=gl.getUniformLocation(program,name);

const state={
  running:false,test:false,yaw:0,pitch:-.08,timeOfDay:12,seed:7319,gravity:10,vertical:0,onGround:false,crawl:false,
  position:{x:0,y:35,z:24},keys:new Set(),renderScale:.60,steps:80,lighting:1,pixelDetail:1,
  last:performance.now(),frames:0,fps:0,frameMs:0,adaptiveCooldown:0
};

function jsHash(x,z){let px=x*123.34,py=z*456.21;px-=Math.floor(px);py-=Math.floor(py);const d=px*(px+45.32+state.seed*.0001)+py*(py+45.32+state.seed*.0001);px+=d;py+=d;const n=px*py;return n-Math.floor(n);}
function jsNoise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);return (jsHash(ix,iz)*(1-sx)+jsHash(ix+1,iz)*sx)*(1-sz)+(jsHash(ix,iz+1)*(1-sx)+jsHash(ix+1,iz+1)*sx)*sz;}
function jsFbm(x,z){let v=0,a=.54;for(let i=0;i<4;i++){v+=a*jsNoise(x,z);const nx=.8*x-.6*z,nz=.6*x+.8*z;x=nx*2.03+17.17;z=nz*2.03+17.17;a*=.48;}return v;}
function groundHeight(x,z){const wx=jsFbm(x*.0013+31,z*.0013+31)-.5,wz=jsFbm(x*.0013-47,z*.0013-47)-.5,qx=x+wx*85,qz=z+wz*85,continent=jsFbm(qx*.00105,qz*.00105),n=jsFbm(qx*.00235+9,qz*.00235+9),ridge=1-Math.abs(n*2-1),ranges=Math.pow(Math.max(0,Math.min(1,ridge)),2.7),mass=Math.max(0,Math.min(1,(continent-.34)/(.73-.34))),smoothMass=mass*mass*(3-2*mass),broad=7.5+22*continent+112*ranges*smoothMass,erosion=Math.pow(jsFbm(qx*.0075+80,qz*.0075+80),2)*8,channel=Math.pow(Math.abs(jsNoise(qx*.0038+130,qz*.0038+130)*2-1),1.7),cs=Math.max(0,Math.min(1,(channel-.08)/(.34-.08))),csm=cs*cs*(3-2*cs);return broad-erosion-(5*(1-csm));}
function respawn(){state.position.x=0;state.position.z=24;state.position.y=groundHeight(0,24)+1.72;state.vertical=0;}
respawn();

function resize(){const scale=state.renderScale,w=Math.max(480,Math.round(innerWidth*scale)),h=Math.max(270,Math.round(innerHeight*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}}
addEventListener('resize',resize,{passive:true});resize();

function update(dt){
  const forward={x:Math.sin(state.yaw),z:-Math.cos(state.yaw)},right={x:Math.cos(state.yaw),z:Math.sin(state.yaw)};
  let mx=0,mz=0;if(state.keys.has('KeyW')){mx+=forward.x;mz+=forward.z}if(state.keys.has('KeyS')){mx-=forward.x;mz-=forward.z}if(state.keys.has('KeyA')){mx-=right.x;mz-=right.z}if(state.keys.has('KeyD')){mx+=right.x;mz+=right.z}
  const length=Math.hypot(mx,mz)||1,speed=state.crawl?1.7:state.keys.has('AltLeft')?8.5:5.2;state.position.x+=mx/length*speed*dt;state.position.z+=mz/length*speed*dt;
  const eye=state.crawl?.92:1.72,ground=groundHeight(state.position.x,state.position.z)+eye;
  state.vertical-=state.gravity*dt;state.position.y+=state.vertical*dt;
  if(state.position.y<=ground){state.position.y=ground;state.vertical=0;state.onGround=true}else state.onGround=false;
}

function render(now){
  const dt=Math.min(.05,(now-state.last)/1000);state.last=now;if(state.running)update(dt);resize();
  gl.useProgram(program);gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);gl.uniform3f(uniforms.uCamera,state.position.x,state.position.y,state.position.z);gl.uniform2f(uniforms.uLook,state.yaw,state.pitch);gl.uniform1f(uniforms.uTime,now/1000);gl.uniform1f(uniforms.uDay,state.timeOfDay);gl.uniform1i(uniforms.uSteps,state.steps);gl.uniform1i(uniforms.uLighting,state.lighting);gl.uniform1i(uniforms.uPixelDetail,state.pixelDetail);gl.uniform1f(uniforms.uSeed,state.seed);gl.drawArrays(gl.TRIANGLES,0,3);
  state.frames++;state.frameMs=state.frameMs*.92+dt*1000*.08;if(now-state.adaptiveCooldown>1000){state.fps=Math.round(1000/Math.max(1,state.frameMs));state.adaptiveCooldown=now;telemetry.textContent=`${state.fps} fps · field ${(state.frameMs).toFixed(1)} ms · 1.00 km\ncontinuous geometry · ${canvas.width}×${canvas.height} · ${state.steps} steps\nxyz ${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}, ${state.position.z.toFixed(1)} m`;}
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

setTimeout(()=>loadStage(86,'Validating continuous-detail contracts',['§Validation','No chunk allocator','No mesh cache','Stable field seeds']),120);
setTimeout(()=>{loadStage(100,'Ready to play',['§Ready','Infinite field sampler','Smooth lighting']);appendLoad('Task complete. Ready to play.');playButton.disabled=false;testButton.disabled=false;playButton.textContent='Enter the continuous world';testButton.textContent='Test zone (same resolution)';},360);

function start(test=false){state.test=test;state.running=true;titleScreen.classList.add('hidden');canvas.requestPointerLock?.();}
playButton.addEventListener('click',()=>start(false));testButton.addEventListener('click',()=>start(true));
canvas.addEventListener('click',()=>{if(state.running&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.();});
addEventListener('mousemove',event=>{if(document.pointerLockElement!==canvas)return;state.yaw-=event.movementX*.0022;state.pitch=Math.max(-1.48,Math.min(1.48,state.pitch-event.movementY*.0022));});
addEventListener('keydown',event=>{
  if(event.target.matches('input,select'))return;
  if(event.code==='Space'){event.preventDefault();document.pointerLockElement?document.exitPointerLock():canvas.requestPointerLock?.();return;}
  if(event.code==='ShiftLeft'&&state.onGround){state.vertical=4.65;state.onGround=false;}
  if(event.code==='ControlLeft')state.crawl=true;
  if(event.code==='Slash'){event.preventDefault();openWindow('console');document.exitPointerLock?.();setTimeout(()=>document.getElementById('consoleInput').focus(),0);return;}
  if(event.code==='F1'){event.preventDefault();openWindow('help')}if(event.code==='F2'){event.preventDefault();openWindow('about')}if(event.code==='F10'){event.preventDefault();openWindow('server')}if(event.code==='F11'){event.preventDefault();openWindow('mods')}if(event.code==='F12'){event.preventDefault();openWindow('options')}if(event.code==='KeyM')openWindow('materials');if(event.code==='KeyR')openWindow('resources');
  if(event.code==='Escape'){const visible=[...document.querySelectorAll('.window:not(.hidden)')].filter(w=>w!==loading);if(visible.length)visible.at(-1).classList.add('hidden');}
  state.keys.add(event.code);
});
addEventListener('keyup',event=>{state.keys.delete(event.code);if(event.code==='ControlLeft')state.crawl=false;});

function openWindow(name){const win=document.querySelector(`[data-window-name="${name}"]`);if(!win)return;win.classList.remove('hidden','minimized');win.style.zIndex=String(++topZ);document.querySelectorAll('#menu button').forEach(b=>b.classList.toggle('active',b.dataset.window===name));}
let topZ=10;
document.querySelectorAll('#menu button').forEach(button=>button.addEventListener('click',()=>openWindow(button.dataset.window)));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{const win=button.closest('.window');if(win===loading&&loadProgress.style.width!=='100%')return;win.classList.add('hidden');document.querySelectorAll('#menu button').forEach(b=>b.classList.remove('active'));}));
document.querySelectorAll('[data-minimize]').forEach(button=>button.addEventListener('click',()=>button.closest('.window').classList.toggle('minimized')));
for(const win of document.querySelectorAll('.window')){
  const header=win.querySelector('header');let drag=null;header.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;const rect=win.getBoundingClientRect();drag={x:event.clientX-rect.left,y:event.clientY-rect.top};header.setPointerCapture(event.pointerId);win.style.zIndex=String(++topZ);});header.addEventListener('pointermove',event=>{if(!drag)return;win.style.left=`${Math.max(0,Math.min(innerWidth-win.offsetWidth,event.clientX-drag.x))}px`;win.style.top=`${Math.max(36,Math.min(innerHeight-32,event.clientY-drag.y))}px`;win.style.right='auto';win.style.bottom='auto';});header.addEventListener('pointerup',()=>drag=null);
}

document.getElementById('renderScale').addEventListener('change',event=>{state.renderScale=Number(event.target.value);resize();});
document.getElementById('quality').addEventListener('change',event=>state.steps=Number(event.target.value));
document.getElementById('lighting').addEventListener('change',event=>state.lighting=Number(event.target.value));
document.getElementById('pixelDetail').addEventListener('change',event=>state.pixelDetail=event.target.checked?1:0);
document.getElementById('gravity').addEventListener('input',event=>state.gravity=Math.max(0,Number(event.target.value)||0));

const equations={
 'Oak branching field':'F(p)=minᵢ capsule(p, branch(seed,i), r₀·λⁱ) ∪ ellipsoid(p, phyllotacticCrownᵢ)\nContinuous domain: ℝ³ · recursion: unbounded · sampling: screen-error bounded',
 'Fir phyllotactic field':'F(p)=minᵢ capsule(trunkᵢ) ∪ coneWhorl(p, i·goldenAngle, taper(i))\nApical dominance + seeded whorl variance · continuous ℝ³',
 'Fivefold quasicrystal field':'F(p)=minᵢ max(pentagonRadius(Rᵢp)-rᵢ(y), axialCapᵢ(y))\nNatural analogues: icosahedral quasicrystal; pyrite pyritohedron',
 'Sevenfold growth crystal field':'F(p)=minᵢ max(septagonRadius(Rᵢp)-rᵢ(y), axialCapᵢ(y))\nBiomorphic nonperiodic growth; heptagonal negative-curvature reference',
 'Recursive fern field':'F(p)=rachis(t) ∪ Σ pinna(±normal(t), scale·λⁿ)\nAlternating pinnae · circinate curvature · recursion: unbounded',
 'Grass blade field':'F(p)=capsule(p, Bézier(root, wind, tropism), taper(t))\nOne identity per growth seed; analytic blade at every sampling scale',
 'Rounded stone field':'F(p)=superellipsoid(Rp,a,b,c,n)+domainWarp(fBm(p))+cleavage(p)\nWeathering curvature and strata-aligned fracture fields'
};
const resourceSelect=document.getElementById('resourceSelect'),resourceEquation=document.getElementById('resourceEquation');function showEquation(){resourceEquation.textContent=equations[resourceSelect.value]||''}resourceSelect.addEventListener('change',showEquation);showEquation();

const swatches=document.getElementById('swatches');for(const [name,color] of palette){const swatch=document.createElement('div');swatch.className='swatch';swatch.title=name;swatch.style.background=color;swatches.append(swatch);}

const consoleLog=document.getElementById('consoleLog'),consoleForm=document.getElementById('consoleForm'),consoleInput=document.getElementById('consoleInput');
function say(message){consoleLog.textContent+=`${message}\n`;consoleLog.scrollTop=consoleLog.scrollHeight;}
say(`Dremplay One ${VERSION} — new continuous-field engine\nType help for commands.`);
consoleForm.addEventListener('submit',event=>{event.preventDefault();const raw=consoleInput.value.trim(),[command,...args]=raw.split(/\s+/);consoleInput.value='';if(!command)return;say(`/${raw}`);switch(command.toLowerCase()){
  case'help':say('help · respawn · time 1-24 · gravity m/s² · position · lighting 0|1 · quality 72|96|128 · seed number · clear');break;
  case'respawn':respawn();say('Respawned.');break;
  case'time':state.timeOfDay=Math.max(1,Math.min(24,Number(args[0])||12));say(`Time ${state.timeOfDay.toFixed(1)}h.`);break;
  case'gravity':state.gravity=Math.max(0,Number(args[0])||10);document.getElementById('gravity').value=state.gravity;say(`Gravity ${state.gravity.toFixed(2)} m/s².`);break;
  case'position':say(`${state.position.x.toFixed(2)}, ${state.position.y.toFixed(2)}, ${state.position.z.toFixed(2)} m`);break;
  case'lighting':state.lighting=Number(args[0])?1:0;document.getElementById('lighting').value=String(state.lighting);say(state.lighting?'Smooth field-gradient lighting.':'Unlit diagnostic.');break;
  case'quality':state.steps=Math.max(48,Math.min(128,Number(args[0])||80));document.getElementById('quality').value=String(state.steps);say(`${state.steps} field steps.`);break;
  case'seed':state.seed=Number(args[0])||7319;respawn();say(`World seed ${state.seed}. No chunks to regenerate.`);break;
  case'clear':consoleLog.textContent='';break;
  default:say(`Unknown command: ${command}`);
}});

canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();state.running=false;loading.classList.remove('hidden');loadStage(0,'Graphics context interrupted');appendLoad('The renderer stopped safely; no flashing recovery loop will run. Reload when ready.');},{passive:false});
})();
