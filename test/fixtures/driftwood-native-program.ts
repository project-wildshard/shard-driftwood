// oxlint-disable-next-line import/no-nodejs-modules -- Run the actual owner compiler in its native Node realm.
import { execFileSync } from 'node:child_process';

/** Compile actual owned guests once per importing realm; consumers admit every original byte and ABI. */
export function driftwoodNativeGuestProgram(): Promise<string> {
  const stdout = execFileSync(process.execPath, ['--experimental-transform-types', '--import',
      import.meta.resolve('@wildshard/engine/scripts/sim-node-loader.mjs'),
      'test/fixtures/headless/driftwood-guest-compile.ts'],
    { encoding: 'utf8', timeout: 14_000, maxBuffer: 1 << 26 });
  return Promise.resolve(stdout);
}
