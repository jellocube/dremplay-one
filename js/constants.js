//////////////////////////////////////////////////////////////////////////
// CHUNKED VOXEL WORLD (streaming ready)
//////////////////////////////////////////////////////////////////////////
export const VS = 0.1;                        // 0.1 m horizontal microvoxels
export const VY = 0.1;                        // true isotropic voxels: no world-wide vertical terracing
export const CHUNK_SIZE = 32;                 // voxels per chunk (good balance for upload + traversal)
export const LOADED_CHUNKS_XZ = 24;           // 768 voxels loaded in X/Z (~76.8 m), 9x original area
export const LOADED_CHUNKS_Y = 7;             // 224 isotropic cells: 22.4 m tall, including 6.4 m underground
export const PREFETCH_MARGIN = 10;             // predictive cache grown during play
export const BOOT_PREFETCH_MARGIN = 0;         // boot the complete resident ring; prefetch follows immediately
export const MINIMUM_BOOT_PRELOAD_MS = 60000;

export const LOADED_SIZE_X = LOADED_CHUNKS_XZ * CHUNK_SIZE;
export const LOADED_SIZE_Y = LOADED_CHUNKS_Y * CHUNK_SIZE;
export const LOADED_SIZE_Z = LOADED_CHUNKS_XZ * CHUNK_SIZE;
export const FULL_UPLOAD_BYTES = LOADED_SIZE_X * LOADED_SIZE_Y * LOADED_SIZE_Z;

export const MAT_AIR=0, MAT_GRASS=1, MAT_DIRT=2, MAT_STONE=3, MAT_PLATFORM=4, MAT_WATER=10, MAT_SNOW=11, MAT_MOSS=12;
export const MAT_MUD=13, MAT_SAND=14, MAT_CLAY=15, MAT_PEAT=16, MAT_DRY_GRASS=17, MAT_TALL_GRASS=18;
export const MAT_ALPINE_GRASS=19, MAT_LICHEN=20, MAT_GRANITE=21, MAT_MARBLE=22, MAT_QUARTZ=23;
export const MAT_SLATE=24, MAT_BASALT=25, MAT_LIMESTONE=26, MAT_GRAVEL=27, MAT_BARK=28, MAT_WOOD=29;
export const MAT_LEAVES=30, MAT_FLOWER=31;
export const WATER_LEVEL = 40;                 // 4 m valley pool datum
export const SNOW_LINE = 112;                  // 56 m; wind/slope modify this locally

//////////////////////////////////////////////////////////////////////////
// PLAYER
//////////////////////////////////////////////////////////////////////////
export const PLAYER_R = 0.30, PLAYER_H = 1.50, EYE_H = 1.38, CRAWL_EYE_H = .62;
