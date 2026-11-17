import { expect, test } from 'vitest';
import { projectPlaceholders, bakeFarPlaceholder, colliderGrid, shardfileLook } from '@wildshard/sharddev/bake/placeholders';
import { validateShardfileAssets } from '@wildshard/format/assetAdmission';
import { hashImmutableBytes } from '@wildshard/engine/host/immutable';
import { prepareAssetDecoders } from '@wildshard/format/shardfileAssets';
import { scriptAdmissionRows } from '@wildshard/format/scriptContract';
import { outputDescriptor } from '@wildshard/engine/game/shardfile/outputDescriptor';
import { productClosureFile } from '@wildshard/engine/game/shardfile/shardProduct';
import { driftwoodEmittedProduct } from '../fixtures/driftwood-emitted-product';

async function readEmittedWorld() {
  const product = await driftwoodEmittedProduct(), shard = product.shardfile;
  const output = outputDescriptor(shard);
  if (output === undefined) throw new Error('Missing emitted Driftwood output');
  const assets = new Map<string, Uint8Array>();
  const refs = [...new Set([...shard.files.map(file => file.hash), ...shard.requires.commons.map(hash => `commons:${hash}`)])];
  // Admit every declared byte, including commons, rather than only the entry
  // ring. The ordinary build owns production; this reader never regenerates.
  for (let offset = 0; offset < refs.length; offset += 16) {
    const batch = refs.slice(offset, offset + 16);
    const bytes = await Promise.all(batch.map(hash => productClosureFile(product, hash)));
    for (const [index, hash] of batch.entries()) {
      const value = bytes[index]; if (value === undefined) throw new Error('Missing emitted asset read'); assets.set(hash, value);
    }
  }
  await prepareAssetDecoders();
  return { shard, assets, scripts: scriptAdmissionRows(output.sections) };
}
let pendingWorld: ReturnType<typeof readEmittedWorld> | undefined;
function emittedWorld(): ReturnType<typeof readEmittedWorld> { pendingWorld ??= readEmittedWorld(); return pendingWorld; }

test('admits the real generated ground, tile and library assets for the trusted world', async () => {
  const loaded = await emittedWorld();
  expect(validateShardfileAssets(loaded.shard, loaded.assets, hashImmutableBytes, undefined, undefined, loaded.scripts)).toEqual(loaded.shard);
  expect(loaded.shard.runtime?.binds).toContain('props');
  expect(loaded.shard.runtime?.binds).toContain('terrain');
});

test('refuses the CLI far bake when its actual image envelope exceeds the cap', async () => {
  const loaded = await emittedWorld();
  // SDK 5aa81bdd deliberately keeps the in-cap mesh and drops its over-cap
  // image in the CLI. The standalone bake still refuses that exact envelope.
  const terrain = loaded.shard.terrain;
  if (terrain === null) throw new Error('Missing real generated terrain');
  const bytes = loaded.assets.get(terrain.collider);
  if (bytes === undefined) throw new Error('Missing real generated collider');
  await expect(bakeFarPlaceholder(colliderGrid(bytes), shardfileLook(loaded.shard)))
    .rejects.toThrow('Far proxy exceeds content caps');
  const projectedAssets = new Map(loaded.assets);
  const projected = await projectPlaceholders(loaded.shard, projectedAssets);
  expect(projected.far).not.toBeNull();
  expect(projected.far?.impostor).toBeUndefined();
  expect((projected.far?.decoded ?? Infinity) + (projected.far?.gpu ?? Infinity)).toBeLessThanOrEqual(1_600_000);
  expect(projected.far?.compressed).toBeLessThanOrEqual(1_000_000);
  for (const hash of projected.far?.files ?? []) expect(projectedAssets.has(hash)).toBe(true);
});

test('publishes real pier parents in place of vacant L1 metadata without duplicate addresses', async () => {
  const { shard, assets } = await emittedWorld();
  if (shard.props === null) throw new Error('Missing emitted Driftwood props');
  const parents = shard.tiles.filter(tile => tile.lod === 1), models = shard.props.tiles.filter(tile => tile.lod === 1);
  expect(parents).toHaveLength(16);
  expect(new Set(parents.map(tile => `${tile.x}/${tile.z}`)).size).toBe(16);
  // the twelve fixed-world and pier parents, plus the four corners only the island's palm and boulder silhouettes
  // occupy (D200: vacant before them)
  const occupied = ['0/1', '0/2', '1/0', '1/1', '1/2', '1/3', '2/0', '2/1', '2/2', '2/3', '3/1', '3/2', '0/0', '0/3', '3/0', '3/3'].sort();
  expect(models.map(model => `${model.x}/${model.z}`).sort()).toEqual(occupied);
  expect(parents.filter(tile => tile.files.length > 0).map(tile => `${tile.x}/${tile.z}`).sort()).toEqual(occupied);
  for (const model of models) {
    const parent = parents.find(tile => tile.x === model.x && tile.z === model.z);
    expect(parent?.files).toContain(model.file);
    const bytes = assets.get(model.file);
    if (bytes === undefined) throw new Error('Missing emitted pier parent bytes');
    expect(hashImmutableBytes(bytes)).toBe(model.file);
  }
  // West and north pier parents used to be declared empty because their near
  // meshes are runtime library templates, with no static L0 geometry here.
  for (const [x, z] of [[0, 1], [0, 2], [2, 3]]) {
    expect(models.some(model => model.x === x && model.z === z)).toBe(true);
  }
});
