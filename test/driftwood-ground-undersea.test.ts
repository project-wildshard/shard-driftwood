// DRIFTWOOD-FPS DF9 (mini-driftwood13j): the sea floor under 1.6 m of water draws as coarse fans, with no cracks.
import { describe, expect, it } from 'vitest';
import { UNDERSEA, underseaBlocks, underseaIndex } from '../src/generators/facetedGround';

const res = 33, n = res - 1, none = { x0: 0, x1: 0, z0: 0, z1: 0 };
// a flat sea floor 3 m down on the left half, then a beach climbing out of the sea (1.6 m deep at x = 18.8)
const hs = Float32Array.from({ length: res * res }, (_, i) => { const x = i % res; return x < 16 ? -3 : -3 + (x - 16) * 0.5; });
const flat = new Float32Array(res * res).fill(1);
const grid = (): number[] => {
  const idx: number[] = [];
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
    const a = iz * res + ix, b = a + 1, c = a + res, d = c + 1;
    idx.push(...((ix + iz) & 1 ? [a, c, d, a, d, b] : [a, c, b, b, c, d]));
  }
  return idx;
};
const deep = underseaBlocks(hs, flat, res, 0, none), idx = underseaIndex(grid(), deep, res);
const area = (t: number): number => {
  const p = [0, 1, 2].map(k => idx[t + k] ?? 0).map(v => [v % res, Math.floor(v / res)] as const);
  const [a, b, c] = p as [readonly [number, number], readonly [number, number], readonly [number, number]];
  return ((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1])) / 2;
};

describe('the undersea ground (DF9)', () => {
  it('coarsens only blocks that are deep everywhere', () => {
    const nb = n / UNDERSEA.block;
    for (let bz = 0; bz < nb; bz++) for (let bx = 0; bx < nb; bx++) expect(deep[bz * nb + bx]).toBe((bx + 1) * UNDERSEA.block <= 16 + (3 - UNDERSEA.depth) / 0.5 ? 1 : 0);
  });
  it('covers the same ground, every triangle facing up', () => {
    let sum = 0;
    for (let t = 0; t < idx.length; t += 3) { const a = area(t); expect(a).toBeGreaterThan(0); sum += a; }
    expect(sum).toBe(n * n);
    expect(idx.length / 3).toBeLessThan(n * n * 2 * 0.7);
  });
  it('leaves no crack: every inner edge is shared by two triangles', () => {
    const edges = new Map<string, number>();
    for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
      const a = idx[t + k] ?? 0, b = idx[t + (k + 1) % 3] ?? 0, key = a < b ? `${String(a)}-${String(b)}` : `${String(b)}-${String(a)}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
    const border = (v: number): boolean => { const x = v % res, z = Math.floor(v / res); return x === 0 || z === 0 || x === n || z === n; };
    for (const [key, count] of edges) {
      const [a, b] = key.split('-').map(Number) as [number, number];
      const onBorder = border(a) && border(b) && ((a % res === b % res && (a % res === 0 || a % res === n)) || (Math.floor(a / res) === Math.floor(b / res) && (Math.floor(a / res) === 0 || Math.floor(a / res) === n)));
      expect(count, key).toBe(onBorder ? 1 : 2);
    }
  });
});
