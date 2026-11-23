/**
 * Driftwood's sea grid and sea floor, baked (SHARD-PLATFORM W2 C1/C2; they were runtime/looks/facetedOcean.ts's build,
 * moved verbatim): the one surface mesh over the chunk that coarsens out to the horizon, with its still depth (`aDepth`)
 * and per-vertex wobble seed (`aSeed`), and the sea-floor heights the graph's `tSea` reads (R). The ocean
 * bank (oceanBank.ts) runs them on the native ground at the lowered sea's level at build time (their URLs:
 * oceanFiles.ts); the runtime only loads them.
 *
 * - **grid**: `cell` metres fine over the chunk (plus 30 m), then each ring ×1.16 wider (×1.25 when the cell is over 3 m)
 *   out to 4.2 km; alternate diagonals so the facets don't all lean one way; facets wholly under dry ground are left out.
 * - **sea floor**: `SEA_RES`² half floats over the chunk, the floor height at each texel's centre.
 */
import * as THREE from 'three';
import geometryPolicy from '../data/groundGeometryPolicy.json' with { type: 'json' };
import { staticGlb } from '@wildshard/sdk/bake/glb';
import { SEA_RES } from './oceanLook';

const CHUNK_SIZE = geometryPolicy.size, CHUNK_HALF = CHUNK_SIZE / 2;
/** m of ground above the sea under all three corners of a facet that is left out (DF9) */
export const DRY_CUT = 2;

/** the ground the bake samples */
export interface OceanGround { readonly heightAt: (x: number, z: number) => number; readonly inChunk: (x: number, z: number) => boolean }
/** inside the island's chunk (the engine Heightfield's `inChunk` with no margin) */
export const inIslandChunk = (x: number, z: number): boolean => Math.abs(x) <= CHUNK_HALF && Math.abs(z) <= CHUNK_HALF;

function hash2(x: number, z: number): number { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); }

/** The sea surface grid: positions (y 0, the mesh stands at the level), `aDepth` (the level less the floor; off the chunk
 *  twice `deepDepth`), `aSeed` and the index. */
export function oceanGrid(g: OceanGround, cell: number, level: number, deepDepth: number): THREE.BufferGeometry {
  const fine = cell, inner = CHUNK_HALF + 30, far = 4200;
  const half: number[] = [];
  for (let v = 0; v <= inner + 1e-6; v += fine) half.push(v);
  let v = half[half.length - 1] ?? 0, step = fine;
  const grow = fine > 3 ? 1.25 : 1.16; // a coarse cell's far ring coarsens faster
  while (v < far) { step *= grow; v += step; half.push(v); }
  const coords = [...half.slice(1).reverse().map((c) => -c), ...half];
  const N = coords.length;
  const pos = new Float32Array(N * N * 3), depth = new Float32Array(N * N), seed = new Float32Array(N * N);
  for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
    const i = iz * N + ix, x = coords[ix] ?? 0, z = coords[iz] ?? 0;
    pos[i * 3] = x; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = z;
    depth[i] = g.inChunk(x, z) ? level - g.heightAt(x, z) : deepDepth * 2;
    seed[i] = hash2(ix, iz);
  }
  const Index = N * N <= 0x1_0000 ? Uint16Array : Uint32Array;
  const all = new Index((N - 1) * (N - 1) * 6);
  let k = 0;
  // DF9: a facet whose three corners all stand under ground at least DRY_CUT m above the sea is never seen (the island
  // hides it and the wobble is far smaller), so it is left out; 15% of the phone grid's triangles.
  const dry = (t: number): boolean => (depth[t] ?? 0) < -DRY_CUT;
  const tri = (p: number, q: number, r: number): void => { if (dry(p) && dry(q) && dry(r)) return; all[k++] = p; all[k++] = q; all[k++] = r; };
  for (let iz = 0; iz < N - 1; iz++) for (let ix = 0; ix < N - 1; ix++) {
    const a = iz * N + ix, b = a + 1, c = a + N, d = c + 1;
    // alternate diagonals so the facets don't all lean one way
    if ((ix + iz) & 1) { tri(a, c, d); tri(a, d, b); }
    else { tri(a, c, b); tri(b, c, d); }
  }
  const idx = all.slice(0, k);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

/** The grid as a static GLB (the custom channels `_DEPTH` → aDepth, `_SEED` → aSeed). */
export function oceanGridGlb(g: OceanGround, cell: number, level: number, deepDepth: number): Uint8Array {
  const geometry = oceanGrid(g, cell, level, deepDepth);
  try { return staticGlb([{ geometry, material: new THREE.MeshBasicMaterial(), castShadow: false, compactIndex: true, customAttributes: { _DEPTH: 'aDepth', _SEED: 'aSeed' } }], 'ocean'); }
  finally { geometry.dispose(); }
}

/** The sea floor's heights at each texel's centre, as half-float bits (`SEA_RES`², row by row from −z). */
export function seaFloor(g: OceanGround): Uint16Array {
  const out = new Uint16Array(SEA_RES * SEA_RES);
  for (let iz = 0; iz < SEA_RES; iz++) for (let ix = 0; ix < SEA_RES; ix++) {
    const x = -CHUNK_HALF + ((ix + 0.5) / SEA_RES) * CHUNK_SIZE, z = -CHUNK_HALF + ((iz + 0.5) / SEA_RES) * CHUNK_SIZE;
    out[iz * SEA_RES + ix] = THREE.DataUtils.toHalfFloat(g.heightAt(x, z));
  }
  return out;
}
