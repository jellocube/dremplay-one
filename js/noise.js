// Stable coordinate hash: terrain never changes with chunk generation order.
export function hash3(x, y, z, salt = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041) ^ salt;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Seeded gradient/value noise replaces visible sine bands. Domain warping bends
// every octave before ridged mountains and broad alluvial valleys are combined.
export function fade(t){return t*t*t*(t*(t*6-15)+10);}
export function valueNoise2(x,z,salt=0){
  const ix=Math.floor(x),iz=Math.floor(z),fx=fade(x-ix),fz=fade(z-iz);
  const a=hash3(ix,0,iz,salt),b=hash3(ix+1,0,iz,salt),c=hash3(ix,0,iz+1,salt),d=hash3(ix+1,0,iz+1,salt);
  return ((a+(b-a)*fx)*(1-fz)+(c+(d-c)*fx)*fz)*2-1;
}
export function fbm2(x,z,oct=5,lac=2,gain=.5,salt=0){let sum=0,amp=.5,norm=0;for(let i=0;i<oct;i++){sum+=valueNoise2(x,z,salt+i*101)*amp;norm+=amp;x*=lac;z*=lac;amp*=gain;}return sum/norm;}
export function ridged2(x,z,oct=5,salt=0){let sum=0,amp=.58,norm=0;for(let i=0;i<oct;i++){let n=1-Math.abs(valueNoise2(x,z,salt+i*131));n*=n;sum+=n*amp;norm+=amp;x*=2.05;z*=2.05;amp*=.49;}return sum/norm;}
export function smoothstep(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);}
export function warpedCoords(wx,wz){const qx=fbm2(wx*.0024,wz*.0024,4,2,.52,701),qz=fbm2(wx*.0024+19,wz*.0024-11,4,2,.52,907);return [wx+qx*96,wz+qz*96];}
export function terrainSample(wx,wz){
  const [x,z]=warpedCoords(wx,wz);
  // The low-frequency continental field makes valleys about five times wider.
  const continental=fbm2(x*.00135,z*.00135,5,2,.5,1103);
  const valleyMask=1-smoothstep(-.18,.34,continental); // wide flat floodplain membership
  const mountainMask=smoothstep(-.10,.42,continental);
  const ridges=ridged2(x*.0032,z*.0032,6,1301);
  const foothills=fbm2(x*.006,z*.006,4,2,.48,1409);
  const micro=fbm2(x*.027,z*.027,3,2.1,.42,1523);
  const alluvium=fbm2(x*.008,z*.008,3,2,.48,1601);
  const mountains=48+mountainMask*(20+110*Math.pow(ridges,1.42))+foothills*5+micro*1.1;
  const basinNoise=fbm2(x*.0048,z*.0048,4,2,.5,1709);
  const poolMask=valleyMask*smoothstep(.22,.58,-basinNoise);
  const poolDepth=Math.min(20,Math.max(0,Math.round(poolMask*20))); // maximum 2 m at 10 cm resolution
  const valley=42+alluvium*3.2+micro*.75-poolDepth;
  const raw=valley*(1-mountainMask)+mountains*mountainMask;
  const height=Math.max(2,Math.min(158,Math.round(raw)));
  return {height,rawHeight:Math.round(raw),valleyMask,poolMask,poolDepth,continental,ridges};
}
