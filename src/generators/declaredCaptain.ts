// ONE-FORMAT OF22c2: the Drowned Captain as rows. He was the mixed population's reserved body (engine `spawnCaptain`) under
// the native wake shell; now he is a declared spawn at the shrine's pool with a `boss` encounter on him. The chapter's wake
// row already names his spawn (`quests/wake-boss.json`), so the engine (OF22c1) summons this fight on the altar's wake cue:
// he waits out of the world until then (`start: 'spawned'`), his fall files `dead:captain`, and his decision row
// (`sim/scripts`, `driftwood.captain.decision`) is bound to this encounter. His blows skip the fight cap (`capExempt`), so
// the manifest's `fight.capExempt` kinds and the page's runtime boss spawn go.
import { speciesProgramToRows, type ConvertedSpecies } from '@wildshard/sdk/species/toRows';
import { bakeSpecies } from '@wildshard/kit/bake/species';
import encounter from '../data/bossEncounter.json' with { type: 'json' };
import { CAPTAIN_BODY, CAPTAIN_BRAIN } from './captainDecision';
import { DRIFTWOOD_ENEMY_STRIKES, ENEMY_SPECIES_METADATA } from './enemySpecies';
import { driftwoodGroundSampler } from './groundSampling';
import { driftwoodPhysics } from './physics';

/** His spawn, his encounter and his decision row's actor share this id. */
export const CAPTAIN_ID = 'driftwood.captain';
/** The encounter keeps the wake shell's id, which his decision row binds. */
export const CAPTAIN_FIGHT: string = encounter.id;
export const CAPTAIN_LOOK = 'driftwood.look.captain';

const physics = driftwoodPhysics() as unknown as { captain: { pool: { x: number; z: number; yaw: number }; spec: { dims: Parameters<typeof speciesProgramToRows>[1] extends ReadonlyMap<string, infer L> ? L extends { dims: infer D } ? D : never : never } } };
const pool = physics.captain.pool, ground = driftwoodGroundSampler();
const captain = { ...ENEMY_SPECIES_METADATA.captain, brain: CAPTAIN_BRAIN, body: CAPTAIN_BODY };
const program = { species: [Object.assign(bakeSpecies(captain, captain.id), { brain: CAPTAIN_BRAIN, body: CAPTAIN_BODY })], strikes: DRIFTWOOD_ENEMY_STRIKES };
/** His species, its plain strikes and his decision binding, from the species program (OF11). */
export const CAPTAIN_ROWS: ConvertedSpecies = speciesProgramToRows(program as Parameters<typeof speciesProgramToRows>[0],
  new Map([['captain', { look: CAPTAIN_LOOK, dims: physics.captain.spec.dims }]]));
const converted = CAPTAIN_ROWS.species[0];
if (converted === undefined) throw new Error('Missing declared Captain species');
// a species row's dims carry no capsule axis (the bake's spec does)
const { capsuleAxis: _axis, ...dims } = converted.dims as typeof converted.dims & { capsuleAxis?: string };
// his blows are his decision row's (`actors/strikes`, by id), so his row names no abilities and adds no plain strikes; his
// body draws his `platform.skin` look (rows/creatureSkins.ts, OF27d)
const species = { ...converted, dims } as typeof converted;
/** His species row. */
export const CAPTAIN_SPECIES: typeof species = species;

const at: [number, number, number] = [pool.x, ground(pool.x, pool.z), pool.z];
/** At the pool, no brain (his encounter's decision row moves him) and no respawn (the chapter wakes him afresh). */
export const CAPTAIN_SPAWN = { id: CAPTAIN_ID, species: species.id, variant: species.variants[0]?.id ?? 'captain', brain: null, strike: null,
  seed: 1, scale: 1, at, yaw: pool.yaw % (2 * Math.PI) };

/** A death in the fight puts the player back at the ring's edge, 18 m from the pool along his facing. */
const back = { x: pool.x + Math.sin(pool.yaw) * (encounter.arena.radius - 4), z: pool.z + Math.cos(pool.yaw) * (encounter.arena.radius - 4) };
const PHASE_NAMES = ['The Drowned Captain', 'The tide turns', 'The last stand'];
/** The wake shell's fight as a declared `boss` encounter: arena 22 at the pool, phases at full, 0.66 and 0.33. */
export const CAPTAIN_ENCOUNTER = { id: CAPTAIN_FIGHT, entity: CAPTAIN_ID, kind: 'boss' as const, panel: null, name: encounter.name, title: 'Of the Sealed Ring',
  retry: 'Again', start: 'spawned' as const, capExempt: true as const, arena: { at, radius: encounter.arena.radius }, intro: 1.7, introShort: 1.2,
  respawn: { at: [back.x, ground(back.x, back.z), back.z] as [number, number, number], yaw: pool.yaw % (2 * Math.PI) },
  phases: encounter.phases.map((phase, index) => ({ at: phase.at, name: PHASE_NAMES[index] ?? encounter.name, caption: PHASE_NAMES[index] ?? encounter.name,
    speed: 0, stopDistance: 0, turnRate: 0 })) };
