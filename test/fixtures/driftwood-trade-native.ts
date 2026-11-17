import {installPortableMath} from '@wildshard/engine/core/portableMath';
import {retainRestoredWalkBodies} from '@wildshard/engine/test/headless/ropeBodies';
import { prepareNativeCoinRecipe } from './native-coin-recipe';
import * as v from 'valibot';
import type { PrepareHeadlessRuntime } from '@wildshard/engine/host/headlessRuntime';

/** The ordinary native continuation plus the original coin/shop owners. */
export const prepareHeadlessRuntime: PrepareHeadlessRuntime = async preparation => {
  installPortableMath();
  const {prepareProductPlan} = await import('@wildshard/engine/test/headless-native');
  const plan = await prepareProductPlan(preparation);
  const { installNativeEconomy } = await import('./native-hosts/loot/nativeEconomy');
  const { mixedPopulation } = await import('@wildshard/engine/game/population/mixedRoster');
  const { installCoinModel } = await import('@wildshard/engine/game/loot/coinModel');
  const coinGeometry = await prepareNativeCoinRecipe();
  const nativeQuest = v.parse(v.object({step:v.string(),acquisition:v.object({population:v.string()})}),
    await preparation.product.json('server/quest-policy.json'));
  const trader = v.parse(v.object({ view: v.object({ closeDistance: v.pipe(v.number(), v.finite(), v.minValue(Number.MIN_VALUE)) }) }),
    await preparation.product.json('quests/stall.json'));
  return { ...plan, install: (host, context) => {
    plan.install(host, context);
    if(context.restoring)retainRestoredWalkBodies(host);
    installCoinModel(coinGeometry);
    const population = mixedPopulation(host, nativeQuest.acquisition.population);
    installNativeEconomy(host, preparation.product, population.bodies, nativeQuest.step, trader.view.closeDistance);
  } };
};
