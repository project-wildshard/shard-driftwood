import { FIGURE_CATALOGUE } from '../../src/generators/figureCatalogue';
import { driftwoodQuestFigures } from '../../src/generators/questFigures';
import { driftwoodKitFigureCards } from '../../src/generators/kitFigureCards';
import { driftwoodCatalogueEconomy } from '../../src/generators/catalogueEconomy';
import { TRADER_STALL } from '../../src/generators/questShop';
import { hashImmutableBytes } from '@wildshard/format/immutable';

/** Complete original figure/card and trade-policy wires before contextual product assembly. */
export function driftwoodFigureCommerceObservation() {
  const rows = { figures: FIGURE_CATALOGUE, quest: driftwoodQuestFigures(), cards: driftwoodKitFigureCards(),
    economy: driftwoodCatalogueEconomy(), trader: TRADER_STALL };
  return Object.entries(rows).map(([name, row]) => { const bytes = new TextEncoder().encode(JSON.stringify(row));
    return { name, bytes: bytes.length, hash: hashImmutableBytes(bytes) }; });
}
