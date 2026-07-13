import { MAT_PLATFORM } from './constants.js';

// A compact working subset of neighboring shades from the official Myara palette.
// Each three-color run is deliberately close in hue and value.
export const PALETTE=[
  ['night 196','#141024'],
  ['grass light 57','#78a858'],['grass 63','#387434'],['grass dark 69','#005804'],
  ['dirt light 35','#945c38'],['dirt 36','#84502c'],['dirt dark 37','#704024'],
  ['stone dark 190','#6c6c88'],['stone 189','#7c7c98'],['stone light 188','#9494ac'],
  ['neutral light 241','#c8c8c8'],['neutral 242','#b8b8b8'],['neutral dark 243','#989898'],
  ['red light 141','#dc302c'],['red 142','#cc1c18'],['red dark 143','#b81414'],
  ['blue light 93','#50a4fc'],['blue 94','#5088fc'],['blue dark 95','#506cfc'],
  ['gold light 220','#d4c420'],['gold 221','#ccb010'],['gold dark 222','#bc980c'],
  ['purple light 124','#b800e0'],['purple 125','#9800b0'],['purple dark 126','#800090'],
  ['teal light 71','#34ac74'],['teal 72','#109c68'],['teal dark 73','#0c8c58'],
  ['water light 92','#50c4fc'],['water 93','#50a4fc'],['water dark 94','#5088fc'],
  ['snow light 239','#ececec'],['snow 183','#e0e0e0'],['snow shadow 240','#d8d8d8'],
  ['mud light','#7c503c'],['mud','#603c2c'],['mud dark','#502024'],
  ['sand light','#d0a854'],['sand','#c09448'],['sand dark','#b4883c'],
  ['clay light','#cc7860'],['clay','#b46054'],['clay dark','#a04c44'],
  ['peat light','#505050'],['peat','#404040'],['peat dark','#242424'],
  ['dry grass light','#a8b85c'],['dry grass','#889844'],['dry grass dark','#687c38'],
  ['alpine light','#90bc68'],['alpine','#78a858'],['alpine dark','#60984c'],
  ['lichen light','#d8e0b0'],['lichen','#a8cc78'],['lichen dark','#78a858'],
  ['granite light','#a4a4b8'],['granite','#9494ac'],['granite dark','#7c7c98'],
  ['marble light','#ececec'],['marble','#d8d8d8'],['marble dark','#b8b8b8'],
  ['quartz light','#d8d8fc'],['quartz','#bcbcf4'],['quartz dark','#9ca0d4'],
  ['slate light','#585874'],['slate','#444460'],['slate dark','#343450'],
  ['basalt light','#505050'],['basalt','#343434'],['basalt dark','#242424'],
  ['limestone light','#d8d8d8'],['limestone','#c8c8c8'],['limestone dark','#a8a8a8'],
  ['gravel light','#949494'],['gravel','#747474'],['gravel dark','#545454'],
  ['bark light','#744c44'],['bark','#643c34'],['bark dark','#543028'],
  ['wood light','#c09448'],['wood','#a46c1c'],['wood dark','#8c6024'],
  ['leaf light','#28b810'],['leaf','#10ac00'],['leaf dark','#008800'],
  ['flower light','#e078f0'],['flower','#d82cfc'],['flower dark','#b800e0']
];
// Complete official Myara palette. The curated material shades above remain at
// stable indices; every source swatch follows and is available to the picker.
export const OFFICIAL_MYARA_HEX=`000000,f4c8af,e8a888,cc896a,af6946,7d503c,553028,f0e8e8,141870,ea8aa6,994c4c,a800a8,00a8a8,00a800,54fc54,fcfc54,fc5454,a85400,a80000,54fcfc,5050fc,0000a8,545454,a8a8a8,fce0d0,fcd4bc,fcc8a8,f8bc94,f0b088,dca474,d09464,d08c54,c48454,b4784c,a46c40,945c38,84502c,704024,5c301c,381c10,d0fcc0,bcf0a0,98ec5c,80dc64,50d444,3cc428,28b810,10ac00,049800,008800,007800,006804,005804,004808,003c04,002c08,d8e0b0,c4e08c,a8cc78,90bc68,78a858,60984c,4c843c,387434,286428,d0fcd0,a8fcbc,7cf8a8,6ce8a4,54d48c,4cbc80,34ac74,109c68,0c8c58,087c4c,a4fcec,58fce8,40f0d4,38e0d0,28d0d0,28c0c4,1cacb4,149ca8,0c8898,04707c,005468,002c4c,000c30,bcfcf4,98fcfc,50ecfc,48dcfc,50c4fc,50a4fc,5088fc,506cfc,383cdc,2028c8,0c10b8,000480,000458,000430,d8d8fc,ccccfc,bcbcf4,acb4e0,9ca0d4,8890cc,7c80c4,6468b4,5054a4,3c4094,2c3088,e0d0fc,d4bcfc,cca4fc,bc90fc,b86cfc,f4e0fc,ecccfc,f0b4fc,f094fc,e078f0,d82cfc,b800e0,9800b0,800090,680880,50086c,3c0c58,fcdc50,fcb84c,fc9448,fc7838,f8cccc,f4acac,f89494,fc8080,fc6c6c,fc5858,f04844,dc302c,cc1c18,b81414,9c0c0c,881830,7c1838,6c1034,500c10,1c0414,994c4c,994c63,e8a888,d89470,c48464,b47858,98684c,885c40,7c503c,603c2c,e49074,cc7860,b46054,a04c44,843838,682c2c,502024,f0e8e8,e0d8d8,d0c8c8,c4b8b8,b4acac,a89c9c,988c8c,8c8080,7c7474,6c6868,605858,504c4c,404040,343434,242424,181818,e0e0e0,d0d0d8,c0c4d0,b4b8c8,a4a4b8,9494ac,7c7c98,6c6c88,585874,444460,343450,24243c,18182c,141024,cca8a8,b89898,ac8884,98746c,886058,744c44,643c34,543028,3c2018,28140c,482414,281408,180804,000c00,fce8c0,fcdc90,f4cc78,e4bc68,d0a854,c09448,b4883c,f0ec44,e0d830,d4c420,ccb010,bc980c,a4840c,907408,7c6408,685004,fcc864,fcb42c,eca424,dc941c,cc8818,bc7c14,a46c1c,8c6024,604424,483824,34281c,001804,ececec,d8d8d8,c8c8c8,b8b8b8,989898,848484,747474,646464,444444,141884,141870,0c1458,040c38,04082c,040820,040818,305030,243c24,7074bc,585cac`;
function naturalPaletteName(hex,index){
  const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16),max=Math.max(r,g,b),min=Math.min(r,g,b),light=(max+min)/510,sat=max===min?0:(max-min)/(255-Math.abs(max+min-255));
  let hue=0;if(max!==min){if(max===r)hue=((g-b)/(max-min)+6)%6;else if(max===g)hue=(b-r)/(max-min)+2;else hue=(r-g)/(max-min)+4;hue*=60;}
  const shade=light>.86?'Pearl':light>.72?'Pale':light>.56?'Sunlit':light>.38?'Weathered':light>.22?'Deep':'Midnight';
  const family=sat<.10?(hue>330||hue<20?'Ash':'Stone'):hue<18?'Madder':hue<42?'Ochre':hue<68?'Gilt':hue<105?'Moss':hue<155?'Verdant':hue<190?'Patina':hue<220?'Aegean':hue<255?'Lapis':hue<290?'Iris':hue<330?'Tyrian':'Rose';
  return `${shade} ${family} ${String(index).padStart(3,'0')}`;
}
OFFICIAL_MYARA_HEX.split(',').forEach((hex,i)=>PALETTE.push([naturalPaletteName(hex,i),'#'+hex]));

export const MATERIAL_NAMES=['air','meadow_grass','brown_earth','fieldstone','builder_stone','red','blue','gold','purple','teal','meltwater','peak_snow','velvet_moss','mere_mud','sunwash_sand','ochre_clay','black_peat','summer_straw','reed_grass','alpine_turf','silver_lichen','storm_granite','moon_marble','star_quartz','blue_slate','night_basalt','old_limestone','river_gravel','ironbark','amberwood','greenleaf','foxglove'];
export const DEFAULT_MATERIAL_SLOTS=[
  [0,0,0],[2,1,3],[5,4,6],[8,9,7],[11,10,12],
  [14,13,15],[17,16,18],[20,19,21],[23,22,24],[26,25,27],[29,28,30],
  [32,31,33],[2,1,3],
  [35,34,36],[38,37,39],[41,40,42],[44,43,45],[47,46,48],[83,82,84],[50,49,51],
  [53,52,54],[56,55,57],[59,58,60],[62,61,63],[65,64,66],[68,67,69],
  [71,70,72],[74,73,75],[77,76,78],[80,79,81],[83,82,84],[86,85,87]
];
// strength, pattern scale in voxels, softness. Stone is deliberately broad and
// blurred; decorative colors retain crisp, granular microvoxel texture.
export const DEFAULT_MATERIAL_PARAMS=[
  [0,1,0],[0.30,1.25,0.02],[0.25,2.5,0.16],[0.38,6.5,0.90],[0.12,8,0.78],
  [0.18,1,0],[0.16,1,0],[0.16,1.25,0.04],[0.18,1,0],[0.18,1.5,0.08],[0.12,7,0.88],
  [0.12,5,0.70],[0.25,2.25,.30],
  [.14,5,.72],[.12,7,.86],[.18,5,.66],[.10,8,.92],[.18,3,.46],[.30,1.6,.18],
  [.24,3.5,.66],[.20,4,.78],[.22,7,.92],[.12,9,.94],[.24,6,.86],[.21,7,.88],
  [.24,4,.82],[.18,5,.88],[.23,3,.44],[.16,5,.72],[.17,4,.76],[.16,4,.66],[.18,2,.28]
];
export const DEFAULT_MATERIAL_MODES=[0,2,3,2,2,1,1,1,1,1,2,2,2,2,2,3,2,2,2,2,4,6,5,5,3,4,4,6,3,3,4,1];

// Mutable live material state, edited by the Material Designer, console
// commands, and portable properties IDs; consumed by the renderer each frame.
export const materialState = {
  slots: DEFAULT_MATERIAL_SLOTS.map(v=>v.slice()),
  params: DEFAULT_MATERIAL_PARAMS.map(v=>v.slice()),
  modes: DEFAULT_MATERIAL_MODES.slice(),
  selected: MAT_PLATFORM
};

export const paletteRGB=new Uint8Array(PALETTE.flatMap(([,hex])=>[
  parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)
]));
export const materialSlotData=new Int32Array(MATERIAL_NAMES.length*3);
export const materialParamData=new Float32Array(MATERIAL_NAMES.length*3);
export const materialModeData=new Int32Array(MATERIAL_NAMES.length);
export function syncMaterialSlots(){
  materialState.slots.forEach((slots,id)=>materialSlotData.set(slots,id*3));
  materialState.params.forEach((params,id)=>materialParamData.set(params,id*3));
  materialModeData.set(materialState.modes);
}

export function materialPropertiesId(id){
  const p=materialState.params[id],slots=materialState.slots[id],bytes=[0xd3,id,slots[0]>>8,slots[0]&255,slots[1]>>8,slots[1]&255,slots[2]>>8,slots[2]&255,Math.round(p[0]*255),Math.round((p[1]-1)/11*255),Math.round(p[2]*255),materialState.modes[id]];
  return '0x'+bytes.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('').toUpperCase();
}
// Parses and applies a portable material properties ID. Returns the material
// ID that was updated; throws on malformed or out-of-range input.
export function loadMaterialPropertiesId(text){
  const hex=text.trim().replace(/^0x/i,'');
  if(!/^[0-9a-f]{24}$/i.test(hex))throw new Error('ID must contain 24 hexadecimal digits.');
  const b=Array.from({length:12},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16)),slots=[b[2]*256+b[3],b[4]*256+b[5],b[6]*256+b[7]];
  if(b[0]!==0xd3||b[1]<1||b[1]>=MATERIAL_NAMES.length||slots.some(v=>v>=PALETTE.length)||b[11]>6)throw new Error('Unsupported or invalid material ID.');
  const id=b[1];materialState.slots[id]=slots;materialState.params[id]=[b[8]/255,1+b[9]/255*11,b[10]/255];materialState.modes[id]=b[11];syncMaterialSlots();
  return id;
}
