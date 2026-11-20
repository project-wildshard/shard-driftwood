import { nativeAssemblyFiles, type NativeAssemblyPlan, type ServerBlob } from '@wildshard/sharddev/blobs';
import mixedPopulation from '../data/mixedPopulation.json' with { type: 'json' };
import nativePopulationPolicy from '../data/nativePopulationPolicy.json' with { type: 'json' };
import questKillSteps from '../data/questKillSteps.json' with { type: 'json' };
import { CRAB_CLIPS } from './crabClips';
import { ENTRY_WALK } from './entryWalk';
import { PRACTICE_AT } from './enemyPlacement';
import { CAPTAIN_CLIPS, SAILOR_CLIPS } from './humanoidClips';
import { MONKEY_CLIPS } from './monkeyClips';
import { driftwoodNativeRows } from './nativeBake';
import { DRIFTWOOD_NATIVE_QUEST } from './nativeQuest';
import { NATIVE_QUEST_PROPS } from './nativeQuestProps';
import { driftwoodPhysics } from './physics';
import { DRIFTWOOD_SPAWNS } from './spawnTables';
import { DRIFTWOOD_SPOTS } from './spots';
import solidRows from '../data/solidRows.json' with { type: 'json' };
import { solidRowId } from './solidRows';

/** ONE-FORMAT OF22a3c: a prompt that sees through its own prop (`sight.body`, the bake's owner the collision host tagged)
 *  names the prop row its collider now stands in, whose id tags it. */
const SOLID_ROW_IDS = new Set(solidRows.map(row => row.id));
function serverSpots(spots: typeof DRIFTWOOD_SPOTS): typeof DRIFTWOOD_SPOTS {
  return { ...spots, promptRegistrations: spots.promptRegistrations.map(row => {
    const body: unknown = row.sight.body;
    return typeof body === 'string' && SOLID_ROW_IDS.has(solidRowId(body)) ? { ...row, sight: { ...row.sight, body: solidRowId(body) } } : row;
  }) };
}

function declared<T>(value: T | undefined, message: string): T { if (value === undefined) throw new Error(message); return value; }

function nativeInputs() {
  return { nativeQuest: { ...DRIFTWOOD_NATIVE_QUEST,
      reward: declared(DRIFTWOOD_NATIVE_QUEST.reward, 'Missing native quest reward'),
      acquisition: declared(DRIFTWOOD_NATIVE_QUEST.acquisition, 'Missing native quest acquisition') },
    nativeQuestSpots: serverSpots(DRIFTWOOD_SPOTS),
    mixedPopulation: { ...mixedPopulation, attackTurnCap: nativePopulationPolicy.attackTurnCap,
      practice: { ...mixedPopulation.practice, at: PRACTICE_AT,
        ...DRIFTWOOD_SPAWNS.find(row => row.id === 'spawn.driftwood.practice')?.respawn },
      poses: [{ kind: 'crab', clips: [CRAB_CLIPS] },
        { kind: 'sailor', clips: [SAILOR_CLIPS], lift: [1.5, 1.5, -2.3, 6] },
        { kind: 'captain', clips: [CAPTAIN_CLIPS] }, { kind: 'monkey', clips: MONKEY_CLIPS }] },
    questProps: NATIVE_QUEST_PROPS, physics: driftwoodNativeRows(driftwoodPhysics()).physics,
    questKillSteps, entries: ENTRY_WALK };
}
/** The typed facts Driftwood's native server hosts read: its bake, roster, quest policy and entry walk. */
export const driftwoodNativeInputs: typeof nativeInputs = nativeInputs;

/** Driftwood's native assembly (P1-E3.1b, J90): its hosts in install order, as data over the files in its shard file. */
function driftwoodNativeAssembly(inputs: ReturnType<typeof nativeInputs>): NativeAssemblyPlan {
  const quest = inputs.nativeQuest;
  return { kind: 'native-assembly', level: { speed: 5, ground: { size: 500, height: 0 } }, terrain: { kind: 'bake-ground' }, navigation: 'shard',
    bake: { rows: { file: 'server/physics.json' }, reader: { label: 'Driftwood', resolution: 256, size: 500, parked: false, rig: 'axis', shapes: [1, 2, 9], provenance: 'tagged' },
      ground: 'data/physics-ground.generated.bin', colliders: ['data/physics-colliders.bin'], read: 'solids', keep: ['actors', 'herds', 'habitat', 'captain'] },
    collision: { resolution: 256 }, entries: { walk: inputs.entries },
    // ONE-FORMAT OF22a2: the day is the look's toon sky clock and the sea the declared sea row (no day or sea host)
    // ONE-FORMAT OF22b4: the island's creatures are declared rows (the shard file's `creatures`); no population host stands them
    features: [{ host: 'decisions' },
      { host: 'quest.chapter', id: quest.reward.director, rows: { file: 'quests/chapter-director.json' }, wake: { file: 'quests/wake-boss.json' }, reward: quest.reward.channels, population: quest.acquisition.population },
      { host: 'commands' },
      // ONE-FORMAT OF22d3: the swords are the held/melee section (output.ts), which the engine stands before any host
      { host: 'quest.kill-steps', rows: { file: 'server/kill-steps.json' }, counters: { file: 'quests/achievements.json' } }, { host: 'quest.body-scripts' },
      { host: 'quest.composition', table: { file: 'quests/interaction-source.json', path: ['constants', 'interact'] }, rows: { file: 'server/quest-policy.json' }, spots: { file: 'server/quest-spots.json' }, readSpots: true,
        counters: { file: 'quests/achievements.json' }, nativeFeats: true, props: { file: 'server/quest-props.json' }, restoring: true }] };
}

/** Driftwood's server class (J91): the plan and the rows it names, on no client path. */
export function driftwoodServerFiles(): ServerBlob[] {
  const inputs = driftwoodNativeInputs();
  const rows = new Map<string, unknown>([['server/physics.json', inputs.physics],
    ['server/kill-steps.json', inputs.questKillSteps], ['server/quest-policy.json', inputs.nativeQuest], ['server/quest-spots.json', inputs.nativeQuestSpots], ['server/quest-props.json', inputs.questProps]]);
  return nativeAssemblyFiles(driftwoodNativeAssembly(inputs), rows);
}
