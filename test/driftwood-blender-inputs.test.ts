import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { Document, NodeIO } from '@gltf-transform/core';

// Meta QA 11-25 row 157: skeleton.mjs read Nine Dragon's rig from the old monorepo's public/assets, and the island build
// reads the CC0 kit that lives in shard-pine-hollow. Both now read a sibling checkout: WILDSHARD_REPOS, else this
// repo's parent. A made-up two-bone rig stands in for Nine Dragon's (J507: no stored copy of another shard's asset).
mkdirSync('tmp', { recursive: true });
const repos = mkdtempSync(path.resolve('tmp', 'blender-inputs-'));
afterAll(() => rmSync(repos, { recursive: true, force: true }));
const SKELETON = 'src/blender/fp-arms/skeleton.mjs';
const RIG = 'shard-nine-dragon/src/static/assets/nine-dragon-stack/viewmodel/fp-rig.glb';
const run = (env: Record<string, string>, out: string) => spawnSync(process.execPath, [SKELETON, out], { encoding: 'utf8', env: { ...process.env, ...env } });

test('skeleton.mjs refuses a missing Nine Dragon checkout, naming WILDSHARD_REPOS', () => {
  const result = run({ WILDSHARD_REPOS: path.join(repos, 'none') }, path.join(repos, 'none.json'));
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain(`no Nine Dragon rig at ${path.join(repos, 'none', RIG)}; set WILDSHARD_REPOS`);
});

test('skeleton.mjs reads the rig from the checkout WILDSHARD_REPOS names', async () => {
  const doc = new Document();
  doc.createBuffer();
  const root = doc.createNode('vm_root');
  root.addChild(doc.createNode('R_shoulder').setTranslation([0.2, -0.1, 0]).addChild(doc.createNode('R_upperarm').setTranslation([0, -0.3, 0])));
  doc.createScene().addChild(root);
  mkdirSync(path.dirname(path.join(repos, RIG)), { recursive: true });
  await new NodeIO().write(path.join(repos, RIG), doc);
  const out = path.join(repos, 'bind.json');
  const result = run({ WILDSHARD_REPOS: repos }, out);
  expect(result.stderr).toBe('');
  const bind = JSON.parse(readFileSync(out, 'utf8')) as { source: string; bones: Record<string, { parent: string | null }> };
  expect(bind.source).toBe(RIG);
  expect(bind.bones['R_upperarm']?.parent).toBe('R_shoulder');
});

test('the island build reads the CC0 kit from the same folder', () => {
  const script = readFileSync('src/blender/build_island.py', 'utf8');
  expect(script).toContain("REPOS = os.path.abspath(os.environ.get('WILDSHARD_REPOS') or os.path.dirname(REPO))");
  expect(script).toContain("PINE_MODELS = f'{REPOS}/shard-pine-hollow/");
});
