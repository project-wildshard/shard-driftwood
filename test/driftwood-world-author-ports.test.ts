import { expect, test } from 'vitest';
import { roadSocketMetrics } from '@wildshard/sharddev/entries';
import { CHUNK_HALF, ENTRY_WIDTH, ENTRY_ASPHALT } from '@wildshard/format/contentBounds';

// Retain caller ownership; duplicate parser types/diagnostics are J186 trims.
test('author socket dimensions retain native values and detached caller ownership', () => {
  const metrics = roadSocketMetrics();
  expect(metrics).toEqual({ half: CHUNK_HALF, width: ENTRY_WIDTH, asphalt: ENTRY_ASPHALT });
  metrics.half = 0;
  expect(roadSocketMetrics().half).toBe(CHUNK_HALF);
});
