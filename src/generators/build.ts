import { driftwoodNavigation } from './navigation';
import { driftwoodGuestFiles, driftwoodGuestRows } from './guestPrograms';
import type { ProjectGenerationContext } from '@wildshard/sharddev/projectGeneration';
import type { Shardfile } from '@wildshard/format/shardSchema';
import { driftwoodShardfileRows } from './shardfile';
import { driftwoodFixedShardfile } from './fixedShardfile';
import { driftwoodFixedFiles } from './fixedProgram';
import { driftwoodFixedLayouts } from './fixedLayouts';
import { driftwoodAudio } from './audio';
import { driftwoodIslandFacts } from './islandFacts';

/** The declaration receives original fixed-world rows and bytes from its own source producer. */
export async function build(ctx: ProjectGenerationContext): Promise<Shardfile> {
  const layouts = driftwoodFixedLayouts(await driftwoodFixedFiles(ctx));
  return driftwoodShardfileRows(await driftwoodFixedShardfile(ctx), driftwoodAudio(layouts.wreck, await driftwoodIslandFacts(ctx)), driftwoodGuestRows(await driftwoodGuestFiles(ctx)).bridge.pages, await driftwoodNavigation(ctx));
}
