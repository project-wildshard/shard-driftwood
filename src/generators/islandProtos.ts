import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';
import { staticGlb } from '@wildshard/sdk/bake/glb';
import { ISLAND_LOOK } from './islandRows';
import { compactChannels } from './compactChannels';

/** The Blender cove's prototypes at build (SHARD-PLATFORM C2): read from island.glb for the facts and the cover splat,
 *  and baked for the page with each palm's far copy simplified. Reads no generated table (the facts bake imports it). */
const isMesh = (o: THREE.Object3D): o is THREE.Mesh => o instanceof THREE.Mesh;

/** a prototype as the bake holds it: world-space positions, Uint8 RGBA (alpha: its baked AO), index */
export interface IslandProto { pos: Float32Array; col: Uint8Array; index: Uint32Array }

/**
 * `p` with its triangles simplified (to `ratio` of them, never past `error` of its size), each triangle keeping vertices of
 * its own so its normal stays flat. The cove's prototypes are flat-shaded, so no two triangles share a vertex and the
 * simplifier could collapse nothing: every far copy was its near copy (a palm's 3134 triangles both ways, DF9). The
 * vertices are welded by position first; a welded vertex takes the mean colour of the corners it joins.
 */
function simplifiedProto(p: IslandProto, ratio: number, error: number): IslandProto {
  const corners = p.pos.length / 3, weld = new Map<string, number>(), welded = new Uint32Array(corners);
  for (let i = 0; i < corners; i++) {
    const key = `${String(p.pos[i * 3])},${String(p.pos[i * 3 + 1])},${String(p.pos[i * 3 + 2])}`;
    let w = weld.get(key);
    if (w === undefined) { w = weld.size; weld.set(key, w); }
    welded[i] = w;
  }
  const wpos = new Float32Array(weld.size * 3), sum = new Float64Array(weld.size * 4), count = new Uint32Array(weld.size);
  for (let i = 0; i < corners; i++) {
    const w = welded[i] ?? 0;
    wpos.set(p.pos.subarray(i * 3, i * 3 + 3), w * 3);
    for (let k = 0; k < 4; k++) sum[w * 4 + k] = (sum[w * 4 + k] ?? 0) + (p.col[i * 4 + k] ?? 0);
    count[w] = (count[w] ?? 0) + 1;
  }
  const windex = Uint32Array.from(p.index, (i) => welded[i] ?? 0);
  const [idx] = MeshoptSimplifier.simplify(windex, wpos, 3, Math.max(3, Math.floor((windex.length * ratio) / 3) * 3), error);
  const pos = new Float32Array(idx.length * 3), col = new Uint8Array(idx.length * 4), index = Uint32Array.from(idx, (_, i) => i);
  idx.forEach((w, i) => {
    pos.set(wpos.subarray(w * 3, w * 3 + 3), i * 3);
    for (let k = 0; k < 4; k++) col[i * 4 + k] = Math.round((sum[w * 4 + k] ?? 0) / (count[w] ?? 1));
  });
  return { pos, col, index };
}

/** island.glb's prototypes (world space, Uint8 colour + baked AO) by island.json's order; a `lod` pair's far copy is
 *  its near one simplified (E117: not the file's hand-made `_lo`, so a far copy keeps its near copy's shape). */
export async function islandProtos(glb: Uint8Array, meta: { protos: readonly { name: string }[]; lod?: Readonly<Record<string, number>> }): Promise<(IslandProto | undefined)[]> {
  await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(Uint8Array.from(glb).buffer, '');
  try {
    gltf.scene.updateMatrixWorld(true);
    const protoIndex = new Map(meta.protos.map((p, i) => [`${ISLAND_LOOK.protoPrefix}${p.name}`, i])), protos: (IslandProto | undefined)[] = [];
    gltf.scene.traverse((o) => {
      const pi = protoIndex.get(o.name);
      if (!isMesh(o) || pi === undefined) return;
      const p = o.geometry.getAttribute('position'), c = o.geometry.getAttribute('color'), idx = o.geometry.getIndex(), at = new THREE.Vector3();
      const pos = new Float32Array(p.count * 3), col = new Uint8Array(p.count * 4).fill(255);
      for (let i = 0; i < p.count; i++) {
        at.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).toArray(pos, i * 3);
        (c.itemSize > 3 ? [c.getX(i), c.getY(i), c.getZ(i), c.getW(i)] : [c.getX(i), c.getY(i), c.getZ(i)]).forEach((x, k) => { col[i * 4 + k] = Math.round(THREE.MathUtils.clamp(x, 0, 1) * 255); });
      }
      protos[pi] = { pos, col, index: Uint32Array.from(idx ? idx.array : Array.from({ length: p.count }, (_, i) => i)) };
    });
    for (const [near, lo] of Object.entries(meta.lod ?? {})) { const p = protos[Number(near)]; if (p !== undefined) protos[lo] = simplifiedProto(p, ISLAND_LOOK.far.ratio, ISLAND_LOOK.far.error); }
    return protos;
  } finally {
    gltf.scene.traverse(o => { if (isMesh(o)) { o.geometry.dispose(); for (const material of Array.isArray(o.material) ? o.material : [o.material]) material.dispose(); } });
  }
}

/** SHARD-PLATFORM C2: the cove's prototypes as the page draws them, one named mesh each (far copies simplified here),
 *  with their flat-shading normals (the shadows' normal bias); the page clones them, nothing is rebuilt at load. */
export async function islandProtoGlb(glb: Uint8Array, meta: { protos: readonly { name: string }[]; lod: Readonly<Record<string, number>> }): Promise<Uint8Array> {
  const protos = await islandProtos(glb, meta), material = new THREE.MeshStandardMaterial();
  return staticGlb(meta.protos.flatMap((row, i) => {
    const p = protos[i]; if (p === undefined) return [];
    // L18.3d: the colour stays its exact Uint8 + AO, the flat normals go Int8, a small prototype's index 16-bit
    const index = p.pos.length / 3 < 65536 ? Uint16Array.from(p.index) : p.index;
    const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p.pos, 3)).setAttribute('color', new THREE.BufferAttribute(p.col, 4, true)).setIndex(new THREE.BufferAttribute(index, 1));
    geometry.computeVertexNormals();
    return [{ geometry: compactChannels(geometry), material, name: row.name, compactIndex: true as const, quantizedChannels: true as const }];
  }), 'island-protos');
}
