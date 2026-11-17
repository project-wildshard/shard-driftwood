// oxlint-disable-next-line import/no-nodejs-modules -- Read the page catalogue's exact named public bake.
import { readFile } from 'node:fs/promises';
import pickupRows from './native-coin-catalogue.json' with { type: 'json' };
import { readPickupCatalogue } from '@wildshard/engine/game/models/pickupRows';
import { prepareBinarySources, binarySourceBytes } from '@wildshard/engine/game/models/binarySource';
import { bakedGeometryBytes, readBakedGeometry } from '@wildshard/engine/game/plugin/bakedGeometry';
import type { BufferGeometry } from 'three';

/** The page's admitted shared coin bake, decoded freshly for each original seed. */
export async function prepareNativeCoinRecipe(): Promise<(seed: number) => BufferGeometry> {
  const catalogue = readPickupCatalogue(pickupRows);
  const coin = catalogue.geometries.find(row => row.key === catalogue.coin && row.seed === 0xc01);
  if (coin === undefined || !('file' in coin)) throw new Error('Missing original named coin bake');
  const files = await prepareBinarySources({ file: async name => Uint8Array.from(await readFile(new URL(`native-coin-assets${name}`, import.meta.url))) },
    [{ source: { file: coin.file }, bytes: bakedGeometryBytes(coin.geometry) }], undefined, catalogue.banks);
  const bytes = binarySourceBytes({ file: coin.file }, files);
  return seed => {
    if (seed !== coin.seed) throw new Error('Unexpected coin recipe seed');
    return readBakedGeometry(bytes, 0, coin.geometry);
  };
}
