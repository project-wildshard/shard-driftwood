// Compile the same production guest files in Node's native compiler/Response realm.
// oxlint-disable-next-line import/no-nodejs-modules -- Hash the same declared owner source as the native shard compiler.
import { readFileSync } from 'node:fs';
import { createProjectGeneration } from '@wildshard/sharddev/projectGeneration';
import { hashImmutableBytes } from '@wildshard/format/immutable';
import { driftwoodGuestFiles } from '../../src/generators/guestPrograms.ts';

const source = 'src/generators/guestPrograms.ts';
const context = createProjectGeneration('src', hashImmutableBytes(new Uint8Array(readFileSync(source))), new Map(), process.argv[2]);
const files = await driftwoodGuestFiles(context);
process.stdout.write(JSON.stringify([...files].map(([name, bytes]) => [name, Buffer.from(bytes).toString('base64')])));
