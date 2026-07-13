// Windowed Material Designer: live texture preview, palette/atlas pickers,
// and portable properties-ID import/export.
import {
  PALETTE, MATERIAL_NAMES, DEFAULT_MATERIAL_SLOTS, DEFAULT_MATERIAL_PARAMS, DEFAULT_MATERIAL_MODES,
  materialState, syncMaterialSlots, materialPropertiesId, loadMaterialPropertiesId
} from './palette.js';

const designerMaterial=document.getElementById('designerMaterial');
const designerBase=document.getElementById('designerBase');
const designerLight=document.getElementById('designerLight');
const designerDark=document.getElementById('designerDark');
const designerNoise=document.getElementById('designerNoise');
const designerScale=document.getElementById('designerScale');
const designerBlur=document.getElementById('designerBlur');
const designerPattern=document.getElementById('designerPattern');
const designerStatus=document.getElementById('designerStatus');
const previewCanvas=document.getElementById('materialPreview');
const materialAtlas=document.getElementById('materialAtlas'),paletteAtlas=document.getElementById('paletteAtlas');
const propertyIdInput=document.getElementById('materialPropertyId');
export { designerMaterial };

function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function previewHash(x,y){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function previewSmooth(x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=previewHash(ix,iy)*(1-sx)+previewHash(ix+1,iy)*sx,b=previewHash(ix,iy+1)*(1-sx)+previewHash(ix+1,iy+1)*sx;
  return a*(1-sy)+b*sy;
}
function renderMaterialPreview(){
  const id=Number(designerMaterial.value)||materialState.selected,slots=materialState.slots[id],params=materialState.params[id];
  const colors=slots.map(slot=>rgb(PALETTE[slot][1])),ctx=previewCanvas.getContext('2d');
  for(let y=0;y<previewCanvas.height;y+=2)for(let x=0;x<previewCanvas.width;x+=2){
    const crisp=previewHash(x>>2,y>>2),soft=previewSmooth(x/(params[1]*7),y/(params[1]*7));
    const signed=((crisp*(1-params[2])+soft*params[2])*2-1)*params[0],shade=signed>=0?colors[1]:colors[2],a=Math.abs(signed);
    ctx.fillStyle=`rgb(${colors[0].map((v,i)=>Math.round(v*(1-a)+shade[i]*a)).join(',')})`;ctx.fillRect(x,y,2,2);
  }
}
let activeShade=0;
function renderPickerAtlases(){
  const pc=paletteAtlas.getContext('2d'),cols=20,cellW=paletteAtlas.width/cols,rows=Math.ceil(PALETTE.length/cols),cellH=paletteAtlas.height/rows;
  pc.clearRect(0,0,paletteAtlas.width,paletteAtlas.height);
  PALETTE.forEach(([,hex],i)=>{const x=i%cols*cellW,y=Math.floor(i/cols)*cellH;pc.fillStyle=hex;pc.fillRect(x,y,cellW+1,cellH+1);if(materialState.slots[Number(designerMaterial.value)||1][activeShade]===i){pc.strokeStyle='#54fc54';pc.lineWidth=3;pc.strokeRect(x+1,y+1,cellW-2,cellH-2);}});
  const mc=materialAtlas.getContext('2d'),mcols=8,mw=materialAtlas.width/mcols,mh=materialAtlas.height/4;
  mc.clearRect(0,0,materialAtlas.width,materialAtlas.height);
  for(let id=0;id<MATERIAL_NAMES.length;id++){
    const x=id%mcols*mw,y=Math.floor(id/mcols)*mh,slots=materialState.slots[id];
    mc.fillStyle=PALETTE[slots[2]][1];mc.fillRect(x,y,mw,mh);mc.fillStyle=PALETTE[slots[0]][1];mc.fillRect(x+3,y+3,mw-6,mh-6);mc.fillStyle=PALETTE[slots[1]][1];
    for(let k=0;k<7;k++){const px=x+4+previewHash(id,k)*Math.max(1,mw-8),py=y+4+previewHash(k,id+7)*Math.max(1,mh-8);mc.fillRect(px,py,3,3);}
    if(Number(designerMaterial.value)===id){mc.strokeStyle='#ccb010';mc.lineWidth=3;mc.strokeRect(x+1,y+1,mw-2,mh-2);}
  }
}
document.querySelectorAll('.shade-tabs button').forEach(button=>button.addEventListener('click',()=>{activeShade=Number(button.dataset.shade);document.querySelectorAll('.shade-tabs button').forEach(b=>b.classList.toggle('active',b===button));renderPickerAtlases();}));
paletteAtlas.addEventListener('click',e=>{const r=paletteAtlas.getBoundingClientRect(),cols=20,rows=Math.ceil(PALETTE.length/cols),id=Math.floor((e.clientX-r.left)/r.width*cols)+Math.floor((e.clientY-r.top)/r.height*rows)*cols;if(id>=PALETTE.length)return;[designerBase,designerLight,designerDark][activeShade].value=String(id);applyDesigner();});
materialAtlas.addEventListener('click',e=>{const r=materialAtlas.getBoundingClientRect(),id=Math.floor((e.clientX-r.left)/r.width*8)+Math.floor((e.clientY-r.top)/r.height*4)*8;if(id>0&&id<MATERIAL_NAMES.length){designerMaterial.value=String(id);loadDesignerMaterial();}});

function refreshDesignerLabels(){
  document.getElementById('designerNoiseValue').textContent=Number(designerNoise.value).toFixed(2);
  document.getElementById('designerScaleValue').textContent=Number(designerScale.value).toFixed(2);
  document.getElementById('designerBlurValue').textContent=Number(designerBlur.value).toFixed(2);
}
export function loadDesignerMaterial(){
  const id=Number(designerMaterial.value)||1,slots=materialState.slots[id],params=materialState.params[id];
  designerBase.value=String(slots[0]);designerLight.value=String(slots[1]);designerDark.value=String(slots[2]);
  designerNoise.value=String(params[0]);designerScale.value=String(params[1]);designerBlur.value=String(params[2]);
  designerPattern.value=String(materialState.modes[id]);
  document.getElementById('materialPickerSummary').textContent=`Material: ${MATERIAL_NAMES[id].replaceAll('_',' ')}`;
  refreshDesignerLabels();renderMaterialPreview();renderPickerAtlases();propertyIdInput.value=materialPropertiesId(id);designerStatus.textContent=`Editing ${MATERIAL_NAMES[id].replaceAll('_',' ')} · live material ${id}`;
}
function applyDesigner(){
  const id=Number(designerMaterial.value);
  materialState.slots[id]=[Number(designerBase.value),Number(designerLight.value),Number(designerDark.value)];
  materialState.params[id]=[Number(designerNoise.value),Number(designerScale.value),Number(designerBlur.value)];
  materialState.modes[id]=Number(designerPattern.value);syncMaterialSlots();refreshDesignerLabels();renderMaterialPreview();renderPickerAtlases();propertyIdInput.value=materialPropertiesId(id);designerStatus.textContent=`${MATERIAL_NAMES[id]} updated live`;
}
for(let id=1;id<MATERIAL_NAMES.length;id++)designerMaterial.add(new Option(`${id} · ${MATERIAL_NAMES[id]}`,String(id)));
for(const select of [designerBase,designerLight,designerDark])PALETTE.forEach(([name,hex],id)=>select.add(new Option(`${String(id).padStart(2,'0')} · ${hex} · ${name}`,String(id))));
designerMaterial.addEventListener('change',loadDesignerMaterial);
for(const control of [designerBase,designerLight,designerDark,designerNoise,designerScale,designerBlur,designerPattern])control.addEventListener('input',applyDesigner);
document.getElementById('designerSelect').addEventListener('click',()=>{materialState.selected=Number(designerMaterial.value);designerStatus.textContent=`${MATERIAL_NAMES[materialState.selected]} selected for building`;});
document.getElementById('designerReset').addEventListener('click',()=>{const id=Number(designerMaterial.value);materialState.slots[id]=DEFAULT_MATERIAL_SLOTS[id].slice();materialState.params[id]=DEFAULT_MATERIAL_PARAMS[id].slice();materialState.modes[id]=DEFAULT_MATERIAL_MODES[id];syncMaterialSlots();loadDesignerMaterial();designerStatus.textContent=`${MATERIAL_NAMES[id]} restored to defaults`;});
document.getElementById('designerCopyId').addEventListener('click',async()=>{
  propertyIdInput.value=materialPropertiesId(Number(designerMaterial.value));
  try{await navigator.clipboard.writeText(propertyIdInput.value);designerStatus.textContent='Properties ID copied to clipboard.';}
  catch{propertyIdInput.select();document.execCommand('copy');designerStatus.textContent='Properties ID copied to clipboard.';}
});
// Parses a portable properties ID, applies it, and syncs the designer window
// to show the material it just updated (used by both the designer button and
// the console's "material load" command).
export function loadMaterialFromPropertiesId(text){
  const id=loadMaterialPropertiesId(text);designerMaterial.value=String(id);loadDesignerMaterial();return id;
}
document.getElementById('designerLoadId').addEventListener('click',()=>{try{const id=loadMaterialFromPropertiesId(propertyIdInput.value);designerStatus.textContent=`Loaded ${MATERIAL_NAMES[id]} from properties ID.`;}catch(error){designerStatus.textContent=error.message;}});
document.getElementById('materialDesigner').addEventListener('keydown',e=>e.stopPropagation());
