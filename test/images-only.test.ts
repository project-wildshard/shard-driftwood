// SF8c (meta standalone shardfiles, J525): Driftwood carries images only and the cook makes every KTX2. Guard: nothing the
// shard mounts, fences or pins is a KTX2 or a hand-made GPU twin, the zone's own KTX2 table is empty, and the images the
// cook encodes (giant, horizon, lightmaps, the captain's coat) are PNG.
import { expect, test } from 'vitest';
// oxlint-disable-next-line import/no-nodejs-modules -- The shard's own source files are the oracle.
import { readFileSync } from 'node:fs';
import mounts from '../src/mounts.json' with { type: 'json' };
import fence from '../src/fence-reads.json' with { type: 'json' };
import manifest from '../src/manifest.json' with { type: 'json' };
import captainCoat from '../src/data/captainCoat.json' with { type: 'json' };
import { GPU_FILES } from '../src/ktx2.generated';
import { DRIFTWOOD_BOOT_FILES } from '../src/generators/bootRecipes';
import { DRIFTWOOD_PAGE_FILES } from '../src/generators/pageFiles';

const handMade = (url: string): boolean => url.endsWith('.ktx2') || url.includes('/gpu/');
const PNG = [0x89, 0x50, 0x4e, 0x47];

test('Driftwood mounts and fences no KTX2 and no GPU twin', () => {
  const urls = [...mounts.outputs['driftwood-isle'], ...fence.files];
  expect(urls.filter(handMade)).toEqual([]);
  expect(manifest.assetGlobs.filter(glob => glob.includes('/gpu/'))).toEqual([]);
  expect(GPU_FILES).toEqual({ phone: {}, desktop: {} });
});

test('the images the cook encodes are PNG', () => {
  const giant = '/assets/driftwood-isle/baked/tex/giant.png';
  expect(mounts.outputs['driftwood-isle']).toContain(giant);
  expect(fence.files).toContain(`asset:${giant}`);
  const horizon = [manifest.horizonStrips.day, manifest.horizonStrips.night];
  const lights = Object.values(DRIFTWOOD_BOOT_FILES.lights.source.urls).flat();
  const pages = Object.values(DRIFTWOOD_PAGE_FILES).filter(row => row.kind === 'image').map(row => row.url);
  for (const url of [giant, ...horizon, ...lights, ...pages]) {
    expect(url).toMatch(/\.png$/u);
    expect([...readFileSync(new URL(`../src/static${url}`, import.meta.url)).subarray(0, 4)]).toEqual(PNG);
  }
  expect(captainCoat.file.kind).toBe('image');
  expect([...readFileSync(new URL(`../src/assets/${captainCoat.file.hash}`, import.meta.url)).subarray(0, 4)]).toEqual(PNG);
});
