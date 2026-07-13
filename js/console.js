import { VS, VY } from './constants.js';
import { settings } from './settings.js';
import { playerState, getCamBasis, raycastVoxels, gridDirection } from './player.js';
import {
  PALETTE, MATERIAL_NAMES, materialState, syncMaterialSlots, materialPropertiesId,
  DEFAULT_MATERIAL_SLOTS, DEFAULT_MATERIAL_PARAMS, DEFAULT_MATERIAL_MODES
} from './palette.js';
import { getVoxelA, getVoxelResourceId } from './world.js';
import { resourceDefinitions, registerResourceName, resourceNameById } from './resources.js';
import { uiState, setDesigner, setConsole, returnToGameControl } from './windows.js';
import { designerMaterial, loadDesignerMaterial, loadMaterialFromPropertiesId } from './material-designer.js';
import { loadResource } from './resource-designer.js';
import { inputState } from './input-state.js';

const consoleInput=document.getElementById('consoleInput');
const consoleOutput=document.getElementById('consoleOutput');
let consoleLogLines=[consoleOutput.textContent];
function appendConsoleLog(text){consoleLogLines.push(String(text));consoleLogLines=consoleLogLines.slice(-500);consoleOutput.textContent=consoleLogLines.join('\n\n');consoleOutput.scrollTop=consoleOutput.scrollHeight;}

export function runConsoleCommand(raw){
  const command=raw.trim().toLowerCase().replace(/\s+/g,' ');
  const [name,arg]=command.split(' ');
  const number=Number(arg);
  if(command)appendConsoleLog(`> ${raw.trim()}`);
  const say=text=>appendConsoleLog(text);
  if(!command || name==='help')return say(
`Dreamplay One commands
help                 list commands and descriptions
lightmode <0|1>      hard voxel or smooth Voxlap lighting
respawn              return to the original spawn point
gravity <m/s²>       set downward acceleration (0–50)
time <1–24>          set hour, sun direction, lighting, and sky
speed <m/s>          set walking speed (0.5–20)
jump <m/s>           set jump launch speed (0–20)
reach <m>            set crosshair editing reach (0.5–20)
brush <voxels>       set carve/place ball radius (1–12)
waterflow <on|off>   run or freeze water simulation
fov <degrees>        set field of view (40–110)
where                show current world coordinates
palette              list the official palette colors
materials            list material IDs and selected material
designer             open the windowed Material Designer
material <name|id>   inspect a material's palette texture
material select <m>  use a material for right-click placement
material sample      select the material under the crosshair
material set <m> <base|light|dark> <palette-id>
material <noise|scale|blur> <m> <value>
material pattern <m> <0–6> choose procedural texture generator
material id <m>      show a portable properties ID
material load <hex>  load a material properties ID
material reset <m|all> restore default material colors
resources            list named procedural Resources
resource place <name> place a saved Resource at the crosshair
resource sample       inspect material and Resource provenance`);
  if(name==='lightmode' && (arg==='0'||arg==='1')){settings.lightMode=Number(arg);return say(`lightmode ${settings.lightMode} active`);}
  if(name==='respawn'){
    playerState.pos={...playerState.spawnPos};playerState.velY=0;playerState.grounded=false;
    return say(`respawned at ${playerState.pos.x.toFixed(1)}, ${playerState.pos.y.toFixed(1)}, ${playerState.pos.z.toFixed(1)} m`);
  }
  if(name==='gravity' && Number.isFinite(number) && number>=0 && number<=50){settings.gravityAcceleration=-number;return say(`gravity ${number.toFixed(2)} m/s²`);}
  if(name==='time' && Number.isFinite(number) && number>=1 && number<=24){settings.timeOfDay=number===24?0:number;return say(`time ${number.toFixed(1)}:00`);}
  if(name==='speed' && Number.isFinite(number) && number>=0.5 && number<=20){settings.walkSpeed=number;return say(`walk speed ${number.toFixed(2)} m/s`);}
  if(name==='jump' && Number.isFinite(number) && number>=0 && number<=20){settings.jumpSpeed=number;return say(`jump speed ${number.toFixed(2)} m/s`);}
  if(name==='reach' && Number.isFinite(number) && number>=0.5 && number<=20){settings.editReachMeters=number;return say(`editing reach ${number.toFixed(2)} m`);}
  if(name==='brush' && Number.isInteger(number) && number>=1 && number<=12){settings.carveRadius=number;settings.placeRadius=number;return say(`brush radius ${number} voxel${number===1?'':'s'} (${(number*VS).toFixed(1)} m)`);}
  if(name==='waterflow' && (arg==='on'||arg==='off')){settings.waterFlowEnabled=arg==='on';return say(`water flow ${arg}`);}
  if(name==='fov' && Number.isFinite(number) && number>=40 && number<=110){settings.fovDegrees=number;return say(`field of view ${number.toFixed(1)}°`);}
  if(name==='where')return say(`xyz ${playerState.pos.x.toFixed(2)}, ${playerState.pos.y.toFixed(2)}, ${playerState.pos.z.toFixed(2)} m`);
  if(name==='palette')return say(PALETTE.map(([n,h],i)=>`${String(i).padStart(2,'0')}  ${h}  ${n}`).join('\n'));
  if(name==='materials')return say(MATERIAL_NAMES.slice(1).map((n,i)=>`${i+1}  ${n}${materialState.selected===i+1?'  [SELECTED]':''}`).join('\n'));
  if(name==='designer'){setDesigner(true);return say('Material Designer opened. Changes apply live.');}
  if(name==='resources')return say([...resourceDefinitions.values()].map(r=>`${registerResourceName(r.name)} · ${r.name} · ${r.shape} · ${MATERIAL_NAMES[r.material]} · ${r.fractal}`).join('\n'));
  if(name==='resource'){
    const parts=command.split(' ');
    if(parts[1]==='sample'){
      const cam=getCamBasis(),hit=raycastVoxels({x:playerState.pos.x/VS,y:(playerState.pos.y+playerState.currentEyeH)/VY,z:playerState.pos.z/VS},gridDirection(cam.forward),settings.editReachMeters/VS);if(!hit)return say('No voxel under the crosshair.');
      const material=getVoxelA(hit.x,hit.y,hit.z),rid=getVoxelResourceId(hit.x,hit.y,hit.z);return say(`voxel ${hit.x},${hit.y},${hit.z}\nmaterial ${material}: ${MATERIAL_NAMES[material]||'unknown'}\nResource ID ${rid}: ${resourceNameById[rid]||'none (terrain or manual voxel)'}`);
    }
    const def=resourceDefinitions.get(parts[2]);
    if(parts[1]!=='place'||!def)return say('Usage: resource place <name>  (use “resources” to list names)');
    loadResource(def.name);document.getElementById('resourcePlace').click();return say(`placed Resource ${def.name}`);
  }
  if(name==='material'){
    const parts=command.split(' ');
    const materialId=value=>{
      const numeric=Number(value);
      if(Number.isInteger(numeric)&&numeric>=1&&numeric<MATERIAL_NAMES.length)return numeric;
      const id=MATERIAL_NAMES.indexOf(value||'');return id>0?id:-1;
    };
    const describe=id=>{
      const labels=['base','light','dark'];
      return `${id} ${MATERIAL_NAMES[id]}${materialState.selected===id?' [SELECTED]':''}\n`+
        materialState.slots[id].map((slot,i)=>`${labels[i]}: palette ${slot} ${PALETTE[slot][1]} ${PALETTE[slot][0]}`).join('\n')+
        `\nnoise: ${materialState.params[id][0].toFixed(2)} · scale: ${materialState.params[id][1].toFixed(2)} · blur: ${materialState.params[id][2].toFixed(2)}`;
    };
    if(parts[1]==='select'){
      const id=materialId(parts[2]);if(id<1)return say('Usage: material select <name|1-12>');
      materialState.selected=id;return say(`placement material: ${MATERIAL_NAMES[id]} (${id})`);
    }
    if(parts[1]==='sample'){
      const cam=getCamBasis(), hit=raycastVoxels({x:playerState.pos.x/VS,y:(playerState.pos.y+playerState.currentEyeH)/VY,z:playerState.pos.z/VS},gridDirection(cam.forward),settings.editReachMeters/VS);
      if(!hit)return say('No material under the crosshair.');
      const id=getVoxelA(hit.x,hit.y,hit.z);materialState.selected=id;return say(`sampled ${MATERIAL_NAMES[id]} (${id})`);
    }
    if(parts[1]==='set'){
      const id=materialId(parts[2]), channel={base:0,light:1,dark:2}[parts[3]], slot=Number(parts[4]);
      if(id<1 || channel===undefined || !Number.isInteger(slot) || slot<0 || slot>=PALETTE.length)return say('Usage: material set <name|id> <base|light|dark> <palette-id>');
      materialState.slots[id][channel]=slot;syncMaterialSlots();if(uiState.designerOpen&&Number(designerMaterial.value)===id)loadDesignerMaterial();return say(describe(id));
    }
    if(parts[1]==='noise' || parts[1]==='scale' || parts[1]==='blur'){
      const id=materialId(parts[2]),value=Number(parts[3]),index={noise:0,scale:1,blur:2}[parts[1]];
      const valid=id>0&&Number.isFinite(value)&&(index===1?value>=1&&value<=12:value>=0&&value<=1);
      if(!valid)return say(`Usage: material ${parts[1]} <name|id> <${index===1?'1-12':'0-1'}>`);
      materialState.params[id][index]=value;syncMaterialSlots();if(uiState.designerOpen&&Number(designerMaterial.value)===id)loadDesignerMaterial();return say(describe(id));
    }
    if(parts[1]==='pattern'){
      const id=materialId(parts[2]),value=Number(parts[3]);if(id<1||!Number.isInteger(value)||value<0||value>6)return say('Usage: material pattern <name|id> <0-6>');
      materialState.modes[id]=value;syncMaterialSlots();if(uiState.designerOpen&&Number(designerMaterial.value)===id)loadDesignerMaterial();return say(describe(id)+`\npattern: ${value}`);
    }
    if(parts[1]==='id'){
      const id=materialId(parts[2]);if(id<1)return say('Usage: material id <name|id>');
      return say(`${MATERIAL_NAMES[id]} properties ID\n${materialPropertiesId(id)}`);
    }
    if(parts[1]==='load'){
      try{const id=loadMaterialFromPropertiesId(parts[2]||'');return say(`Loaded ${MATERIAL_NAMES[id]} from ${materialPropertiesId(id)}`);}catch(error){return say(error.message);}
    }
    if(parts[1]==='reset'){
      if(parts[2]==='all'){materialState.slots=DEFAULT_MATERIAL_SLOTS.map(v=>v.slice());materialState.params=DEFAULT_MATERIAL_PARAMS.map(v=>v.slice());materialState.modes=DEFAULT_MATERIAL_MODES.slice();syncMaterialSlots();if(uiState.designerOpen)loadDesignerMaterial();return say('All material definitions reset.');}
      const id=materialId(parts[2]);if(id<1)return say('Usage: material reset <name|id|all>');
      materialState.slots[id]=DEFAULT_MATERIAL_SLOTS[id].slice();materialState.params[id]=DEFAULT_MATERIAL_PARAMS[id].slice();materialState.modes[id]=DEFAULT_MATERIAL_MODES[id];syncMaterialSlots();if(uiState.designerOpen&&Number(designerMaterial.value)===id)loadDesignerMaterial();return say(describe(id));
    }
    const id=materialId(parts[1]);if(id>0)return say(describe(id));
    return say('Usage: material <name|id>, select, sample, set, or reset');
  }
  say(`Unknown or invalid command: ${raw}\nType “help” for syntax and valid ranges.`);
}

consoleInput.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.code==='Enter'){runConsoleCommand(consoleInput.value);consoleInput.value='';e.preventDefault();}
  else if(e.code==='Escape'){if(inputState.hasEnteredWorld)returnToGameControl();else setConsole(false);e.preventDefault();}
  else if(e.code==='Slash'){setConsole(false);e.preventDefault();}
});
