// ONE-FORMAT OF22a3: data/solidRows.json is the bake's solids as prop rows, regenerated from the bake value for value.
// oxlint-disable-next-line import/no-nodejs-modules -- The proof reads the bake's own collider bytes.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import rows from '../data/physicsRows.json' with { type: 'json' };
import solidRows from '../data/solidRows.json' with { type: 'json' };
import { solidRowsFromBake, type BakedSolid } from './solidRows';

test('the prop solid rows are the bake\'s solids, owner by owner', () => {
  const fresh = solidRowsFromBake(rows.solids as BakedSolid[], readFileSync(new URL('../data/physics-colliders.bin', import.meta.url)));
  expect(fresh).toEqual(solidRows);
  const shapes = fresh.flatMap(row => row.shapes);
  expect(shapes.filter(shape => shape.kind === 'capsule')).toHaveLength(614);
  expect(new Set(shapes.map(shape => shape.surface ?? 'wood'))).toEqual(new Set(['wood', 'planks', 'ground', 'rock', 'stone', 'flesh']));
  // a turn about the up axis alone rides as a yaw, and the yaw stands the bake's own quaternion to Rapier's float32
  const turned = rows.solids.filter(solid => solid.rot[0] === 0 && solid.rot[2] === 0 && solid.rot[1] !== 0);
  expect(shapes.filter(shape => shape.yaw !== undefined).length).toBeGreaterThan(400);
  for (const solid of turned) {
    const yaw = 2 * Math.atan2(solid.rot[1] ?? 0, solid.rot[3] ?? 1);
    expect(Math.sin(yaw / 2)).toBeCloseTo(solid.rot[1] ?? 0, 7); expect(Math.cos(yaw / 2)).toBeCloseTo(solid.rot[3] ?? 1, 7);
  }
  expect(fresh.every(row => row.shapes.length <= 256)).toBe(true);
  // shorter text, the same float32 Rapier keeps: every box pose and extent is the bake's to the bit
  const kept = rows.solids.filter(solid => solid.material !== 'edge' && solid.owner !== undefined && solid.owner !== 'piece:entry-landings' && solid.owner !== 'piece:practice-arena');
  const boxes = shapes.filter(shape => shape.kind === 'box'), bakedBoxes = kept.filter(solid => solid.shape === 1);
  expect(boxes).toHaveLength(bakedBoxes.length);
  const bits = (values: readonly number[]): number[] => values.map(Math.fround);
  const sorted = (poses: number[][]): string => JSON.stringify(poses.map(bits).sort());
  expect(sorted(boxes.map(box => box.kind === 'box' ? [box.x, box.y, box.z, box.hx, box.hy, box.hz] : []))).toBe(sorted(bakedBoxes.map(solid => solid.at.concat(solid.half ?? []))));
});
