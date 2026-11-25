// ONE-FORMAT OF27d: the island's six creature kinds draw as `platform.skin` looks over their own baked bodies.
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { Mesh } from 'three';
import { readSourceModel } from '@wildshard/sdk/bake/skinned';
import { skinLookRules, validateSkinAssets, parseSkinFile } from '@wildshard/format/skinAssets';
import { hashImmutableBytes } from '@wildshard/sdk/immutable';
import { bakeCaptainBody, bakeCreatureBodies, faceHeadOf } from '../src/generators/creatureBodies';
import { CREATURE_BODY_INPUTS } from '../src/generators/creatureBodies';
import { driftwoodDeclaredRoster } from '../src/generators/rows/declaredRoster';
import { CAPTAIN_SPECIES } from '../src/generators/declaredCaptain';
import { creatureSkinFiles, driftwoodCreatureSkins } from '../src/generators/rows/creatureSkins';
import captainCoat from '../src/data/captainCoat.json' with { type: 'json' };

const read = (url: string): Uint8Array => new Uint8Array(readFileSync(`src/static${url}`));
async function bodies() {
  const head = await readSourceModel(read(CREATURE_BODY_INPUTS.head)); head.gltf.scene.updateMatrixWorld(true);
  const meshes: Mesh[] = []; head.gltf.scene.traverse(node => { if (node instanceof Mesh) meshes.push(node); });
  const mesh = meshes[0]; if (mesh === undefined) throw new Error('no head mesh');
  const captain = await readSourceModel(read(CREATURE_BODY_INPUTS.captain));
  return [...bakeCreatureBodies(faceHeadOf(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld))), bakeCaptainBody(captain.gltf.scene)];
}

test('each of the six kinds draws from one platform.skin look row whose skins admit', async () => {
  const roster = driftwoodDeclaredRoster({} as never), all = [...roster.species, CAPTAIN_SPECIES];
  const species = new Map(all.map(row => [row.kind, { id: row.id, variants: row.variants.map(variant => variant.id) }] as const));
  const skins = driftwoodCreatureSkins(await bodies(), species, captainCoat.file.hash);
  expect(skins.map(skin => skin.kind).sort()).toEqual(['bear', 'boar', 'captain', 'crab', 'monkey', 'sailor']);
  const { files, library, assets } = creatureSkinFiles(skins);
  const looks = skins.map(skin => skin.look), materials = Object.assign({}, ...skins.map(skin => skin.materials)) as Record<string, unknown>;
  const source = { rows: { looks, species: all }, files: [...files, captainCoat.file], library: [...library, captainCoat.file.hash], look: { materials } };
  expect(skinLookRules(source as never)).toEqual([]);
  const bytes = new Map(assets.map(asset => [hashImmutableBytes(asset), asset]));
  validateSkinAssets(source as never, bytes);
  for (const skin of skins) {
    const row = all.find(entry => entry.kind === skin.kind);
    expect(skin.look.species).toBe(row?.id);
    for (const file of skin.skins) {
      const { row: rig, binding } = parseSkinFile(file);
      // the posed kinds carry their sampled clips; boar and bear take the engine's quadruped gait
      expect(rig.rig.clips).toEqual(['boar', 'bear'].includes(skin.kind) ? [] : ['idle', 'walk', 'attack', 'hit', 'die']);
      expect(binding.materials === undefined).toBe(!['sailor', 'captain'].includes(skin.kind));
    }
  }
}, 120_000);
