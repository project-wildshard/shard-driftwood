// Independent original author leaves, never a copied output snapshot.
import {parseShardfileField} from '@wildshard/format/shardSchema';
import {DRIFTWOOD_QUESTS} from '../../src/generators/quests.ts';
import {DRIFTWOOD_FEATS} from '../../src/generators/questInventory.ts';
export function questSource(slug){return parseShardfileField('quests',{...DRIFTWOOD_QUESTS,achievements:DRIFTWOOD_FEATS});}
