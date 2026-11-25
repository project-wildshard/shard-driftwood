// meta DRIFTWOOD-FPS DF9 (mini-driftwood13d): a palm's far copy really is simplified. The cove's prototypes are flat-shaded
// (no shared vertices), so before the weld every far copy was its near copy: 36 far palms drew 113k triangles at phone Low.
// mini-driftwood13g: ratio 0.15 and a 2% error bound take the far palms from ~55k to ~35k triangles at the dock (bpalm0 635 to 441).
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { islandProtos } from '../src/generators/islandProtos';

test('each LOD pair\'s far copy has at most 55% of its near copy\'s triangles, the big palms at most 20%, every triangle flat', async () => {
  const base = 'src/static/assets/models/driftwood-blender/';
  const meta = JSON.parse(readFileSync(`${base}island.json`, 'utf8')) as { protos: { name: string }[]; lod: Record<string, number> };
  const protos = await islandProtos(new Uint8Array(readFileSync(`${base}island.glb`)), meta);
  const pairs = Object.entries(meta.lod);
  expect(pairs.length).toBeGreaterThan(0);
  for (const [near, far] of pairs) {
    const n = protos[Number(near)], f = protos[far], name = meta.protos[Number(near)]?.name ?? near;
    if (n === undefined || f === undefined) throw new Error(`${name}: missing prototype`);
    const ratio = f.index.length / n.index.length;
    expect(ratio, name).toBeLessThanOrEqual(/^palm\d+$/u.test(name) && n.index.length / 3 > 2500 ? 0.2 : 0.55);
    // no two triangles share a corner: the page's flat normals stay flat
    expect(new Set(f.index).size, name).toBe(f.index.length);
    expect(f.col.length / 4, name).toBe(f.pos.length / 3);
  }
});
