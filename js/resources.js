import {
  MAT_GRANITE, MAT_LICHEN, MAT_FLOWER, MAT_TALL_GRASS, MAT_GRASS,
  MAT_SAND, MAT_QUARTZ, MAT_GRAVEL, MAT_STONE, MAT_MOSS, MAT_BARK, MAT_LEAVES,
  MAT_MARBLE, MAT_SLATE, MAT_BASALT, MAT_LIMESTONE, MAT_AIR
} from './constants.js';
import { hash3, fbm2, valueNoise2 } from './noise.js';
import { chunkKey } from './coords.js';

// RESOURCE GENERATOR — named procedural voxel objects. The same compact schema
// drives natural boulders, flowers and trees and is ready for later crafting use.

// chunk key -> sparse Map(voxel index, Resource ID)
export const resourceChunks = new Map();
const resourceIdByName = new Map();
export const resourceNameById = ['none'];
export function registerResourceName(name){if(!resourceIdByName.has(name)){const id=resourceNameById.length;resourceIdByName.set(name,id);resourceNameById.push(name);}return resourceIdByName.get(name);}

export const resourceDefinitions=new Map([
  ['field_boulder',{name:'field_boulder',role:'stone',shape:'ellipsoid',material:MAT_GRANITE,secondary:MAT_LICHEN,fractal:'ridged',seed:4171,scale:6,subsurface:.18,radial:1,angle:28,iterations:3,tropism:0,influence:8,kill:2,components:[]}],
  ['foxglove',{name:'foxglove',role:'flower',shape:'branch graph',material:MAT_FLOWER,secondary:MAT_TALL_GRASS,fractal:'phyllotaxis',seed:811,scale:5,subsurface:.05,radial:5,angle:38,iterations:4,tropism:.6,influence:7,kill:2,components:[]}],
  ['meadow_grass_blade',{name:'meadow_grass_blade',role:'grass',shape:'capsule',material:MAT_GRASS,secondary:MAT_GRASS,fractal:'branching',seed:217,scale:3,subsurface:0,radial:1,angle:8,iterations:2,tropism:.9,influence:4,kill:1,components:[]}],
  ['slope_grass_blade',{name:'slope_grass_blade',role:'grass',shape:'capsule',material:MAT_GRASS,secondary:MAT_GRASS,fractal:'domain warp',seed:433,scale:2,subsurface:0,radial:1,angle:18,iterations:2,tropism:.72,influence:4,kill:1,components:[]}],
  ['high_grass_blade',{name:'high_grass_blade',role:'grass',shape:'capsule',material:MAT_TALL_GRASS,secondary:MAT_TALL_GRASS,fractal:'branching',seed:619,scale:7,subsurface:0,radial:1,angle:14,iterations:3,tropism:.75,influence:5,kill:1,components:[]}],
  ['sand_grain',{name:'sand_grain',role:'grain',shape:'cube',material:MAT_SAND,secondary:MAT_QUARTZ,fractal:'cluster aggregation',seed:1231,scale:2,subsurface:.1,radial:1,angle:12,iterations:1,tropism:0,influence:2,kill:1,components:[]}],
  ['gravel_chip',{name:'gravel_chip',role:'grain',shape:'ellipsoid',material:MAT_GRAVEL,secondary:MAT_STONE,fractal:'ridged',seed:1459,scale:2,subsurface:.15,radial:1,angle:18,iterations:1,tropism:0,influence:2,kill:1,components:[]}],
  ['stone_shard',{name:'stone_shard',role:'grain',shape:'ellipsoid',material:MAT_STONE,secondary:MAT_LICHEN,fractal:'vein network',seed:1693,scale:2,subsurface:.12,radial:1,angle:24,iterations:1,tropism:0,influence:2,kill:1,components:[]}],
  ['moss_cushion',{name:'moss_cushion',role:'moss',shape:'ellipsoid',material:MAT_MOSS,secondary:MAT_LICHEN,fractal:'cellular',seed:941,scale:4,subsurface:.12,radial:1,angle:8,iterations:3,tropism:0,influence:5,kill:1,components:[]}],
  ['ironbark_tree',{name:'ironbark_tree',role:'tree',shape:'branch graph',material:MAT_LEAVES,secondary:MAT_BARK,fractal:'space colonization',seed:1337,scale:12,subsurface:.12,radial:7,angle:32,iterations:5,tropism:.28,influence:12,kill:3,components:['moss_cushion']}]
]);
// Materials may declare a lightweight surface Resource rule. New grains,
// seeds, leaf litter, shells or crystals can join this table without adding a
// separate terrain pass or changing chunk storage.
export const surfaceMicroResourceRules=new Map([
  [MAT_SAND,{resource:'sand_grain',density:.16}],
  [MAT_GRAVEL,{resource:'gravel_chip',density:.13}],
  [MAT_STONE,{resource:'stone_shard',density:.08}],
  [MAT_GRANITE,{resource:'stone_shard',density:.10}],
  [MAT_MARBLE,{resource:'stone_shard',density:.08}],
  [MAT_QUARTZ,{resource:'stone_shard',density:.07}],
  [MAT_SLATE,{resource:'stone_shard',density:.09}],
  [MAT_BASALT,{resource:'stone_shard',density:.08}],
  [MAT_LIMESTONE,{resource:'stone_shard',density:.09}]
]);
for(const name of resourceDefinitions.keys())registerResourceName(name);

export function resourceVoxel(def,x,y,z){
  const s=Math.max(2,def.scale),seed=def.seed|0,rr=Math.hypot(x,z),rad=Math.atan2(z,x),noise=fbm2((x+seed%97)*.19,(z-y+seed%53)*.19,3,2,.5,3301+seed);
  if(def.role==='tree'){
    const thickness=Math.max(1,(def.kill||2)*.34),top=s*(.86+(def.tropism||0)*.12),level=Math.max(2,Math.floor(s/Math.max(2,(def.iterations||4)+1))),branchY=Math.round(y/level)*level,branchPhase=branchY*Math.sin((def.angle||30)*Math.PI/180)+seed*.013;
    const trunk=y>=0&&y<top&&rr<Math.max(thickness,thickness*1.7-y/s),arm=Math.abs(y-branchY)<thickness*.55&&y>2&&y<top*.92&&Math.abs(Math.sin(rad*def.radial+branchPhase))<.20&&rr<Math.min(s*.58,(def.influence||10)*.48);
    const crownRadius=s*(.30+Math.min(32,def.influence||10)/100),crown=Math.hypot(x/crownRadius,(y-top)/(s*.34),z/crownRadius)<1+noise*.16;
    return trunk||arm?def.secondary:(crown?def.material:0);
  }
  if(def.role==='flower'||def.role==='grass'){
    const lean=Math.sin((def.seed||0)*.017+y*.38)*(1-(def.tropism||0))*.7,stem=y>=0&&y<s&&Math.hypot(x-lean,z)<.72,petal=def.role==='flower'&&Math.abs(y-s)<1.2&&rr<s*.55&&Math.cos(rad*def.radial)>.18;
    return petal?def.material:(stem?def.secondary:0);
  }
  if(def.role==='moss')return y>=0&&y<=Math.max(1,s*.34)&&Math.hypot(x/(s*.75),y/(s*.30),z/(s*.75))<1+noise*.18?(noise>.54?def.secondary:def.material):0;
  return resourceContains(def,x,y,z)?(noise>.58&&def.secondary?def.secondary:def.material):0;
}
export function stampNaturalResources(chunk,baseX,baseY,baseZ,columns,cx,cy,cz){
  const key=chunkKey(cx,cy,cz);let metadata=resourceChunks.get(key);
  const tag=(i,rid)=>{if(!rid)return;if(!metadata){metadata=new Map();resourceChunks.set(key,metadata);}metadata.set(i,rid);};
  const put=(x,y,z,m,rid,airOnly=false)=>{const lx=x-baseX,ly=y-baseY,lz=z-baseZ;if(lx>=0&&ly>=0&&lz>=0&&lx<32&&ly<32&&lz<32){const i=lx+ly*32+lz*1024;if(airOnly&&chunk[i]!==MAT_AIR)return;chunk[i]=m;tag(i,rid);}};
  const stamp=(def,wx,wy,wz)=>{if(wy+def.scale*2<baseY||wy-def.scale>baseY+31)return;const rid=registerResourceName(def.name);for(let x=-def.scale;x<=def.scale;x++)for(let y=-def.scale;y<=def.scale*2;y++)for(let z=-def.scale;z<=def.scale;z++){const material=resourceVoxel(def,x,y,z);if(material)put(wx+x,wy+y,wz+z,material,rid);}for(const [i,name] of (def.components||[]).entries()){const child=resourceDefinitions.get(name);if(!child)continue;const angle=hash3(def.seed||0,i,0,3901)*Math.PI*2,dist=Math.max(2,def.scale*.36);stamp({...child,components:[]},Math.round(wx+Math.cos(angle)*dist),wy,Math.round(wz+Math.sin(angle)*dist));}};
  for(let n=0;n<2;n++){
    const wx=baseX+3+Math.floor(hash3(cx,n,cz,3101)*26),wz=baseZ+3+Math.floor(hash3(cx,n,cz,3103)*26),col=columns[(wx-baseX)+(wz-baseZ)*32];if(!col)continue;
    const wy=col.h+1,r=hash3(cx,n,cz,3119);
    if(col.exposedRock||col.snowy||col.terrain.poolMask>.3)continue;
    if(r>.82&&col.stoneField>.08){const def={...resourceDefinitions.get('field_boulder'),material:col.rockMaterial,seed:3121+wx*3+wz};stamp(def,wx,wy,wz);}
    else if(r>.98&&col.moisture>.42&&col.slope<2.8)stamp(resourceDefinitions.get('ironbark_tree'),wx,wy,wz);
    else if(col.grassy&&col.moisture>.72&&r>.68)stamp(resourceDefinitions.get('moss_cushion'),wx,wy,wz);
    else if(r>.91&&col.grassy)stamp(resourceDefinitions.get('foxglove'),wx,wy,wz);
  }

  // Surface micro-Resources are reconstructed from a jittered 3×3 voxel lattice.
  // This produces tens of thousands of individually identified blades across
  // the resident ring without maintaining a heavyweight object per instance.
  if(baseY>columns.maxSurface+5||baseY+31<columns.minSurface+1)return;
  const meadowRid=registerResourceName('meadow_grass_blade'),slopeRid=registerResourceName('slope_grass_blade'),highRid=registerResourceName('high_grass_blade');
  const sandRid=registerResourceName('sand_grain'),gravelRid=registerResourceName('gravel_chip'),stoneRid=registerResourceName('stone_shard');
  for(let gz=0;gz<11;gz++)for(let gx=0;gx<11;gx++){
    const jx=Math.floor(hash3(cx,gx,gz+cz*17,4103)*3),jz=Math.floor(hash3(cx,gx+gz*19,cz,4111)*3);
    const lx=Math.min(31,gx*3+jx),lz=Math.min(31,gz*3+jz),wx=baseX+lx,wz=baseZ+lz,col=columns[lx+lz*32];
    if(!col||col.snowy||col.terrain.poolMask>.34)continue;
    const patch=valueNoise2(wx*.034+17,wz*.034-29,4127),scatter=hash3(wx,col.h,wz,4133);
    if(col.grassy&&!col.exposedRock){
      // Clumped density, but no flat-ground restriction: soil-covered slopes
      // keep blades until they become true exposed cliffs.
      const density=Math.max(.18,Math.min(.82,.38+col.moisture*.22+patch*.20-col.slope*.009));
      if(scatter>density)continue;
      const tallField=valueNoise2(wx*.019-41,wz*.019+13,4153),kind=hash3(wx,col.h,wz,4157);
      const tall=kind<Math.max(.10,.18+col.moisture*.18+tallField*.12),slopeBlade=!tall&&col.slope>.55&&kind>.48;
      const rid=tall?highRid:slopeBlade?slopeRid:meadowRid,material=tall?MAT_TALL_GRASS:MAT_GRASS;
      const height=tall?2+Math.floor(hash3(wx,col.h,wz,4177)*4):1+Math.floor(hash3(wx,col.h,wz,4187)*2);
      for(let y=1;y<=height;y++)put(wx,col.h+y,wz,material,rid,true);
    }else{
      // The same emitter model turns bare material fields into identifiable
      // grains and chips. Density stays low enough to read as texture, not rubble.
      const rule=surfaceMicroResourceRules.get(col.surfaceMaterial)||(col.exposedRock?surfaceMicroResourceRules.get(col.rockMaterial):null);
      let rid=0,material=0,density=0;
      if(rule){
        rid=rule.resource==='sand_grain'?sandRid:rule.resource==='gravel_chip'?gravelRid:stoneRid;
        material=rule.resource==='sand_grain'&&hash3(wx,col.h,wz,4201)>.88?MAT_QUARTZ:rule.resource==='sand_grain'?MAT_SAND:rule.resource==='gravel_chip'?MAT_GRAVEL:col.rockMaterial;
        density=rule.density+Math.max(0,rule.resource==='stone_shard'?col.stoneField:patch)*.08;
      }
      if(rid&&scatter<density)put(wx,col.h+1,wz,material,rid,true);
    }
  }
}
export function resourceContains(def,x,y,z){
  const s=Math.max(2,def.scale),rad=Math.atan2(z,x),rr=Math.hypot(x,z),seed=def.seed|0,n=fbm2((x+37+seed%71)*.19,(z-y+seed%43)*.19,Math.max(2,Math.min(6,def.iterations||3)),2,.5,3301+seed);
  const warp=def.fractal==='none'?0:n*s*(def.fractal==='domain warp'?.18:.10);
  if(def.radial>1){const sector=Math.PI*2/def.radial;rr+=Math.cos(rad*def.radial)*s*.035;}
  let d=def.shape==='cube'?Math.max(Math.abs(x),Math.abs(y),Math.abs(z))-s*.5:
    def.shape==='donut'?Math.hypot(rr-s*.32,y)-s*.17:
    def.shape==='capsule'?Math.hypot(rr,Math.max(0,Math.abs(y)-s*.35))-s*.22:
    def.shape==='cone'?rr-(s-Math.max(0,y))*.32:
    def.shape==='cylinder'?Math.max(rr-s*.28,Math.abs(y)-s*.5):
    def.shape==='ellipsoid'?Math.hypot(x,y*1.45,z)-s*.5:Math.hypot(x,y,z)-s*.5;
  if(['branching','L-system','space colonization','root network','vein network','coral growth'].includes(def.fractal))d-=Math.max(0,(1-Math.abs(y)/(s*.6)))*Math.cos(rad*def.radial+y*Math.sin((def.angle||30)*Math.PI/180))*s*.12;
  if(def.fractal==='phyllotaxis')d-=Math.cos(rad*2.399963+y*.7)*s*.08;
  if(def.fractal==='cellular'||def.fractal==='cluster aggregation')d+=Math.abs(n)*s*.12;
  return d+warp<0 && (def.subsurface<=0||hash3(x|0,y|0,z|0,3313)>def.subsurface*.28);
}
