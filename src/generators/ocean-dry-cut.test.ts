// DRIFTWOOD-FPS DF9 (mini-driftwood13e): the sea grid leaves out facets wholly under dry ground.
import { describe, expect, it } from 'vitest';
import { DRY_CUT, oceanGrid } from './oceanGrid';

describe('the sea grid under the island (DF9)', () => {
  // a round island 100 m across, 10 m high at its middle, the sea at 0
  const ground = { heightAt: (x: number, z: number) => 10 - Math.hypot(x, z) / 5, inChunk: () => true };
  const grid = oceanGrid(ground, 4, 0, 6), idx = grid.index?.array ?? [], depth = grid.getAttribute('aDepth').array;
  it('keeps no facet whose three corners are all dry', () => {
    for (let t = 0; t < idx.length; t += 3) {
      const dry = [idx[t] ?? 0, idx[t + 1] ?? 0, idx[t + 2] ?? 0].every(v => (depth[v] ?? 0) < -DRY_CUT);
      expect(dry).toBe(false);
    }
  });
  it('keeps every facet with a wet corner', () => {
    const n = Math.sqrt(grid.getAttribute('position').count), all = (n - 1) * (n - 1) * 2;
    expect(idx.length / 3).toBeLessThan(all);
    expect(idx.length / 3).toBeGreaterThan(all * 0.9);
  });
});
