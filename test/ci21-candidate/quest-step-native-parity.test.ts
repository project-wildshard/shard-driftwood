import { verifyNativeCheckpointProvenance } from '../fixtures/native-checkpoint-provenance';
import { nativeRapierFile } from '../fixtures/native-rapier-file';
import { cachedDriftwoodWitness as driftwoodWitness, retireDriftwoodWitness } from '../fixtures/driftwood-witness-cache';
import * as v from 'valibot';
import { afterAll, expect, test } from 'vitest';
// oxlint-disable-next-line import/no-nodejs-modules -- Read only admitted product and native physics bytes.
import { readFileSync } from 'node:fs';
import { loadHeadlessProduct } from '@wildshard/engine/host/headlessProduct';
import { createNativeProofResident, prepareProductPlan } from '@wildshard/engine/test/headless-native';
import { outputDescriptor } from '@wildshard/engine/game/shardfile/outputDescriptor';
import { loadRapier } from '@wildshard/engine/physics/rapier';
import legacy from '../fixtures/quest-step-legacy-saves.json' with { type: 'json' };
import type { SimValue } from '@wildshard/engine/sim';

// Both witnesses regenerate and compare the recorded gameplay checkpoint payloads before replaying an existing
// save. Their retained recorder refuses any changed flags, rewards, effects or compressed save bytes on Darwin.
const Proof = v.object({ replay: v.object({ status: v.literal('passed'), checkpointCaptured: v.literal(true),
  hash: v.string(), replayHash: v.string(), suffixTicksExecuted: v.pipe(v.number(), v.minValue(1)) }) });
const SavedValue: v.GenericSchema<unknown, SimValue> = v.lazy(() => v.union([
  v.null(), v.boolean(), v.pipe(v.number(), v.finite()), v.string(), v.array(SavedValue), v.record(v.string(), SavedValue),
]));
// Cold recording and strict replay each keep their own bounded process deadline.
/** Register one shard's unchanged ordered native compatibility cases. */
verifyNativeCheckpointProvenance();
const slug = 'driftwood-isle';
const witness = (mode: string): ReturnType<typeof driftwoodWitness> => driftwoodWitness(mode, 270_000);
  test(`${slug}: recorded native checkpoints regenerate and verify before replay`, () => {
    const result = witness('cache-verify');
    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
    expect(v.parse(v.object({ status: v.literal('generated') }), JSON.parse(result.stdout.split('\n').at(-1) ?? 'null')).status).toBe('generated');
  }, 300_000);
  test(`${slug}: recorded native quest saves restore and replay byte-identically`, () => {
    const result = witness('replay');
    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
    const proof = v.parse(Proof, JSON.parse(result.stdout.split('\n').at(-1) ?? 'null'));
    expect(proof.replay.replayHash).toBe(proof.replay.hash);
  }, 300_000);

  test(`${slug}: an existing native quest envelope retains its exact bytes`, async () => {
    const product = await loadHeadlessProduct(`out/${slug}`), descriptor = outputDescriptor(product.shardfile);
    if (descriptor === undefined) throw new Error('Missing admitted native product');
    const assets = new Map(descriptor.index.files.map(file => [file.commons === true ? `commons:${file.hash}` : file.hash,
      Uint8Array.from(readFileSync(`out/${slug}/${file.path}`))]));
    const rapier = await loadRapier(Uint8Array.from(readFileSync(nativeRapierFile)));
    const resident = await createNativeProofResident({ product, shard: product.shardfile, assets, rapier }, prepareProductPlan);
    try {
      const fixture = legacy[slug], owner = resident.host.adapters.get(fixture.adapter);
      if (owner === undefined) throw new Error('Missing existing quest save owner');
      owner.restore(v.parse(SavedValue, fixture.state));
      expect(JSON.stringify(owner.snapshot())).toBe(fixture.bytes);
      expect(resident.effects).toEqual([]);
    } finally { resident.dispose(); }
  }, 120_000);

afterAll(retireDriftwoodWitness);
