export const VERT_SRC = `#version 300 es
void main(){
  vec2 pos[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`;

export const FRAG_SRC = `#version 300 es
precision highp float;
precision highp usampler3D;
precision highp sampler2D;
out vec4 fragColor;

uniform vec2 uRes;
uniform vec3 uCamPos;   // in voxel-space units
uniform mat3 uCamBasis; // right, up, forward columns
uniform float uFovScale;
uniform ivec3 uGrid;
uniform ivec3 uRing;
uniform usampler3D uVoxels;
uniform float uTime;
uniform int uLightMode;
uniform float uHour;
uniform sampler2D uPaletteTex;
uniform ivec3 uMaterialSlots[32];
uniform vec3 uMaterialParams[32]; // strength, scale, blur
uniform int uMaterialModes[32];

const int MAX_STEPS = 1200;  // scaled up for larger 51 m playfield at 0.1 m resolution

vec3 sunDirection(){
  float angle=(uHour-6.0)/24.0*6.28318530718;
  return normalize(vec3(cos(angle)*0.72,sin(angle),0.36));
}

float daylightAmount(){
  return clamp(sunDirection().y*1.18+0.12,0.04,1.0);
}

float cloudHash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}
float voxelCloud(vec2 p){
  vec2 cell=floor(p),local=fract(p);
  float continent=cloudHash(floor(cell/5.0));
  float neighbor=max(max(cloudHash(floor((cell+vec2(1,0))/5.0)),cloudHash(floor((cell-vec2(1,0))/5.0))),
                     max(cloudHash(floor((cell+vec2(0,1))/5.0)),cloudHash(floor((cell-vec2(0,1))/5.0))));
  float envelope=max(continent,neighbor*0.82);
  float occupied=step(0.48,envelope)*step(0.20,cloudHash(cell));
  // One-pixel-style face bands give each distant coarse cell a voxel volume.
  float face=0.78+0.12*step(local.y,0.13)+0.10*step(0.87,local.x);
  return occupied*face;
}

vec3 skyColor(vec3 rd){
  float t = clamp(rd.y*0.5+0.5, 0.0, 1.0);
  float day=daylightAmount();
  vec3 horizon = mix(vec3(20,20,52),vec3(80,196,252),day)/255.0;
  vec3 zenith  = mix(vec3(4,8,32),vec3(80,108,252),day)/255.0;
  vec3 sunDir=sunDirection();
  float sun = pow(max(dot(rd,sunDir),0.0),300.0)*smoothstep(-0.08,0.08,sunDir.y);
  float horizonGlow = pow(1.0-abs(rd.y),5.0);
  vec3 col = mix(horizon, zenith, t);
  vec3 warm=mix(vec3(204,80,44),vec3(252,220,80),day)/255.0;
  col += warm*horizonGlow*(0.10+0.28*(1.0-day));
  col += warm*sun*1.7;
  // Coarse distant cloud voxels: two projected decks create parallax while the
  // cell field needs far fewer samples than multi-octave smooth cloud noise.
  if(rd.y>0.015){
    vec2 wind=vec2(uTime*0.010,uTime*0.004);
    vec2 cloudUV=rd.xz/(rd.y+0.10)*1.65+wind;
    float lower=voxelCloud(cloudUV);
    float upper=voxelCloud(cloudUV*0.62+vec2(11.0,-7.0)-wind*0.35);
    float body=clamp(lower*0.76+upper*0.38,0.0,0.90)*smoothstep(0.015,0.10,rd.y);
    float underside=0.35+0.65*cloudHash(floor(cloudUV));
    vec3 cloudDark=mix(vec3(68,68,96),vec3(184,184,184),day)/255.0;
    vec3 cloudLight=mix(vec3(88,88,116),vec3(236,236,236),day)/255.0;
    vec3 cloudCol=mix(cloudDark,cloudLight,0.38+0.62*underside);
    col=mix(col,cloudCol,body);
  }
  return col;
}

bool inBounds(ivec3 p){
  return all(greaterThanEqual(p, ivec3(0))) && all(lessThan(p, uGrid));
}

float getDensity(ivec3 p){
  if (!inBounds(p)) return 0.0;
  ivec3 tp = ivec3((p.x+uRing.x)%uGrid.x, p.y, (p.z+uRing.z)%uGrid.z);
  return texelFetch(uVoxels, tp, 0).r == 0u ? 0.0 : 1.0;
}

uint getMaterial(ivec3 p){
  ivec3 tp = ivec3((p.x+uRing.x)%uGrid.x, p.y, (p.z+uRing.z)%uGrid.z);
  return texelFetch(uVoxels, tp, 0).r;
}

float materialHash(ivec3 p){
  uvec3 q=uvec3(p);
  uint h=q.x*1597334677u^q.y*3812015801u^q.z*958282439u;
  h^=h>>16;h*=2246822519u;h^=h>>13;
  return float(h&65535u)/65535.0;
}

float smoothMaterialNoise(vec3 x){
  ivec3 i=ivec3(floor(x));
  vec3 f=fract(x);f=f*f*(3.0-2.0*f);
  float n000=materialHash(i),n100=materialHash(i+ivec3(1,0,0));
  float n010=materialHash(i+ivec3(0,1,0)),n110=materialHash(i+ivec3(1,1,0));
  float n001=materialHash(i+ivec3(0,0,1)),n101=materialHash(i+ivec3(1,0,1));
  float n011=materialHash(i+ivec3(0,1,1)),n111=materialHash(i+ivec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y),f.z);
}

vec3 materialColor(uint m, ivec3 p){
  int id=clamp(int(m),0,31);
  ivec3 slots=uMaterialSlots[id];
  vec3 params=uMaterialParams[id];
  float crisp=materialHash(p);
  float soft=smoothMaterialNoise(vec3(p)/max(params.y,1.0));
  float cellular=abs(smoothMaterialNoise(vec3(p)/max(params.y*.55,1.0))-.5)*2.0;
  float vein=1.0-abs(soft*2.0-1.0);
  float strata=smoothMaterialNoise(vec3(float(p.x)*.18,float(p.y)/max(params.y,1.0),float(p.z)*.18)+soft*1.7);
  int mode=uMaterialModes[id];
  float pattern=mode==0?0.5:mode==1?crisp:mode==2?soft:mode==3?strata:mode==4?cellular:mode==5?vein:mix(soft,cellular,.42);
  float n=mix(pattern,soft,params.z);
  float signedNoise=(n*2.0-1.0)*params.x;
  vec3 base=texelFetch(uPaletteTex,ivec2(slots.x,0),0).rgb;
  vec3 shade=signedNoise>=0.0?texelFetch(uPaletteTex,ivec2(slots.y,0),0).rgb:texelFetch(uPaletteTex,ivec2(slots.z,0),0).rgb;
  return mix(base,shade,abs(signedNoise));
}

void main(){
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  float aspect = uRes.x / uRes.y;
  vec3 rd = normalize(uCamBasis * vec3(uv.x*aspect*uFovScale, uv.y*uFovScale, 1.0));
  vec3 worldRd=rd;
  vec3 ro = uCamPos;

  ivec3 mapPos = ivec3(floor(ro));
  vec3 rdSafe = vec3(
    abs(rd.x) < 1e-6 ? 1e-6 : rd.x,
    abs(rd.y) < 1e-6 ? 1e-6 : rd.y,
    abs(rd.z) < 1e-6 ? 1e-6 : rd.z
  );
  vec3 deltaDist = abs(1.0 / rdSafe);
  vec3 stepDir = sign(rdSafe);
  vec3 sideDist = (stepDir * (vec3(mapPos) - ro) + (stepDir * 0.5) + 0.5) * deltaDist;

  bool hit = false;
  bool waterHit = false;
  vec3 normal = vec3(0.0);
  uint material = 0u;
  float dist = 0.0;
  float waterDist = 0.0;

  for (int i=0; i<MAX_STEPS; i++){
    if (!inBounds(mapPos)) break;
    uint m = getMaterial(mapPos);
    if(m==10u){
      if(!waterHit){waterHit=true;waterDist=dist;}
    } else if(m>0u){hit=true;material=m;break;}

    if (sideDist.x < sideDist.y){
      if (sideDist.x < sideDist.z){
        dist = sideDist.x; sideDist.x += deltaDist.x; mapPos.x += int(stepDir.x); normal = vec3(-stepDir.x,0.0,0.0);
      } else {
        dist = sideDist.z; sideDist.z += deltaDist.z; mapPos.z += int(stepDir.z); normal = vec3(0.0,0.0,-stepDir.z);
      }
    } else {
      if (sideDist.y < sideDist.z){
        dist = sideDist.y; sideDist.y += deltaDist.y; mapPos.y += int(stepDir.y); normal = vec3(0.0,-stepDir.y,0.0);
      } else {
        dist = sideDist.z; sideDist.z += deltaDist.z; mapPos.z += int(stepDir.z); normal = vec3(0.0,0.0,-stepDir.z);
      }
    }
  }

  if (!hit){
    vec3 backdrop=skyColor(worldRd);
    if(waterHit){
      float waterAlpha=mix(0.62,0.36,clamp(abs(worldRd.y),0.0,1.0));
      vec3 waterCol=materialColor(10u,mapPos);
      backdrop=mix(backdrop,waterCol,waterAlpha);
    }
    fragColor = vec4(backdrop, 1.0);
    return;
  }

  float faceLight;
  float cavity=1.0;
  vec3 shadeNormal=normal;
  if(uLightMode==0){
    // Voxlap/Voxed lightmode 0: fixed directional cube-face shading.
    if(normal.y>0.5) faceLight=1.00;
    else if(normal.y< -0.5) faceLight=0.30;
    else if(normal.x>0.5) faceLight=0.78;
    else if(normal.x< -0.5) faceLight=0.48;
    else if(normal.z>0.5) faceLight=0.66;
    else faceLight=0.40;
    faceLight=floor(faceLight*8.0+0.5)/8.0*mix(0.18,1.0,daylightAmount());
  }else{
    // Wide-radius density gradient suppresses one-voxel contour stripes and
    // produces the rounded, lumpy rock response visible in Voxlap's cave demo.
    vec3 grad=vec3(0.0);
    grad+=vec3(
      getDensity(mapPos-ivec3(1,0,0))-getDensity(mapPos+ivec3(1,0,0)),
      getDensity(mapPos-ivec3(0,1,0))-getDensity(mapPos+ivec3(0,1,0)),
      getDensity(mapPos-ivec3(0,0,1))-getDensity(mapPos+ivec3(0,0,1))
    );
    grad+=0.55*vec3(
      getDensity(mapPos-ivec3(2,0,0))-getDensity(mapPos+ivec3(2,0,0)),
      getDensity(mapPos-ivec3(0,2,0))-getDensity(mapPos+ivec3(0,2,0)),
      getDensity(mapPos-ivec3(0,0,2))-getDensity(mapPos+ivec3(0,0,2))
    );
    grad+=0.28*vec3(
      getDensity(mapPos-ivec3(4,0,0))-getDensity(mapPos+ivec3(4,0,0)),
      getDensity(mapPos-ivec3(0,4,0))-getDensity(mapPos+ivec3(0,4,0)),
      getDensity(mapPos-ivec3(0,0,4))-getDensity(mapPos+ivec3(0,0,4))
    );
    // Diagonal pairs make the kernel approximately spherical instead of
    // axis-aligned, rounding the corners that read as terraces on slopes.
    grad+=0.38*normalize(vec3(1.0,1.0,0.0))*(getDensity(mapPos-ivec3(2,2,0))-getDensity(mapPos+ivec3(2,2,0)));
    grad+=0.38*normalize(vec3(1.0,-1.0,0.0))*(getDensity(mapPos-ivec3(2,-2,0))-getDensity(mapPos+ivec3(2,-2,0)));
    grad+=0.38*normalize(vec3(1.0,0.0,1.0))*(getDensity(mapPos-ivec3(2,0,2))-getDensity(mapPos+ivec3(2,0,2)));
    grad+=0.38*normalize(vec3(1.0,0.0,-1.0))*(getDensity(mapPos-ivec3(2,0,-2))-getDensity(mapPos+ivec3(2,0,-2)));
    grad+=0.38*normalize(vec3(0.0,1.0,1.0))*(getDensity(mapPos-ivec3(0,2,2))-getDensity(mapPos+ivec3(0,2,2)));
    grad+=0.38*normalize(vec3(0.0,1.0,-1.0))*(getDensity(mapPos-ivec3(0,2,-2))-getDensity(mapPos+ivec3(0,2,-2)));
    // Wider planar diagonals smooth broad stair runs rather than only their edges.
    grad+=0.18*normalize(vec3(1.0,1.0,0.0))*(getDensity(mapPos-ivec3(4,4,0))-getDensity(mapPos+ivec3(4,4,0)));
    grad+=0.18*normalize(vec3(1.0,-1.0,0.0))*(getDensity(mapPos-ivec3(4,-4,0))-getDensity(mapPos+ivec3(4,-4,0)));
    grad+=0.18*normalize(vec3(1.0,0.0,1.0))*(getDensity(mapPos-ivec3(4,0,4))-getDensity(mapPos+ivec3(4,0,4)));
    grad+=0.18*normalize(vec3(1.0,0.0,-1.0))*(getDensity(mapPos-ivec3(4,0,-4))-getDensity(mapPos+ivec3(4,0,-4)));
    grad+=0.18*normalize(vec3(0.0,1.0,1.0))*(getDensity(mapPos-ivec3(0,4,4))-getDensity(mapPos+ivec3(0,4,4)));
    grad+=0.18*normalize(vec3(0.0,1.0,-1.0))*(getDensity(mapPos-ivec3(0,4,-4))-getDensity(mapPos+ivec3(0,4,-4)));
    // Body diagonals cover the eight voxel corners (four opposite pairs).
    grad+=0.24*normalize(vec3(1.0,1.0,1.0))*(getDensity(mapPos-ivec3(2,2,2))-getDensity(mapPos+ivec3(2,2,2)));
    grad+=0.24*normalize(vec3(1.0,1.0,-1.0))*(getDensity(mapPos-ivec3(2,2,-2))-getDensity(mapPos+ivec3(2,2,-2)));
    grad+=0.24*normalize(vec3(1.0,-1.0,1.0))*(getDensity(mapPos-ivec3(2,-2,2))-getDensity(mapPos+ivec3(2,-2,2)));
    grad+=0.24*normalize(vec3(1.0,-1.0,-1.0))*(getDensity(mapPos-ivec3(2,-2,-2))-getDensity(mapPos+ivec3(2,-2,-2)));
    shadeNormal=length(grad)>0.05?normalize(grad+normal*0.04):normal;
    vec3 lightDir=sunDirection();
    float diffuse=max(dot(shadeNormal,lightDir),0.0);
    float localOcc=(
      getDensity(mapPos+ivec3(1,0,0))+getDensity(mapPos-ivec3(1,0,0))+
      getDensity(mapPos+ivec3(0,1,0))+getDensity(mapPos-ivec3(0,1,0))+
      getDensity(mapPos+ivec3(0,0,1))+getDensity(mapPos-ivec3(0,0,1))
    )/6.0;
    cavity=1.0-localOcc*0.12;
    float day=daylightAmount();
    faceLight=(mix(0.10,0.26,day)+mix(0.14,0.74,day)*sqrt(diffuse))*cavity;
  }
  vec3 base = materialColor(material, mapPos);
  vec3 lit=base*faceLight;
  if(uLightMode==1){
    vec3 lightDir=sunDirection();
    float spec=pow(max(dot(reflect(-lightDir,shadeNormal),-worldRd),0.0),22.0)*0.16*daylightAmount();
    lit+=vec3(0.82,0.84,0.90)*spec;
  }

  float distMeters=dist*0.1;
  float fogAmt=uLightMode==0
    ? floor(clamp(distMeters/72.0,0.0,1.0)*16.0)/16.0
    : 1.0-exp(-distMeters*0.011);
  vec3 fogCol = skyColor(worldRd);
  vec3 finalCol = mix(lit, fogCol, clamp(fogAmt,0.0,1.0));

  // The ray continued through water to this solid surface; composite the first
  // water layer over it for stable order-independent semi-transparency.
  if(waterHit){
    float waterAlpha=mix(0.62,0.36,clamp(abs(worldRd.y),0.0,1.0));
    float waterFog=1.0-exp(-(waterDist*0.1)*0.024);
    vec3 waterCol=mix(materialColor(10u,mapPos),fogCol,waterFog);
    finalCol=mix(finalCol,waterCol,waterAlpha);
  }

  fragColor = vec4(finalCol, 1.0);
}`;
