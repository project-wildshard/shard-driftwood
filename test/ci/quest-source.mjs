// Independent original author leaves, never a copied product snapshot.
import {parseShardfileField} from '@wildshard/format/shardSchema';
import {DRIFTWOOD_QUESTS} from '../../src/shards/driftwood-isle/generators/quests.ts';
import {DRIFTWOOD_FEATS} from '../../src/shards/driftwood-isle/generators/questInventory.ts';
export function questSource(slug){return parseShardfileField('quests',{...DRIFTWOOD_QUESTS,achievements:DRIFTWOOD_FEATS});}
