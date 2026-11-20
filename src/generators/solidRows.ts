/** ONE-FORMAT OF22a3: the bake's solids as plain prop collider rows, so no `collision` host stands them. */

/** One baked solid as `data/physicsRows.json` holds it: Rapier's shape number, its pose and contact, and its owner. */
export interface BakedSolid {
  readonly shape: number; readonly groups: number; readonly friction: number; readonly material: string; readonly owner?: string;
  readonly at: readonly number[]; readonly rot: readonly number[];
  readonly half?: readonly number[]; readonly halfHeight?: number; readonly radius?: number;
  readonly vertices?: { readonly file: string; readonly byteOffset: number; readonly byteLength: number };
}
interface Pose { x: number; y: number; z: number; yaw?: number; rot?: { x: number; y: number; z: number; w: number } }
interface Contact { surface?: string; friction?: number; groups?: number }
/** A prop collider shape, as the format admits it (shard-format 0.52.0). */
export type SolidShape = Pose & Contact & ({ kind: 'box'; hx: number; hy: number; hz: number } | { kind: 'capsule'; halfHeight: number; radius: number } | { kind: 'hull'; points: number[] });
export interface SolidRow { id: string; panel: null; initialActive: true; shapes: SolidShape[] }

/** Rapier's: the world's groups (`groups('WORLD')`) and friction, which a prop collider has when it names none. */
const WORLD_GROUPS = 131_071, WORLD_FRICTION = 0.5, ROW_SHAPES = 256, DEFAULT_SURFACE = 'wood';
/** The chunk-edge walls no world stands (GC36, J322); the landings are already `landing.<edge>` prop rows. */
const SKIPPED_MATERIALS: ReadonlySet<string> = new Set(['edge']), SKIPPED_OWNERS: ReadonlySet<string> = new Set(['piece:entry-landings',
  // the Weapon Explorer's training room (engine `practice/TrainingArena.ts`), which the page builds 900 m up, above the cell's
  // 250 m top: the capture took it, but it is the engine's room, not the island's
  'piece:practice-arena']);

/** The shortest decimal that is the same float32: Rapier keeps every pose, extent and hull point as float32, so the shorter
 *  text stands the same solid (the shard file's sections hold at most 2 MB). */
export function f32(value: number): number {
  const exact = Math.fround(value);
  for (let digits = 1; digits < 9; digits++) { const short = Number(exact.toPrecision(digits)); if (Math.fround(short) === exact) return short; }
  return Number(exact.toPrecision(9));
}
const f32s = (values: readonly number[]): number[] => values.map(f32);

function shapeOf(solid: BakedSolid, bin: Uint8Array): SolidShape {
  const [x = 0, y = 0, z = 0] = f32s(solid.at), [qx = 0, qy = 0, qz = 0, qw = 1] = solid.rot;
  // a turn about the up axis alone is a `yaw` (one JSON node, not five: the shard file holds at most 100,000)
  const pose: Pose = { x, y, z, ...(qx === 0 && qy === 0 && qz === 0 && qw === 1 ? {} : qx === 0 && qz === 0 ? { yaw: 2 * Math.atan2(qy, qw) } : { rot: { x: f32(qx), y: f32(qy), z: f32(qz), w: f32(qw) } }) };
  // `wood` is what a prop collider naming no surface is (engine `physics/pieces.ts`)
  const contact: Contact = { ...(solid.material === DEFAULT_SURFACE ? {} : { surface: solid.material }), ...(solid.friction === WORLD_FRICTION ? {} : { friction: solid.friction }), ...(solid.groups === WORLD_GROUPS ? {} : { groups: solid.groups }) };
  if (solid.shape === 1 && solid.half !== undefined) { const [hx = 0, hy = 0, hz = 0] = f32s(solid.half); return { kind: 'box', ...pose, hx, hy, hz, ...contact }; }
  if (solid.shape === 2 && solid.halfHeight !== undefined && solid.radius !== undefined) return { kind: 'capsule', ...pose, halfHeight: f32(solid.halfHeight), radius: f32(solid.radius), ...contact };
  if (solid.shape === 9 && solid.vertices !== undefined) {
    const { byteOffset, byteLength } = solid.vertices, floats = new Float32Array(bin.buffer.slice(bin.byteOffset + byteOffset, bin.byteOffset + byteOffset + byteLength));
    return { kind: 'hull', ...pose, points: f32s(Array.from(floats)), ...contact };
  }
  throw new Error(`Driftwood solid rows: unbuildable baked shape ${String(solid.shape)}`);
}

/** The prop row a baked owner's solids stand in: `piece:palms` is `piece.palms` (its colliders are tagged with this id). */
export function solidRowId(owner: string): string { return owner.replace(/^string:/u, '').replaceAll(/[:_]/gu, '.').toLowerCase(); }

/** Group the bake's solids by owner, in bake order, at most 256 shapes a row (`piece:palms` is `piece.palms`, `piece.palms.2`, ...). */
export function solidRowsFromBake(solids: readonly BakedSolid[], bin: Uint8Array): SolidRow[] {
  const owners = new Map<string, SolidShape[]>();
  for (const solid of solids) {
    if (SKIPPED_MATERIALS.has(solid.material) || solid.owner === undefined || SKIPPED_OWNERS.has(solid.owner)) continue;
    const id = solidRowId(solid.owner);
    owners.set(id, [...owners.get(id) ?? [], shapeOf(solid, bin)]);
  }
  return [...owners].flatMap(([id, shapes]) => Array.from({ length: Math.ceil(shapes.length / ROW_SHAPES) }, (_unused, index): SolidRow =>
    ({ id: index === 0 ? id : `${id}.${String(index + 1)}`, panel: null, initialActive: true, shapes: shapes.slice(index * ROW_SHAPES, (index + 1) * ROW_SHAPES) })));
}
