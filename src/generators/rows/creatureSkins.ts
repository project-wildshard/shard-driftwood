// ONE-FORMAT OF27d: the island's six creature kinds as `platform.skin` looks. Driftwood has no rigged GLBs, and crab,
// monkey, sailor and captain fit no kit skeleton chain map, so OF27a's `hullCreature` cannot fit them. Each (kind, variant)
// body the page lofted (creatureBodies.ts, the same bake the hull book packed) becomes a skin GLB with its own bones and
// smooth weights (sharddev `skinnedGlb`, `creatureSkin`), drawn by the toon family over its vertex colours. Its clips are
// sampled from the island's pose programs (crabClips.ts, humanoidClips.ts, monkeyClips.ts): idle on the clock, walk on
// the gait phase, attack on its progress, hit and die from their trigger. Boar and bear keep the kit quadruped's bones, so
// they say `skeleton: 'quadruped'` and the engine's gait poses them as the hull book did. The sailor's and the captain's
// eyes are their own primitive on a glowing look material; the captain wears his painted coat as a painterly map.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { readSourceModel, skinnedGlb } from '@wildshard/sharddev/bake/skinned';
import { creatureSkin, type CreatureRig } from '@wildshard/sharddev/scene/creature';
import { encodeCanonicalJson, hashImmutableBytes } from '@wildshard/sharddev/immutable';
import { parseGlb } from '@wildshard/format/shardfileAssets';
import { parseSkinFile, skinFileDependencies } from '@wildshard/format/skinAssets';
import type { ShardRows } from '@wildshard/format/rows';
import type { Shardfile } from '@wildshard/format/shardSchema';
import type { ProjectGenerationContext } from '@wildshard/sharddev/projectGeneration';
import { bakeCaptainBody, bakeCreatureBodies, faceHeadOf, type BakedCreatureBody } from '../creatureBodies';
import { CREATURE_BODY_INPUTS } from '../creatureBodyBank';
import { CRAB_CLIPS } from '../crabClips';
import { CAPTAIN_CLIPS, SAILOR_CLIPS } from '../humanoidClips';
import { MONKEY_CLIPS } from '../monkeyClips';

type PoseRows = typeof CRAB_CLIPS;
type Program = PoseRows['programs'][number];
type Look = ShardRows['looks'][number];
type ShardFileRow = Shardfile['files'][number];
type Frame = Readonly<Record<string, number>>;

/** The look row each kind's species body names (declaredRoster.ts, declaredCaptain.ts). */
export const creatureLookId = (kind: string): string => `driftwood.look.${kind}`;

/** One kind's pose programs (base, then overlays reading the base's joints), the states its `stateIndex` counts, its
 *  memory as the page's look rows set it (`standMem`) and its walking speed. */
interface PoseKind { readonly rows: readonly PoseRows[]; readonly states: readonly string[]; readonly mem: Frame; readonly walk: number }
const POSES: Readonly<Record<string, PoseKind>> = {
  crab: { rows: [CRAB_CLIPS], states: CRAB_CLIPS.states, mem: {}, walk: 1.5 },
  // on the ground: a perched monkey's sit is its perch brain's (a skin has no perch state)
  monkey: { rows: MONKEY_CLIPS, states: MONKEY_CLIPS[0]?.states ?? [], mem: { onGround: 1 }, walk: 1.5 },
  sailor: { rows: [SAILOR_CLIPS], states: SAILOR_CLIPS.states, mem: { init: 1, rise: 1 }, walk: 1.2 },
  captain: { rows: [CAPTAIN_CLIPS], states: CAPTAIN_CLIPS.states, mem: { init: 1, rise: 1 }, walk: 1.2 },
};
/** The quadrupeds the engine's gait poses (their bones are the kit quadruped's). */
const QUADRUPEDS: ReadonlySet<string> = new Set(['boar', 'bear']);
/** Eye glow (linear) × intensity, as the packed look rows lit the glowing body (`eyeGlow`, `eyeGlowIntensity`). */
const EYE_GLOW: Readonly<Record<string, number>> = { sailor: 1, captain: 1.4 };
const GLOW: readonly [number, number, number] = [0.2, 1, 1];
const FPS = 15;
/** a loop's last stretch blends into its first frame, so a clock-sampled idle never pops at its seam */
const SEAM = 0.4;

const srgb = (c: number): number => Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Evaluate one compiled channel program (engine `shared/game/plugin/channels.ts`'s ops) over `read`. */
function evaluate(program: Program, read: (name: string) => number): number[] {
  const inputs = program.reads.map(read), scratch: number[] = [];
  for (const node of program.nodes as readonly Record<string, unknown>[]) {
    const at = (key: string): number => scratch[node[key] as number] ?? Number.NaN, a = (): number => at('a'), b = (): number => at('b');
    let value: number;
    switch (node['op']) {
      case 'constant': value = node['value'] as number; break;
      case 'read': value = inputs[node['index'] as number] ?? Number.NaN; break;
      case 'neg': value = -a(); break;
      case 'sin': value = Math.sin(a()); break;
      case 'cos': value = Math.cos(a()); break;
      case 'sqrt': value = Math.sqrt(a()); break;
      case 'abs': value = Math.abs(a()); break;
      case 'add': value = a() + b(); break;
      case 'sub': value = a() - b(); break;
      case 'mul': value = a() * b(); break;
      case 'div': value = a() / b(); break;
      case 'mod': value = a() % b(); break;
      case 'pow': value = a() ** b(); break;
      case 'min': value = Math.min(a(), b()); break;
      case 'max': value = Math.max(a(), b()); break;
      case 'atan2': value = Math.atan2(a(), b()); break;
      case 'hypot': value = Math.hypot(a(), b()); break;
      case 'hypot3': value = Math.hypot(a(), b(), at('c')); break;
      case 'gt': value = Number(a() > b()); break;
      case 'select': value = at('test') !== 0 ? at('yes') : at('no'); break;
      default: throw new Error(`creature pose ${program.id}: op ${String(node['op'])}`);
    }
    scratch.push(value);
  }
  return scratch;
}

/** The bone a program's `joint.<a>.<b>` target names (crabClips.ts wrote `clawL_arm` as `joint.clawL.arm`). */
const boneOf = (target: string): string => target.replace(/^joint\./u, '').replaceAll('.', '_');

interface Pose { readonly rotation: Map<string, [number, number, number]>; readonly position: Map<string, [number, number, number]> }
/** Every bone's pose for one frame of state: base programs, then overlays reading the base's joints. */
function poseAt(kind: PoseKind, rows: readonly PoseRows[], rest: ReadonlyMap<string, readonly [number, number, number]>, frame: Frame): Pose {
  const pose: Pose = { rotation: new Map(), position: new Map() };
  const rotation = (bone: string): [number, number, number] => { let r = pose.rotation.get(bone); if (r === undefined) { r = [0, 0, 0]; pose.rotation.set(bone, r); } return r; };
  const position = (bone: string): [number, number, number] => {
    let p = pose.position.get(bone);
    if (p === undefined) { const at = rest.get(bone); if (at === undefined) throw new Error(`creature pose: no bone ${bone}`); p = [at[0], at[1], at[2]]; pose.position.set(bone, p); }
    return p;
  };
  const axis = { x: 0, y: 1, z: 2 } as const;
  for (const row of rows) {
    const scalars = new Map(row.scalars.map(scalar => [scalar.name, scalar] as const));
    const field = (path: readonly string[]): number | undefined => {
      const key = path.join('.'), value = frame[key];
      return value ?? (path[0] === 'mem' ? kind.mem[path[1] ?? ''] : undefined);
    };
    const read = (name: string): number => {
      const [space = '', ...rest_] = name.split('.');
      if (space === 'frame') return field(rest_) ?? Number.NaN;
      if (space === 'look') return 0;
      if (space === 'scalars') {
        const scalar = scalars.get(rest_.join('.')); if (scalar === undefined) throw new Error(`creature pose: scalar ${name}`);
        return field(scalar.path) ?? scalar.fallback ?? Number.NaN;
      }
      if (space === 'read' && rest_[0] === 'joint') {
        const property = rest_.at(-2), component = rest_.at(-1) as keyof typeof axis, bone = boneOf(rest_.slice(0, -2).join('.'));
        return (property === 'rotation' ? rotation(bone) : position(bone))[axis[component]];
      }
      throw new Error(`creature pose: input ${name}`);
    };
    for (const program of row.programs) {
      const values = evaluate(program, read), outputs = program.numeric.outputs;
      for (const channel of program.channels) {
        const output = outputs.find(out => out.property === channel.property); if (output === undefined) continue;
        const value = values[channel.value]; if (value === undefined || !Number.isFinite(value)) throw new Error(`creature pose ${program.id}: no value`);
        const [kindOf, component] = output.path as [string, keyof typeof axis], bone = boneOf(output.target);
        (kindOf === 'rotation' ? rotation(bone) : position(bone))[axis[component]] = value;
      }
    }
  }
  return pose;
}

interface ClipSpec { readonly name: string; readonly duration: number; readonly loop: boolean; readonly frame: (s: number) => Frame }
function clipSpecs(kind: PoseKind, bodyY: number): ClipSpec[] {
  const base = { seed: 0.37, speed: 0, strafe: 0, phase: 0, attack: -1, brace: 0, flinch: 0, deathT: -1, stateIndex: -1, 'dims.bodyY': bodyY };
  const attackState = kind.states.indexOf('attack');
  return [
    { name: 'idle', duration: 4, loop: true, frame: s => ({ ...base, t: s }) },
    // the skin plays its walk on the gait phase (0 to 1 a stride), so one second is one stride
    { name: 'walk', duration: 1, loop: true, frame: s => ({ ...base, t: s, phase: s, speed: kind.walk }) },
    { name: 'attack', duration: 1, loop: false, frame: s => ({ ...base, t: s, attack: Math.min(s, 0.999), stateIndex: attackState, 'mem.bite': 1 }) },
    { name: 'hit', duration: 0.5, loop: false, frame: s => ({ ...base, t: s, flinch: Math.max(0, 1 - s / 0.5) }) },
    { name: 'die', duration: 1.5, loop: false, frame: s => ({ ...base, t: s, deathT: s }) },
  ];
}

/** Sample the kind's pose programs into keyframed clips (`<bone>.quaternion`, and `.position` where a program moves one). */
function sampledClips(kindName: string, body: BakedCreatureBody): THREE.AnimationClip[] {
  const kind = POSES[kindName]; if (kind === undefined) return [];
  const rest = new Map(body.bones.map(bone => {
    const parent = body.bones.find(other => other.name === bone.parent);
    return [bone.name, parent === undefined ? bone.pos : [bone.pos[0] - parent.pos[0], bone.pos[1] - parent.pos[1], bone.pos[2] - parent.pos[2]] as const] as const;
  }));
  const euler = new THREE.Euler(), q = new THREE.Quaternion(), other = new THREE.Quaternion();
  return clipSpecs(kind, body.dims.bodyY).map(spec => {
    const steps = Math.round(spec.duration * FPS), times = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * spec.duration);
    const poses = times.map(s => {
      const now = poseAt(kind, kind.rows, rest, spec.frame(s));
      if (!spec.loop || s < spec.duration - SEAM) return now;
      // blend toward the frame a loop earlier, so the last frame is the first
      const w = (s - (spec.duration - SEAM)) / SEAM, before = poseAt(kind, kind.rows, rest, spec.frame(s - spec.duration));
      return { now, before, w };
    });
    const bones = new Set<string>(), moved = new Set<string>();
    for (const pose of poses) for (const p of 'now' in pose ? [pose.now, pose.before] : [pose]) { for (const bone of p.rotation.keys()) bones.add(bone); for (const bone of p.position.keys()) moved.add(bone); }
    const quaternion = (p: Pose, bone: string): THREE.Quaternion => { const r = p.rotation.get(bone) ?? [0, 0, 0]; return new THREE.Quaternion().setFromEuler(euler.set(r[0], r[1], r[2])); };
    const place = (p: Pose, bone: string): readonly [number, number, number] => p.position.get(bone) ?? rest.get(bone) ?? [0, 0, 0];
    const tracks: THREE.KeyframeTrack[] = [];
    for (const bone of [...bones].sort()) {
      const values = poses.flatMap(pose => {
        if (!('now' in pose)) return quaternion(pose, bone).toArray();
        q.copy(quaternion(pose.now, bone)); other.copy(quaternion(pose.before, bone));
        return q.slerp(other, pose.w).toArray();
      });
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, values));
    }
    for (const bone of [...moved].sort()) {
      const values = poses.flatMap(pose => {
        if (!('now' in pose)) return Array.from(place(pose, bone));
        const a = place(pose.now, bone), b = place(pose.before, bone);
        return [0, 1, 2].map(i => (a[i] ?? 0) + ((b[i] ?? 0) - (a[i] ?? 0)) * pose.w);
      });
      tracks.push(new THREE.VectorKeyframeTrack(`${bone}.position`, times, values));
    }
    return new THREE.AnimationClip(spec.name, spec.duration, tracks);
  });
}

/** A body's material groups as skin parts: the toon body (fur, hard, and eyes that do not glow) and glowing eyes. */
function skinParts(name: string, body: BakedCreatureBody, keepUv: boolean): { parts: { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial; name: string }[]; glowing: boolean } {
  const glowing = EYE_GLOW[body.kind] !== undefined;
  const clean = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
    const out = g.clone();
    for (const key of Object.keys(out.attributes)) if (!['position', 'color', 'skinIndex', 'skinWeight', ...keepUv ? ['uv'] : []].includes(key)) out.deleteAttribute(key);
    return out;
  };
  const merge = (parts: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry => {
    const present = parts.filter((g): g is THREE.BufferGeometry => g !== null).map(clean);
    const g = present.length === 1 ? present[0] : mergeGeometries(present, false);
    if (g === undefined || g === null) throw new Error(`creature skin ${name}: parts differ in their channels`);
    g.computeVertexNormals();
    return g;
  };
  const material = (part: string): THREE.MeshStandardMaterial => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }); m.name = part; return m; };
  const parts = [{ geometry: merge(glowing ? [body.fur, body.hard] : [body.fur, body.hard, body.eye]), material: material('body'), name: `${name}.body` }];
  if (glowing && body.eye !== null) parts.push({ geometry: merge([body.eye]), material: material('eye'), name: `${name}.eye` });
  return { parts, glowing };
}

/** One kind's look: every variant's skin file over its own rig, the variant table, its look row and look materials. */
export interface DriftwoodCreatureSkin {
  readonly kind: string;
  readonly look: Look;
  readonly glbs: readonly Uint8Array[];
  readonly skins: readonly Uint8Array[];
  readonly table: Uint8Array;
  readonly materials: Readonly<Record<string, unknown>>;
}

/** The six kinds' skins from the baked bodies; `species` gives each kind's species id and variant ids, `coat` the
 *  captain's painted coat (a KTX2 file already in the shard file). */
export function driftwoodCreatureSkins(bodies: readonly BakedCreatureBody[], species: ReadonlyMap<string, { id: string; variants: readonly string[] }>, coat: string): DriftwoodCreatureSkin[] {
  return [...species].map(([kind, row]) => {
    const lookId = creatureLookId(kind), eyeMaterial = `${lookId}.eye`;
    const made = row.variants.map(variant => {
      const body = bodies.find(entry => entry.kind === kind && entry.variant === variant)
        ?? (kind === 'captain' ? bodies.find(entry => entry.kind === 'captain') : undefined);
      if (body === undefined) throw new Error(`creature skin ${kind}: no baked body for variant ${variant}`);
      const name = `${kind}-${variant}`, captain = kind === 'captain';
      const { parts, glowing } = skinParts(name, body, captain);
      const clips = QUADRUPEDS.has(kind) ? [] : sampledClips(kind, body);
      const glb = skinnedGlb({ name, bones: body.bones.map(bone => ({ name: bone.name, parent: bone.parent, pos: [bone.pos[0], bone.pos[1], bone.pos[2]] as const })), parts, clips, oneMesh: true }).glb;
      const rig: CreatureRig = { glb, bones: body.bones.map(bone => ({ name: bone.name, parent: bone.parent, pos: [bone.pos[0], bone.pos[1], bone.pos[2]] as const })), lamps: [], clips: clips.map(clip => clip.name) };
      const material: Record<string, unknown> = captain ? { family: 'painterly', map: coat, vertexColours: true, rim: 0.35, bands: 0.8 }
        : { family: 'toon', colour: [1, 1, 1], vertexColours: true, faceted: true };
      const skin = creatureSkin(rig, { id: row.id, family: captain ? 'pbr' : 'toon',
        binding: { loops: clips.length === 0 ? [] : ['idle', 'walk'], material, ...glowing ? { materials: { eye: eyeMaterial } } : {} } });
      return { variant, glb, skin: new TextEncoder().encode(encodeCanonicalJson(skin)) };
    });
    const head = made[0]; if (head === undefined) throw new Error(`creature skin ${kind}: a species with no variants`);
    const table = new TextEncoder().encode(encodeCanonicalJson({ version: 1, skins: Object.fromEntries(made.map(entry => [entry.variant, hashImmutableBytes(entry.skin)])) }));
    const look: Look = { id: lookId, species: row.id, recipe: 'platform.skin', material: null,
      parameters: { skin: hashImmutableBytes(head.skin), variants: hashImmutableBytes(table) }, animation: { recipe: 'platform.clips', parameters: { attackSpan: 1 } } } as Look;
    const intensity = EYE_GLOW[kind];
    const materials = intensity === undefined ? {} : { [eyeMaterial]: { family: 'pbr', colour: [1, 1, 1], vertexColours: true, roughness: 0.4, metalness: 0, envStrength: 1,
      emissive: GLOW.map(srgb), emissiveIntensity: intensity } };
    const unique = (list: Uint8Array[]): Uint8Array[] => [...new Map(list.map(bytes => [hashImmutableBytes(bytes), bytes])).values()];
    return { kind, look, glbs: unique(made.map(entry => entry.glb)), skins: unique(made.map(entry => entry.skin)), table, materials };
  });
}

/** The skins' shard-file rows (Pine's `pineSpeciesDeclaration` shape): every rig GLB, every skin file after its GLB and
 *  textures (format `skinFileDependencies`), each variant table after its skins, all library roots; and their bytes. */
export function creatureSkinFiles(skins: readonly DriftwoodCreatureSkin[]): { files: ShardFileRow[]; library: string[]; assets: Uint8Array[] } {
  const files = new Map<string, ShardFileRow>(), assets = new Map<string, Uint8Array>();
  const glb = (bytes: Uint8Array): void => {
    const hash = hashImmutableBytes(bytes); if (files.has(hash)) return;
    assets.set(hash, bytes); files.set(hash, { hash, kind: 'glb', compressed: bytes.length, ...parseGlb(bytes), dependencies: [], critical: false });
  };
  const json = (bytes: Uint8Array, dependencies: string[]): string => {
    const hash = hashImmutableBytes(bytes);
    if (!files.has(hash)) { assets.set(hash, bytes); files.set(hash, { hash, kind: 'json', compressed: bytes.length, decoded: bytes.length * 2, gpu: 0, triangles: 0, draws: 0, dependencies, critical: false }); }
    return hash;
  };
  const skinFile = (bytes: Uint8Array): string => { const { row, binding } = parseSkinFile(bytes); return json(bytes, skinFileDependencies(row, binding)); };
  for (const skin of skins) {
    for (const bytes of skin.glbs) glb(bytes);
    json(skin.table, [...new Set(skin.skins.map(skinFile))].sort());
  }
  return { files: [...files.values()], library: [...files.keys()], assets: [...assets.values()] };
}

/** The skins as the shard file declares them: look rows, file rows, library roots, look materials and the bytes. */
export interface DriftwoodSkinDeclaration {
  readonly looks: Look[];
  readonly files: ShardFileRow[];
  readonly library: string[];
  readonly materials: Record<string, unknown>;
  readonly assets: Uint8Array[];
}
/** The species each kind's look draws: its id and variant ids. */
export type SkinSpecies = ReadonlyMap<string, { readonly id: string; readonly variants: readonly string[] }>;
/** Every species row's kind, id and variants, as `driftwoodCreatureSkins` takes them. */
export function skinSpecies(rows: readonly ShardRows['species'][number][]): SkinSpecies {
  return new Map(rows.map(row => [row.kind, { id: row.id, variants: row.variants.map(variant => variant.id) }] as const));
}

/** The lofted bodies the hull book packed (creatureBodyBank.ts), from its two committed inputs. */
export async function bakedCreatureBodies(read: (url: string) => Uint8Array): Promise<BakedCreatureBody[]> {
  const head = await readSourceModel(Uint8Array.from(read(CREATURE_BODY_INPUTS.head)));
  head.gltf.scene.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  head.gltf.scene.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
  const mesh = meshes[0];
  if (mesh === undefined || meshes.length !== 1) throw new Error(`${CREATURE_BODY_INPUTS.head} must hold one mesh`);
  const captain = await readSourceModel(Uint8Array.from(read(CREATURE_BODY_INPUTS.captain)));
  return [...bakeCreatureBodies(faceHeadOf(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld))), bakeCaptainBody(captain.gltf.scene)];
}

/** The six looks, their files and materials from the baked bodies. */
export function driftwoodSkinDeclaration(bodies: readonly BakedCreatureBody[], species: SkinSpecies, coat: string): DriftwoodSkinDeclaration {
  const skins = driftwoodCreatureSkins(bodies, species, coat);
  return { looks: skins.map(skin => skin.look), ...creatureSkinFiles(skins), materials: Object.assign({}, ...skins.map(skin => skin.materials)) as Record<string, unknown> };
}

const ROWS = 'rows.json';
/** The build's skin step: baked once per input (the generation cache), every file registered as a product asset. */
export async function driftwoodCreatureSkinStep(ctx: Pick<ProjectGenerationContext, 'cached' | 'asset'>, species: SkinSpecies, coat: string): Promise<DriftwoodSkinDeclaration> {
  const out = await ctx.cached({ id: 'creature-skins', native: true, inputs: [CREATURE_BODY_INPUTS.head, CREATURE_BODY_INPUTS.captain] }, async inputs => {
    const read = (url: string): Uint8Array => { const bytes = inputs.get(url); if (bytes === undefined || bytes.byteLength === 0) throw new Error(`Missing creature skin input: ${url}`); return bytes; };
    const { assets, ...rows } = driftwoodSkinDeclaration(await bakedCreatureBodies(read), species, coat);
    return new Map([[ROWS, new TextEncoder().encode(encodeCanonicalJson(rows))], ...assets.map(bytes => [hashImmutableBytes(bytes), bytes] as const)]);
  });
  const rows = out.get(ROWS); if (rows === undefined) throw new Error('Invalid creature skin cache inventory');
  const assets = [...out].filter(([name]) => name !== ROWS).map(([name, bytes]) => {
    if (ctx.asset(bytes) !== name) throw new Error(`Creature skin asset ${name} differs`);
    return bytes;
  });
  return { ...JSON.parse(new TextDecoder().decode(rows)) as Omit<DriftwoodSkinDeclaration, 'assets'>, assets };
}
