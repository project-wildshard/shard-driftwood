import {installPortableMath} from '@wildshard/engine/core/portableMath';
import {retainRestoredWalkBodies} from '@wildshard/engine/test/headless/ropeBodies';
import { prepareNativeCoinRecipe } from './native-coin-recipe';
import * as v from 'valibot';
import type { PrepareHeadlessRuntime } from '@wildshard/engine/host/headlessRuntime';

/** The ordinary native continuation plus the original coin/shop owners. */
export const prepareHeadlessRuntime: PrepareHeadlessRuntime = async preparation => {
  installPortableMath();
  const {prepareFolderPlan: prepareProductPlan} = await import('@wildshard/engine/test/headless-native');
  const plan = await prepareProductPlan(preparation);
  const { installNativeEconomy } = await import('./native-hosts/loot/nativeEconomy');
  const { installCoinModel } = await import('@wildshard/engine/game/loot/coinModel');
  const coinGeometry = await prepareNativeCoinRecipe();
  const nativeQuest = v.parse(v.object({step:v.string()}),
    await preparation.product.json('server/quest-policy.json'));
  const trader = v.parse(v.object({ view: v.object({ closeDistance: v.pipe(v.number(), v.finite(), v.minValue(Number.MIN_VALUE)) }) }),
    await preparation.product.json('quests/stall.json'));
  const creatures = preparation.product.section('actors/creatures').creatures;
  const species = new Map(preparation.product.section('actors/species').rows.species.map(row => [row.id, row.kind]));
  const roster = creatures.spawns.map(row => {
    const kind = species.get(row.species);
    if (kind === undefined) throw new Error(`Trade spawn ${row.id} has no admitted species`);
    const herd = /^driftwood\.herd\.(\d+)$/u.exec(row.group ?? '')?.[1];
    return { id: row.id, kind, herd: herd === undefined ? -1 : Number(herd) };
  });
  return { ...plan, install: (host, context) => {
    plan.install(host, context);
    if(context.restoring)retainRestoredWalkBodies(host);
    installCoinModel(coinGeometry);
    const bodies = () => roster.map(({ id, kind, herd }) => ({ kind, herd, actor: host.entities.get(id) }));
    installNativeEconomy(host, preparation.product, bodies, nativeQuest.step, trader.view.closeDistance);
  } };
};
