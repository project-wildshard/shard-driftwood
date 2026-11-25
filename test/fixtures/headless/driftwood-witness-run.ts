import { nativeRapierFile } from '../native-rapier-file';
// oxlint-disable-next-line import/no-nodejs-modules -- Plain Node, not a DOM/render proxy.
import assert from 'node:assert/strict';
// oxlint-disable-next-line import/no-nodejs-modules -- Explicit proof mode and fail-closed CLI status.
import process from 'node:process';
// oxlint-disable-next-line import/no-nodejs-modules -- Fence the modules actually used by the gameplay witness.
import { registerHooks } from 'node:module';
// oxlint-disable-next-line import/no-nodejs-modules -- Read exact module/assets and write the real-run receipt.
import { readFileSync, writeFileSync } from 'node:fs';
// oxlint-disable-next-line import/no-nodejs-modules -- Content hash of executable inputs.
import { createHash } from 'node:crypto';

assert.equal(typeof document, 'undefined'); assert.equal(typeof window, 'undefined');
const ROOT = new URL('../../../', import.meta.url), loaded = new Set<string>();
writeFileSync(new URL('tmp/ci21-source/physics.json', ROOT), JSON.stringify({ sha256: createHash('sha256').update(readFileSync(nativeRapierFile)).digest('hex') }));
registerHooks({ load(url, context, next) { if (url.startsWith(ROOT.href) && !url.includes('/node_modules/')) loaded.add(url); return next(url, context); } });
const { captureNumberPathProbe } = await import('../native-number-path'); captureNumberPathProbe();
const { installPortableMath } = await import('@wildshard/sdk/internal/engine/core/portableMath'); installPortableMath();
const { installAppIdentity } = await import('@wildshard/sdk/internal/engine/app/identity');
const { WILDSHARD_IDENTITY } = await import('@wildshard/sdk/internal/engine/game/identity'); installAppIdentity(WILDSHARD_IDENTITY);
await import('../../proof/driftwood-isle/worker');
const witness = await import('../../proof/driftwood-isle/witness');
function inputFiles(): Set<string> { return new Set([...loaded, ...witness.witnessProductInputFiles(), ...['src/data/headlessAssembly.json', 'test/fixtures/headless/driftwood-witness-run.ts', 'src/scripts/sim-node-loader.mjs', 'pnpm-lock.yaml', 'tmp/ci21-source/physics.json', 'tmp/ci21-source/runtime.json', 'tmp/ci21-source/product.json'].map(path => new URL(path, ROOT).href)]); }
function inputs(): string {
  const files = inputFiles();
  const hash = createHash('sha256');
  for (const url of [...files].sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) hash.update(url.slice(ROOT.href.length)).update('\0').update(readFileSync(new URL(url))).update('\0');
  return hash.digest('hex');
}
const { generateWitness } = await import('../witness-generation');
const mode = process.argv.at(2) ?? 'all';
let checkpointResult;
if (mode !== 'fresh' && mode !== 'reef') {
  const fingerprint = inputs();
  const generated = await generateWitness({ root: ROOT, slug: 'driftwood-isle', inputs: fingerprint, files: inputFiles(),
    manifest: new URL('../../proof/driftwood-isle/checkpoints/manifest.json', import.meta.url), select: witness.setCheckpointDirectory,
    generate: async () => witness.recordGameplay(await witness.driftwoodRapier(), fingerprint),
    record: mode === 'checkpoints', forceCompare: mode === 'checkpoints' || mode === 'compare-checkpoints', compare: !['checkpoints', 'cache-record'].includes(mode) });
  if (['checkpoints', 'cache-record', 'compare-checkpoints', 'cache-verify', 'checkpoint-directory'].includes(mode)) {
    checkpointResult = { status: 'generated', inputs: fingerprint, directory: generated.directory, key: generated.key, hit: generated.hit, manifest: generated.manifest };
  }
}
const freshness = () => { const result = witness.checkpointsFresh(inputs()); if (result.status !== 'fresh') throw new Error(`Stale Driftwood checkpoints: ${JSON.stringify(result)}`); return result; };
if (checkpointResult !== undefined) console.info(JSON.stringify(checkpointResult));
else if (mode === 'fresh') { const result = witness.checkpointsFresh(inputs()); console.info(JSON.stringify(result)); process.exitCode = result.status === 'fresh' ? 0 : 1; }
else {
  // The reef starts at a real spawn; zipline resumes the recorded real spawn-to-lookout prefix.
  if (mode !== 'reef') freshness();
  const rapier = await witness.driftwoodRapier();
  /** @type {Record<string, unknown>} */
  const result: Record<string, unknown> = { slug: 'driftwood-isle', entry: witness.ENTRY, compatible: false, scope: witness.SCOPE, inputs: inputs(), open: witness.OPEN };
  if (mode === 'headless') result.headless = await witness.headlessProof(rapier);
  else if (mode === 'replay' || mode === 'replay-strict') result.replay = await witness.replayProof(rapier, mode === 'replay-strict' ? 1000 : 60);
  else if (mode === 'zipline') result.zipline = await witness.ziplineProof(rapier);
  else if (mode === 'reef') result.reef = await witness.reefProof(rapier);
  else if (mode.startsWith('slice-')) result[mode] = await witness.walkSlice(rapier, mode.slice(6));
  else if (mode === 'ledger') result.ledger = await witness.ledgerProof(rapier, 'captain');
  else if (mode.startsWith('ledger-')) result.ledger = await witness.ledgerProof(rapier, mode.slice(7));
  else if (mode === 'all' || mode === 'record') {
    result.headless = await witness.headlessProof(rapier); result.replay = await witness.replayProof(rapier);
    result.ledger = await witness.ledgerProof(rapier, 'captain');
    result.reef = await witness.reefProof(rapier);
    result.zipline = await witness.ziplineProof(rapier);
    if (mode === 'record') writeFileSync(new URL('../../proof/driftwood-isle/compatibility.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
    if (mode === 'all') process.exitCode = 1;
  } else throw new Error('Unknown Driftwood witness mode');
  console.info(JSON.stringify(result));
}
