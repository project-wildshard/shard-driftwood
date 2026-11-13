import trailCatalogue from '../../src/data/trailCatalogue.json' with { type: 'json' };
import { entryDeckSpecimen } from '../../src/generators/entryDeckSpecimen';
import { siteCatalogue } from '../../src/generators/siteCatalogue';
import { driftwoodSceneBanks } from './driftwoodSceneBanks';
import { driftwoodFoliageScenes } from '../../src/generators/foliageScenesBank';
import { driftwoodPierScenes } from '../../src/generators/pierScenesBank';

/** Driftwood's pre-admission model rows, as the retired specimen-catalogue job wrote them (boot/modelCatalogue.generated
 *  .json, GR7): the trail and entry-deck specimens, the site catalogue, the rock copies and the foliage and pier facts. */
export async function driftwoodModelCatalogue(): Promise<Readonly<Record<string, unknown>>> {
  const banks = await driftwoodSceneBanks();
  return { catalogue: [...trailCatalogue, entryDeckSpecimen()], siteCatalogue: siteCatalogue(banks), rockWorld: banks.rocks.world,
    foliage: driftwoodFoliageScenes().facts, piers: driftwoodPierScenes().facts };
}
