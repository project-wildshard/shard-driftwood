// G7: the Drowned Captain's painted coat as an admitted look texture. The page used to load the whole captain GLB at run
// time only to lend its embedded atlas to the captain's graph (species/captainMesh.ts); the atlas is now the GLB's own PNG in
// the shard file, bound by hash in data/lookGraphs.json, so the captain's look is rows. GLTF textures are not flipped.
// SF8c (J525): a shardfile carries images only; the cook makes the coat's KTX2 (a graph texture param cooks as colour).
// node --import ./src/scripts/bake-loader.mjs src/shards/driftwood-isle/bake/bake-captain-coat.mjs [--encode]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hashImmutableBytes } from '@wildshard/format/immutable';
import { assetCost } from '@wildshard/sdk/assets';
import { readImagePixels } from '@wildshard/sdk/bake/image';

const root = resolve(import.meta.dirname, '../../../..'), project = resolve(root, 'src/shards/driftwood-isle');
const pin = resolve(project, 'data/captainCoat.json');
/** the GLB's one embedded image (the atlas the captain's material samples) */
function embeddedImage(glb) {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength), jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLength))), bin = 20 + jsonLength + 8;
  if (json.images?.length !== 1) throw new Error('Captain GLB must embed exactly one image');
  const buffer = json.bufferViews[json.images[0].bufferView];
  const start = bin + (buffer.byteOffset ?? 0);
  return glb.subarray(start, start + buffer.byteLength);
}
const source = Uint8Array.from(readFileSync(resolve(root, 'public/assets/driftwood-isle/models/driftwood-hero/captain/captain.glb')));
const raster = await readImagePixels(embeddedImage(source));
if (process.argv.includes('--encode')) {
  const bytes = Uint8Array.from(embeddedImage(source)), hash = hashImmutableBytes(bytes);
  writeFileSync(resolve(project, 'assets', hash), bytes);
  const file = { hash, kind: 'image', compressed: bytes.length, ...assetCost('image', bytes), dependencies: [], critical: false };
  writeFileSync(pin, `${JSON.stringify({ source: 'public/assets/driftwood-isle/models/driftwood-hero/captain/captain.glb#images/0', width: raster.width, height: raster.height, file }, null, 2)}\n`);
}
const { file } = JSON.parse(readFileSync(pin, 'utf8'));
const bytes = Uint8Array.from(readFileSync(resolve(project, 'assets', file.hash)));
if (hashImmutableBytes(bytes) !== file.hash || bytes.length !== file.compressed) throw new Error('Captain coat pin does not match its asset');
console.info(`captain coat: ${raster.width}x${raster.height}, ${bytes.length} bytes, ${file.hash}`);
