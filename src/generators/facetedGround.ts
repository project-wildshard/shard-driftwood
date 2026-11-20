/**
 * Driftwood's faceted ground, baked (SHARD-PLATFORM W2 C2; it was runtime/looks/facetedGround.ts's grid and slab and
 * look/terrainPainter.ts's paint, moved verbatim): the level's heightfield as ONE indexed 256² grid, each vertex painted
 * from its height above the sea, its slope and whether it is a cliff's top lip (look/groundColor.ts), the sand paths over
 * the grass; and the chunk's four slab walls in rock darkening with depth. The faceted-ground bank (facetedGroundBank.ts) runs it
 * on the native ground at build time and names two static GLBs (`facetedGroundGlbs`); the runtime only loads them
 * (game/looks/toonLook.ts).
 */
import * as THREE from 'three';
import geometryPolicy from '../data/groundGeometryPolicy.json' with { type: 'json' };
import { GROUND_PATHS } from './groundLook';
import { LP, hash2, lowPolyGroundColor } from './groundColor';
import { staticGlb } from '@wildshard/sharddev/bake/glb';
import { islandClippedIndex } from './islandClips';
import ISLAND_GRID from '../data/islandClipRows.json' with { type: 'json' };

const CHUNK_SIZE = geometryPolicy.size, CHUNK_HALF = CHUNK_SIZE / 2, CHUNK_DEPTH = geometryPolicy.slabDepth, TERRAIN_RES = geometryPolicy.resolution;

/** A faceted ground's numbers as data. */
interface FacetedGroundRow {
  /** the look.materials ids the grid and the slab wear (graph toon materials the look lends before the ground builds) */
  readonly materials: { readonly ground: string; readonly slab: string };
  /** rows built per task */
  readonly band: number;
  /** a cliff's top lip: below this normal y, the highest ground within `reach` m, smoothstepped `from` → `to` m above */
  readonly lip: { readonly steep: number; readonly reach: number; readonly from: number; readonly to: number };
  /** the slab walls: segments per side, rock and deep colours, the lip above the ground (m), the bulge's base and
   *  jittered gain (m), the foot's step out (m), the bulge's depth share and the shade's base and jittered gain */
  readonly slab: {
    readonly segs: number; readonly rock: string; readonly deep: string; readonly top: number;
    readonly bulge: readonly [number, number]; readonly foot: number; readonly mid: number; readonly shade: readonly [number, number];
  };
}

/** the field the bake samples: the bound ground's heights, normals and trail distance */
export interface FacetedGroundField {
  heightAt: (x: number, z: number) => number;
  normalAt: (x: number, z: number, eps?: number) => [number, number, number];
  trailDistance: (x: number, z: number) => number;
}

/** One grid vertex as the paint reads it: height above the sea (a wall's middle height), slope (1 − normal y), where,
 *  the ground's height and the cliff-lip weight (0‥1). */
interface FacetedGroundCell { h: number; slope: number; x: number; z: number; y: number; lip: number }

const ss = THREE.MathUtils.smoothstep;
const _pathC = new THREE.Color();

/** Driftwood's paint: sand / grass / rock by height and slope, and the sand paths: trails above the beach are sand drawn
 *  over the grass (a 3 m bed with a soft edge). */
function paint(c: THREE.Color, { h, slope, x, z, y, lip }: FacetedGroundCell, f: FacetedGroundField, seaLevel: number): void {
  lowPolyGroundColor(c, h, slope, x, z, lip);
  const p = GROUND_PATHS;
  if (y - seaLevel > p.above) {
    const td = f.trailDistance(x, z);
    if (td < p.to) { _pathC.copy(LP.path).multiplyScalar(p.shade[0] + hash2(x, z) * p.shade[1]); c.lerp(_pathC, 1 - ss(td, p.from, p.to)); }
  }
}

/** The facet colour by height and slope, without paths or lips (the ground under each streamed cover plant,
 *  coverCells.ts). */
export const facetColour = (c: THREE.Color, h: number, slope: number, x: number, z: number): THREE.Color => lowPolyGroundColor(c, h, slope, x, z);

/** The painted grid: positions, Uint8 colours and the index (the last index of a triangle is its provoking vertex). */
export function facetedGrid(f: FacetedGroundField, row: FacetedGroundRow, wl: number): { pos: Float32Array; col: Uint8Array; idx: Uint16Array; deep: Uint8Array } {
  const res = TERRAIN_RES, n = res - 1, d = CHUNK_SIZE / n, lipRow = row.lip;
  const pos = new Float32Array(res * res * 3), col = new Uint8Array(res * res * 3);
  const c = new THREE.Color();
  const cell: FacetedGroundCell = { h: 0, slope: 0, x: 0, z: 0, y: 0, lip: 0 };
  const hs = new Float32Array(res * res), nys = new Float32Array(res * res);
  for (let iz = 0; iz < res; iz++) for (let ix = 0; ix < res; ix++) hs[iz * res + ix] = f.heightAt(-CHUNK_HALF + ix * d, -CHUNK_HALF + iz * d);
  const H = (ix: number, iz: number): number => hs[Math.min(n, Math.max(0, iz)) * res + Math.min(n, Math.max(0, ix))] ?? 0;
  for (let iz = 0; iz < res; iz++) {
    for (let ix = 0; ix < res; ix++) {
      const i = iz * res + ix, x = -CHUNK_HALF + ix * d, z = -CHUNK_HALF + iz * d;
      const y = H(ix, iz);
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      const [, ny] = f.normalAt(x, z, d * 0.5);
      nys[i] = ny;
      // a cliff's top edge: steep here but nothing much higher within reach, so the top paint lips over it
      let lip = 0;
      if (ny < lipRow.steep) { const r = lipRow.reach, hi = Math.max(f.heightAt(x + r, z), f.heightAt(x - r, z), f.heightAt(x, z + r), f.heightAt(x, z - r)); lip = 1 - ss(hi - y, lipRow.from, lipRow.to); }
      let h = y - wl, slope = 1 - ny;
      if (h < 0) {
        // a facet takes its provoking (last) vertex's colour: this one's facets span it and these neighbours (the index
        // pattern below). One that climbs out of the sea is a wall, not seabed: coloured at its middle height and its slope
        const top = Math.max(H(ix - 1, iz - 1), H(ix, iz - 1), H(ix - 1, iz), H(ix - 1, iz + 1), H(ix, iz + 1)) - wl;
        if (top > 0) { slope = Math.max(slope, 1 - d / Math.hypot(d, top - h)); h = (h + top) * 0.5; }
      }
      cell.h = h; cell.slope = slope; cell.x = x; cell.z = z; cell.y = y; cell.lip = lip;
      paint(c, cell, f, wl);
      // clamped: a Uint8Array wraps 256+ to ~0
      col[i * 3] = Math.min(255, Math.round(c.r * 255)); col[i * 3 + 1] = Math.min(255, Math.round(c.g * 255)); col[i * 3 + 2] = Math.min(255, Math.round(c.b * 255));
    }
  }
  const idx = new Uint16Array(n * n * 6);
  let k = 0;
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
    const a = iz * res + ix, b = a + 1, cc = a + res, dd = cc + 1;
    // alternate the diagonal per cell so the facets don't all lean the same way; the last index is the provoking vertex
    idx[k++] = a; idx[k++] = cc;
    if ((ix + iz) & 1) { idx[k++] = dd; idx[k++] = a; idx[k++] = dd; idx[k++] = b; }
    else { idx[k++] = b; idx[k++] = b; idx[k++] = cc; idx[k++] = dd; }
  }
  return { pos, col, idx, deep: underseaBlocks(hs, nys, res, wl) };
}

/** DRIFTWOOD-FPS DF9 (mini-driftwood13j): the sea floor under 1.6 m or more of water is a quarter of the grid's triangles,
 *  and the sea's Beer–Lambert body hides most of it (a 1.6 m column is over 99% opaque past ~9 m, and from 1.6 m down
 *  the paint is the flat seabed colour). So a `UNDERSEA.block`² block of cells whose every vertex is that deep, gently
 *  sloped and within `tolerance` m of a fan through its corners and centre draws as that fan: 4 triangles instead of
 *  32 when its neighbours are coarse too, with every side next to a fine block kept at full resolution (no cracks). */
export const UNDERSEA = { block: 4, depth: 1.6, tolerance: 0.1, maxSlope: 0.3 } as const;

/** The fan's height at grid offset (u, v) of a block (0‥B each): the triangle (centre, edge) the point falls in. */
function fanHeight(B: number, u: number, v: number, centre: number, c00: number, c10: number, c11: number, c01: number): number {
  const su = u / B - 0.5, sv = v / B - 0.5, t = 2 * Math.max(Math.abs(su), Math.abs(sv));
  if (t === 0) return centre;
  let e0: number, e1: number, s: number;
  if (Math.abs(sv) >= Math.abs(su)) { [e0, e1] = sv < 0 ? [c00, c10] : [c01, c11]; s = su / t + 0.5; }
  else { [e0, e1] = su > 0 ? [c10, c11] : [c00, c01]; s = sv / t + 0.5; }
  return centre + t * (e0 + (e1 - e0) * s - centre);
}

/** Which `UNDERSEA.block`² blocks (row-major over the whole blocks of the grid) draw as a coarse fan. */
export function underseaBlocks(hs: ArrayLike<number>, nys: ArrayLike<number>, res: number, wl: number, island: { x0: number; x1: number; z0: number; z1: number } = ISLAND_GRID): Uint8Array {
  const B = UNDERSEA.block, nb = Math.floor((res - 1) / B), deep = new Uint8Array(nb * nb);
  const H = (x: number, z: number): number => (hs[z * res + x] ?? 0) - wl;
  for (let bz = 0; bz < nb; bz++) for (let bx = 0; bx < nb; bx++) {
    const ax = bx * B, az = bz * B;
    if (ax < island.x1 && ax + B > island.x0 && az < island.z1 && az + B > island.z0) continue;
    const centre = H(ax + B / 2, az + B / 2), c00 = H(ax, az), c10 = H(ax + B, az), c11 = H(ax + B, az + B), c01 = H(ax, az + B);
    let ok = true;
    for (let v = 0; ok && v <= B; v++) for (let u = 0; ok && u <= B; u++) {
      const y = H(ax + u, az + v);
      if (y > -UNDERSEA.depth || 1 - (nys[(az + v) * res + ax + u] ?? 1) >= UNDERSEA.maxSlope) ok = false;
      else if (Math.abs(y - fanHeight(B, u, v, centre, c00, c10, c11, c01)) > UNDERSEA.tolerance) ok = false;
    }
    if (ok) deep[bz * nb + bx] = 1;
  }
  return deep;
}

/** The grid's index with every coarse block's cells replaced by its fan (appended after the kept cells, which keep their
 *  order and provoking vertices). Each fan triangle faces up and ends on a rim vertex, so the block keeps its rim's
 *  painted facets; a side shared with a fine block keeps all its vertices. */
export function underseaIndex(idx: ArrayLike<number>, deep: Uint8Array, res: number): Uint16Array {
  const B = UNDERSEA.block, n = res - 1, nb = Math.floor(n / B);
  const coarse = (bx: number, bz: number): boolean => bx >= 0 && bz >= 0 && bx < nb && bz < nb && deep[bz * nb + bx] === 1;
  const out: number[] = [];
  for (let t = 0; t < idx.length; t += 3) {
    const tri = [idx[t] ?? 0, idx[t + 1] ?? 0, idx[t + 2] ?? 0];
    // a fine triangle's cell is its vertices' lowest column and row
    const cx = Math.min(...tri.map(v => v % res)), cz = Math.min(...tri.map(v => Math.floor(v / res)));
    if (!coarse(Math.floor(cx / B), Math.floor(cz / B))) out.push(...tri);
  }
  const at = (x: number, z: number): number => z * res + x;
  for (let bz = 0; bz < nb; bz++) for (let bx = 0; bx < nb; bx++) {
    if (!coarse(bx, bz)) continue;
    const ax = bx * B, az = bz * B, centre = at(ax + B / 2, az + B / 2);
    // the rim, once round: each side from its first corner, every vertex where the block beside it is fine
    const rim: [number, number][] = [];
    const side = (x0: number, z0: number, dx: number, dz: number, fine: boolean): void => {
      for (let k = 0; k < B; k += fine ? 1 : B) rim.push([x0 + dx * k, z0 + dz * k]);
    };
    side(ax, az, 1, 0, !coarse(bx, bz - 1));
    side(ax + B, az, 0, 1, !coarse(bx + 1, bz));
    side(ax + B, az + B, -1, 0, !coarse(bx, bz + 1));
    side(ax, az + B, 0, -1, !coarse(bx - 1, bz));
    const cxz: [number, number] = [ax + B / 2, az + B / 2];
    for (let k = 0; k < rim.length; k++) {
      const p = rim[k] ?? cxz, q = rim[(k + 1) % rim.length] ?? cxz;
      // up-facing (the grid's own winding): (p - c) × (q - c) has y > 0 when z1·x2 − x1·z2 > 0
      const up = (p[1] - cxz[1]) * (q[0] - cxz[0]) - (p[0] - cxz[0]) * (q[1] - cxz[1]) > 0;
      if (up) out.push(centre, at(p[0], p[1]), at(q[0], q[1])); else out.push(centre, at(q[0], q[1]), at(p[0], p[1]));
    }
  }
  return Uint16Array.from(out);
}

/** The chunk's four slab walls and its bottom, rock darkening with depth, each side jittered by a fixed hash. */
export function facetedSlab(f: FacetedGroundField, row: FacetedGroundRow): { pos: Float32Array; col: Float32Array } {
  const slab = row.slab;
  const segs = slab.segs;
  const verts: number[] = [], cols: number[] = [];
  const H = CHUNK_HALF, D = -CHUNK_DEPTH;
  const sides: { a: [number, number]; b: [number, number]; n: [number, number] }[] = [
    { a: [-H, -H], b: [H, -H], n: [0, -1] }, { a: [H, -H], b: [H, H], n: [1, 0] }, { a: [H, H], b: [-H, H], n: [0, 1] }, { a: [-H, H], b: [-H, -H], n: [-1, 0] },
  ];
  const rock = new THREE.Color(slab.rock), deep = new THREE.Color(slab.deep);
  const c = new THREE.Color();
  const push = (x: number, y: number, z: number, jit: number) => {
    verts.push(x, y, z);
    c.lerpColors(rock, deep, THREE.MathUtils.clamp(-y / CHUNK_DEPTH, 0, 1)).multiplyScalar(slab.shade[0] + jit * slab.shade[1]);
    cols.push(c.r, c.g, c.b);
  };
  for (const s of sides) {
    const ring: [number, number, number][][] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t;
      const j = (Math.sin(i * 12.9898 + s.n[0] * 3) * 43758.5453) % 1; // deterministic jitter
      const bulge = slab.bulge[0] + Math.abs(j) * slab.bulge[1];
      ring.push([[x, f.heightAt(x, z) + slab.top, z], [x + s.n[0] * bulge, D * slab.mid, z + s.n[1] * bulge], [x + s.n[0] * slab.foot, D, z + s.n[1] * slab.foot]]);
    }
    for (let i = 0; i < segs; i++) for (let k = 0; k < 2; k++) {
      const ri = ring[i], rn = ring[i + 1];
      if (!(ri !== undefined && ri !== null) || !(rn !== undefined && rn !== null)) continue;
      const a0 = ri[k], a1 = ri[k + 1], b0 = rn[k], b1 = rn[k + 1];
      if (!(a0 !== undefined && a0 !== null) || !(a1 !== undefined && a1 !== null) || !(b0 !== undefined && b0 !== null) || !(b1 !== undefined && b1 !== null)) continue;
      const j = Math.abs((Math.sin(i * 7.31 + k * 3.7) * 1234.5) % 1);
      push(...a0, j); push(...b0, j); push(...a1, j);
      push(...b0, j); push(...b1, j); push(...a1, j);
    }
  }
  // bottom
  push(-H, D, -H, 0); push(H, D, H, 0); push(H, D, -H, 0); push(-H, D, -H, 0); push(-H, D, H, 0); push(H, D, H, 0);
  return { pos: Float32Array.from(verts), col: Float32Array.from(cols) };
}

/** The baked ground's two static GLBs: the grid (Uint8 colour, u16 index in the provoking order, without the baked
 *  island's cells: generators/islandClips.ts) and the slab walls. */
export function facetedGroundGlbs(f: FacetedGroundField, row: FacetedGroundRow, seaLevel: number): { ground: Uint8Array; slab: Uint8Array } {
  const grid = facetedGrid(f, row, seaLevel), walls = facetedSlab(f, row), material = new THREE.MeshStandardMaterial();
  const ground = new THREE.BufferGeometry(), slab = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.BufferAttribute(grid.pos, 3)); ground.setAttribute('color', new THREE.BufferAttribute(grid.col, 3, true));
  ground.setIndex(new THREE.BufferAttribute(underseaIndex(islandClippedIndex(grid.idx), grid.deep, TERRAIN_RES), 1));
  slab.setAttribute('position', new THREE.BufferAttribute(walls.pos, 3)); slab.setAttribute('color', new THREE.BufferAttribute(walls.col, 3));
  try {
    return { ground: staticGlb([{ geometry: ground, material, compactIndex: true }], 'driftwood-ground'), slab: staticGlb([{ geometry: slab, material }], 'driftwood-ground-slab') };
  } finally { ground.dispose(); slab.dispose(); material.dispose(); }
}
