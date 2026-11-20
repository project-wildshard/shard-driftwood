// ONE-FORMAT OF22d3: Driftwood's swords leave its native plan. The plan's `item.swept` host read the swept sword policy
// from a server file (`server/swords.json`); engine 53686ff1b (OF22d2) stands a native plan's sword from the format's
// `held/melee` section when no `item.swept` host is named. The swords policy (`data/nativeSwords.json`) is that section.
import { expect, test } from 'vitest';
import { parsePlatformDataSection } from '@wildshard/format/platformDataSections';
import swords from '../src/data/nativeSwords.json' with { type: 'json' };
import { output } from '../src/generators/output';
import { driftwoodServerFiles } from '../src/generators/nativeServer';

test('Driftwood\'s swords are the held/melee section, not a native item.swept host', () => {
  const section = output.platform.sections.find(row => row.name === 'held/melee');
  expect(section, 'the swords policy is a held/melee section').toBeDefined();
  const bytes = section === undefined ? undefined : output.platform.files.get(section.path);
  expect(parsePlatformDataSection('held/melee', JSON.parse(new TextDecoder().decode(bytes)))).toEqual(parsePlatformDataSection('held/melee', swords));
  const files = driftwoodServerFiles().map(row => row.file.name);
  expect(files).not.toContain('server/swords.json');
  const plan = JSON.parse(new TextDecoder().decode(driftwoodServerFiles().find(row => row.file.name === 'server/native-assembly.json')?.bytes)) as { features: { host: string }[] };
  expect(plan.features.map(row => row.host)).not.toContain('item.swept');
});
