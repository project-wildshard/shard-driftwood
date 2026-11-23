import type { HeadlessRuntimePreparation, HeadlessRuntimePlan } from '@wildshard/sdk/headless/host/headlessRuntime';
import { installPortableMath } from '@wildshard/sdk/internal/engine/core/portableMath';

/** The same real entry in the SDK worker, with the witness's portable transcendental math installed before its imports. */
export async function prepareHeadlessRuntime(preparation: HeadlessRuntimePreparation): Promise<HeadlessRuntimePlan> {
  installPortableMath();
  const { prepareFolderPlan } = await import('@wildshard/sdk/internal/engine/test/headless-native');
  return prepareFolderPlan(preparation);
}
