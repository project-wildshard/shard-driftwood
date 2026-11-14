// oxlint-disable-next-line import/no-nodejs-modules -- Bind the source operation to its real public input root.
import { resolve } from 'node:path';
import { createProjectGeneration } from '@wildshard/sharddev/projectGeneration';
import { driftwoodBootProgram } from '../../src/generators/bootProgram';
import { driftwoodNavigation } from '../../src/generators/navigation';
import { driftwoodGroundDeclaration } from '../../src/generators/groundDeclaration';

const context = createProjectGeneration(resolve('src'), 'f'.repeat(64), new Map(),
  resolve('tmp/driftwood-boot-inventory'), [{ prefix: '/assets/', directory: resolve('public/assets') }]);
/** The real bounded discovery operations, without a complete shard rebuild. */
export const discovery = { 'ground.rows': driftwoodGroundDeclaration(), navigation: await driftwoodNavigation(context),
  ...driftwoodBootProgram(context) };
