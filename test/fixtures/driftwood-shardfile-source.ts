import { DRIFTWOOD_NAVIGATION } from './driftwood-navigation';
import { DRIFTWOOD_GUEST_ROWS } from './driftwood-guest-programs';
import { DRIFTWOOD_ISLAND_FACTS } from './driftwood-island-facts';
import fixed from './driftwood-fixed-original.json' with { type: 'json' };
import { driftwoodFixedShardfileRows } from '../../src/generators/fixedShardfile';
import { driftwoodShardfileRows } from '../../src/generators/shardfile';

import { driftwoodAudio } from '../../src/generators/audio';
import { DRIFTWOOD_LAYOUTS } from './driftwood-layout-source';
import { readFileSync } from 'node:fs';
import { bakedCreatureBodies, driftwoodSkinDeclaration, skinSpecies } from '../../src/generators/rows/creatureSkins';
import { ROSTER_SPECIES } from '../../src/generators/rows/declaredRoster';
import { CAPTAIN_SPECIES } from '../../src/generators/declaredCaptain';
import captainCoat from '../../src/data/captainCoat.json' with { type: 'json' };

// OF27d: the six kinds' skin looks, baked from the same committed bodies the build reads
const skins = driftwoodSkinDeclaration(await bakedCreatureBodies(url => new Uint8Array(readFileSync(`public${url}`))), skinSpecies([...ROSTER_SPECIES, CAPTAIN_SPECIES]), captainCoat.file.hash);

// Complete original fixed-world declaration oracle, frozen before the GR7 source cut.
const shardfile: ReturnType<typeof driftwoodShardfileRows> = driftwoodShardfileRows(driftwoodFixedShardfileRows(fixed), driftwoodAudio(DRIFTWOOD_LAYOUTS.wreck, DRIFTWOOD_ISLAND_FACTS), DRIFTWOOD_GUEST_ROWS, DRIFTWOOD_NAVIGATION, skins);
// oxlint-disable-next-line import/no-default-export -- Existing declaration-only tests borrow the original full header.
export default shardfile;
