import {driftwoodGuestFile,RETURN_PROGRAM} from './driftwood-guest-programs';
import type {Scope} from '@wildshard/sdk/headless/app/scope';
import {ReturnProgram} from '@wildshard/sdk/internal/engine/game/population/returnProgram';
import {parseDecisionScripts} from '@wildshard/format/decisionScripts';
import {hashImmutableBytes} from '@wildshard/format/immutable';

export const driftwoodReturnBytes=driftwoodGuestFile('behaviour/returns.generated.wasm');
const hash=hashImmutableBytes(driftwoodReturnBytes),rows=parseDecisionScripts([RETURN_PROGRAM.script]);
if(rows.length!==1||RETURN_PROGRAM.script.module!==`blobs/wasm/${hash}.wasm`)throw new Error('Original return module differs');
const assets=new Map([[hash,driftwoodReturnBytes]]);
/** Reuse each fixture's actual native or entered owner and the same verified byte map. */
export function lendDriftwoodReturns(owner:Scope):Scope {ReturnProgram.lendModules(owner,assets,rows);return owner;}
