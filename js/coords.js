import { CHUNK_SIZE } from './constants.js';

export function chunkKey(cx, cy, cz) { return `${cx},${cy},${cz}`; }

export function worldToChunk(wx, wy, wz) {
  return {
    cx: Math.floor(wx / CHUNK_SIZE),
    cy: Math.floor(wy / CHUNK_SIZE),
    cz: Math.floor(wz / CHUNK_SIZE)
  };
}

export function mod(n, m) { return ((n % m) + m) % m; }
