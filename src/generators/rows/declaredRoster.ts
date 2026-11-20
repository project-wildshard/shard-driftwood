import { speciesProgramToRows, type ConvertedSpecies } from '@wildshard/sharddev/species/toRows';
import { commonCreature } from '@wildshard/kit/creatures';
import type { ShardCreatures } from '@wildshard/format/creatures';
import type { ShardRows } from '@wildshard/format/rows';
import keeper from '../../data/nativeKeeper.json' with { type: 'json' };
import mixedPopulation from '../../data/mixedPopulation.json' with { type: 'json' };
import physicsRows from '../../data/physicsRows.json' with { type: 'json' };
import { DRIFTWOOD_ENEMY_SPECIES, DRIFTWOOD_ENEMY_STRIKES } from '../enemySpecies';
import { driftwoodGroundSampler } from '../groundSampling';
import { DRIFTWOOD_SWORDS } from '../items';
import type { DriftwoodGuestRows } from '../guestPrograms';

// ONE-FORMAT OF22b1: the island's roster as rows. The mixed population's keeper stood 34 bodies from `server/keeper.json`
// (OF22b0's path stands declared spawns on a native assembly instead): crab, monkey and sailor through
// `speciesProgramToRows` (OF11), boar and bear from the kit's `commonCreature` with the island's own hunt tuning, each keeper
// body a declared spawn under its own id, kind, variant, scale and herd, the monkeys on one perch body with the coconut
// pool, and the returns as respawn rows (OF22b3). The Captain is opus-of22e's (OF22c2, `declaredCaptain.ts`).

type Spawn = ShardCreatures['spawns'][number];
type PerchBody = NonNullable<ShardCreatures['perchBodies']>[number];
type Kind = 'crab' | 'monkey' | 'sailor' | 'boar' | 'bear';
interface KeeperBody { id: string; kind: string; variant: string; herd: number; practice: boolean; scale: number; seed: number; x: number; z: number; yaw: number }

const ROSTER_KINDS = new Set<string>(['crab', 'monkey', 'sailor']);
const program = { species: DRIFTWOOD_ENEMY_SPECIES.filter(row => ROSTER_KINDS.has(row.kind)), strikes: DRIFTWOOD_ENEMY_STRIKES };
/** The baked body dims. The monkey's and the sailor's bodies stand upright (`capsuleAxis: 'y'`), which a species row's dims
 *  cannot say yet: the format row that admits it is OF22b1's (UPRIGHT_KINDS names them). */
export const UPRIGHT_KINDS: ReadonlySet<string> = new Set((physicsRows.actors as { kind: string; spec: { dims: { capsuleAxis?: string } } }[])
  .filter(row => row.spec.dims.capsuleAxis === 'y').map(row => row.kind));
const dims = new Map((physicsRows.actors as { kind: string; spec: { dims: ShardRows['species'][number]['dims'] & { capsuleAxis?: string } } }[]).map(row => {
  const { capsuleAxis: _axis, ...size } = row.spec.dims;
  return [row.kind, size] as const;
}));
const lookOf = (kind: string): string => `driftwood.look.${kind}`;
const looks = new Map(program.species.map(row => {
  const size = dims.get(row.kind); if (size === undefined) throw new Error(`Missing baked dims for ${row.kind}`);
  return [row.kind, { look: lookOf(row.kind), dims: size }] as const;
}));
/** Crab, monkey and sailor: species with their layers, the brains they name and the plain strikes. */
const converted: ConvertedSpecies = speciesProgramToRows(program, looks);

/** The island's own hunt numbers over the kit's (the program's `hunt.tuning`: Driftwood's boars hear and see further). */
const ISLAND_HUNT_TUNING: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  boar: { hearSprint: 34, hearWalk: 18, impactAlert: 28, noticeRate: 0.65, sightCone: 1.22, sightRange: 42, sightRangeGraze: 26 },
};
function kitHunt(kind: 'boar' | 'bear') {
  const content = commonCreature(kind, { id: `driftwood.creature.${kind}`, look: lookOf(kind) });
  const tuning = ISLAND_HUNT_TUNING[kind], temperament = content.species.temperament;
  const species = tuning === undefined || temperament === undefined ? content.species
    : { ...content.species, temperament: { ...temperament, tuning: { ...temperament.tuning, ...tuning } } } as ShardRows['species'][number];
  // OF27d: the kit body's bones are the kit quadruped's, so the engine's gait poses its skin as it posed the hull book's
  const body = species.body === undefined ? undefined : { ...species.body, skeleton: 'quadruped' as const };
  return { species: body === undefined ? species : { ...species, body }, strikes: content.strikes, items: content.items };
}
const hunts = [kitHunt('boar'), kitHunt('bear')];

/** The returns (`data/ecology.json`, OF22b3): the practice crab's quick fade-in, the sailor's day return, spread and away. */
const RETURNS: Readonly<Record<Kind | 'practice', Pick<Spawn, 'respawn' | 'respawnWhen'>>> = {
  practice: { respawn: 45, respawnWhen: { away: 30, fade: 1.5 } },
  crab: { respawn: 240, respawnWhen: { spread: 120, away: 60 } },
  monkey: { respawn: 300, respawnWhen: { spread: 120, away: 60 } },
  boar: { respawn: 300, respawnWhen: { spread: 120, away: 60 } },
  bear: { respawn: 600, respawnWhen: { spread: 300, away: 60 } },
  // OF22e2: by day too, so a player who arrives after another beat him can still win the hold key (dead:sailor is per player)
  sailor: { respawn: 180, respawnWhen: { away: 60 } },
};
const PERCH_BODY = 'driftwood.perch.monkey';
/** Each body's contact strike: the crab's snap, the sailor's swing, the monkey's bite (its perch body's authority names it
 *  too); the kit hunts strike from their own species layers. */
const SPAWN_STRIKES: Readonly<Record<Kind, string | null>> = {
  crab: 'strike.crab.snap', monkey: mixedPopulation.perch.strike, sailor: 'strike.sailor.swing', boar: null, bear: null,
};
/** A herd or troop as a spawn group: herd-mates hear each other's alarm. */
const groupOf = (body: KeeperBody): string | undefined => body.herd < 0 ? undefined : `driftwood.herd.${String(body.herd)}`;
/** The keeper's seed is a unit draw; a spawn's is a 32-bit stream seed. */
const seedOf = (unit: number): number => Math.floor(unit * 0x1_0000_0000) >>> 0;

/** The roster's species rows (crab, monkey, sailor through the converter; boar and bear from the kit). */
export const ROSTER_SPECIES: ShardRows['species'] = [...converted.species, ...hunts.map(row => row.species)];
const speciesOf = (kind: string): ShardRows['species'][number] => {
  const row = ROSTER_SPECIES.find(species => species.kind === kind); if (row === undefined) throw new Error(`Missing roster species ${kind}`); return row;
};

/** The perch body every monkey climbs: the habitat's perches over their ground bases, the program's root and actions, and
 *  the coconut volley's pool and launch. */
function perchBody(returnProgram: DriftwoodGuestRows['returnProgram']): PerchBody {
  const { perches, perchBases } = physicsRows.habitat as { perches: { x: number; y: number; z: number }[]; perchBases: { x: number; y: number; z: number }[] };
  const launch = DRIFTWOOD_SWORDS.launches.coconut;
  return { id: PERCH_BODY, sites: perches.map((at, index) => {
    const base = perchBases[index]; if (base === undefined) throw new Error('Missing perch base');
    return { at: [at.x, at.y, at.z], base: [base.x, base.y, base.z] };
  }), program: returnProgram as unknown as PerchBody['program'],
  // the perch policy names the species row its bodies are (the island's said `monkey`, its kind)
  policy: { ...mixedPopulation.perch, kind: speciesOf('monkey').id } as unknown as PerchBody['policy'],
  projectile: { strike: mixedPopulation.volley.strike, launch: launch as PerchBody['projectile']['launch'], pool: keeper.volley as unknown as PerchBody['projectile']['pool'] } };
}

/** The keeper's 34 bodies as declared spawns, in keeper order, under their own ids. */
function spawns(): Spawn[] {
  const heightAt = driftwoodGroundSampler();
  return (keeper.bodies as KeeperBody[]).filter(body => body.kind !== 'captain').map(body => {
    const species = speciesOf(body.kind), brain = species.temperament?.brain ?? null, group = groupOf(body);
    const returns = body.practice ? RETURNS.practice : RETURNS[body.kind as Kind];
    const strike = SPAWN_STRIKES[body.kind as Kind];
    const row: Spawn = { id: body.id, species: species.id, variant: body.variant, brain: brain === 'hunt' || brain === 'none' ? null : brain,
      strike, seed: seedOf(body.seed), scale: body.scale, at: [body.x, heightAt(body.x, body.z), body.z], yaw: body.yaw,
      respawn: returns.respawn, respawnWhen: returns.respawnWhen };
    if (group !== undefined) row.group = group;
    if (body.kind === 'monkey') Object.assign(row, { perchBody: PERCH_BODY, home: { x: body.x, y: heightAt(body.x, body.z), z: body.z, r: 45 } });
    return row;
  });
}

/** A plain strike row's point has no `exclusive` (the crab's snap hits one target): the exact strike keeps it in the
 *  catalogue (`actors/strikes`), which the data host reads (OF11b). */
function plainShape(row: ShardRows['strikes'][number]): ShardRows['strikes'][number] {
  if (row.shape.kind !== 'point' || !('exclusive' in row.shape)) return row;
  const { exclusive: _exclusive, ...shape } = row.shape as { kind: 'point'; radius: number; exclusive?: boolean };
  return { ...row, shape };
}

export interface DriftwoodDeclaredRoster {
  readonly species: ShardRows['species'];
  readonly strikes: ShardRows['strikes'];
  readonly brains: ShardCreatures['brains'];
  readonly spawns: Spawn[];
  readonly perchBodies: PerchBody[];
  /** The kit hunts' harvest items (meat, hide, tusk; pelt, claw) for the item catalogue. */
  readonly items: ReturnType<typeof commonCreature>['items'];
  /** The program's exact creature strikes, for `actors/strikes`. */
  readonly catalogue: ConvertedSpecies['catalogue'];
}
/** The island's roster as rows; each species' body names its `platform.skin` look (creatureSkins.ts, OF27d). */
export function driftwoodDeclaredRoster(returnProgram: DriftwoodGuestRows['returnProgram']): DriftwoodDeclaredRoster {
  return { species: ROSTER_SPECIES, strikes: [...converted.strikes.map(plainShape), ...hunts.flatMap(row => row.strikes)], brains: converted.brains,
    spawns: spawns(), perchBodies: [perchBody(returnProgram)], items: hunts.flatMap(row => row.items), catalogue: converted.catalogue };
}
