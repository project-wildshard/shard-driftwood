import { parseShardfileField, type Shardfile } from '@wildshard/format/shardSchema';
import type { ProjectGenerationContext } from '@wildshard/sharddev/projectGeneration';
import { driftwoodFixedFiles } from './fixedProgram';

/** Original fixed world fields used by the declaration, validated at the owned-byte boundary. */
export interface DriftwoodFixedShardfile extends Pick<Shardfile, 'terrain' | 'props' | 'tiles' | 'files' | 'library' | 'critical'> {
  libraryCost: { resident: number; compressed: number };
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const validCost = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** Validate untrusted cached metadata through the same declaration schema as the original shard file. */
export function driftwoodFixedShardfileRows(input: unknown): DriftwoodFixedShardfile {
  if (!isRecord(input) || !isRecord(input['libraryCost'])) throw new Error('Missing Driftwood fixed shard file metadata');
  const cost = input['libraryCost'];
  if (!validCost(cost['resident']) || !validCost(cost['compressed'])) throw new Error('Invalid Driftwood fixed library cost');
  return { terrain: parseShardfileField('terrain', input['terrain']), props: parseShardfileField('props', input['props']),
    tiles: parseShardfileField('tiles', input['tiles']), files: parseShardfileField('files', input['files']),
    library: parseShardfileField('library', input['library']), critical: parseShardfileField('critical', input['critical']),
    libraryCost: { resident: cost['resident'], compressed: cost['compressed'] } };
}

/** Build the declared world from owned bytes and publish only its hash-bound asset closure. */
export async function driftwoodFixedShardfile(ctx: Pick<ProjectGenerationContext, 'cached' | 'asset'>): Promise<DriftwoodFixedShardfile> {
  const files = await driftwoodFixedFiles(ctx), metadata = files.get('data/fixedTiles.generated.json');
  if (metadata === undefined) throw new Error('Missing owned Driftwood fixed metadata');
  const input: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(metadata));
  const fixed = driftwoodFixedShardfileRows(input);
  for (const file of fixed.files) {
    const bytes = files.get(`assets/${file.hash}`) ?? files.get(`owned/coarse/${file.hash}.glb`);
    if (bytes === undefined || bytes.byteLength !== file.compressed || ctx.asset(bytes) !== file.hash) throw new Error('Driftwood fixed asset inventory differs');
  }
  return fixed;
}
