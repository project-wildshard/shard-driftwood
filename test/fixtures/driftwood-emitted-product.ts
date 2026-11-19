import { loadHeadlessFolder } from '@wildshard/engine/host/headlessFolder';
import { builtProduct } from './builtProduct';

let pending: ReturnType<typeof loadHeadlessFolder> | undefined;

/** Use the normal build's complete verified output. Never invoke an author
 * program or admit a stale product as a test fallback. */
export function driftwoodEmittedProduct(): ReturnType<typeof loadHeadlessFolder> {
  pending ??= Promise.resolve().then(() => loadHeadlessFolder(builtProduct('driftwood-isle')));
  return pending;
}
