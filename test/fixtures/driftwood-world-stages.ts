import { driftwoodWorldStages } from '../../src/generators/worldAssembly';
import { DRIFTWOOD_LAYOUTS } from './driftwood-layout-source';

/** The same defining assembly over the complete original fixed metadata. */
export const WORLD_STAGES = driftwoodWorldStages(DRIFTWOOD_LAYOUTS);
