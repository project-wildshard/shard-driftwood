import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {builtProduct} from '../fixtures/builtProduct.ts';

test('source-runtime product loans refuse changed source, changed bytes and foreign paths',()=>{
 const previous=process.cwd();mkdirSync('tmp/ci21-source-product-controls',{recursive:true});
 const root=mkdtempSync(resolve('tmp/ci21-source-product-controls','case-'));
 try{
  process.chdir(root);mkdirSync('src',{recursive:true});mkdirSync('out/driftwood-isle',{recursive:true});mkdirSync('tmp/ci21-source',{recursive:true});
  writeFileSync('src/index.ts','actual producer input');writeFileSync('out/driftwood-isle/shard.json','actual immutable product');
  const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
  const receipt={schema:1,sourceRevision:process.env.GITHUB_SHA??'a'.repeat(40),package:'a'.repeat(64),lock:'b'.repeat(64),
   inputs:[{path:'src/index.ts',sha256:hash('src/index.ts')}],product:'driftwood-isle',files:[{path:'shard.json',sha256:hash('out/driftwood-isle/shard.json')}]};
  const save=()=>writeFileSync('tmp/ci21-source/product.json',JSON.stringify(receipt));save();
  assert.equal(builtProduct('driftwood-isle'),'out/driftwood-isle');assert.throws(()=>builtProduct('foreign'));
  writeFileSync('src/index.ts','changed producer input');assert.throws(()=>builtProduct('driftwood-isle'),/source input differs/u);writeFileSync('src/index.ts','actual producer input');
  writeFileSync('out/driftwood-isle/shard.json','changed bytes');assert.throws(()=>builtProduct('driftwood-isle'),/product bytes differ/u);writeFileSync('out/driftwood-isle/shard.json','actual immutable product');
  writeFileSync('src/untracked.ts','untracked producer input');assert.throws(()=>builtProduct('driftwood-isle'),/source inventory differs/u);rmSync('src/untracked.ts');
  writeFileSync('out/driftwood-isle/unlisted.bin','unlisted output');assert.throws(()=>builtProduct('driftwood-isle'),/product inventory differs/u);rmSync('out/driftwood-isle/unlisted.bin');
  // sdk 0.5.0 static files are ordinary tracked src/ inputs.
  mkdirSync('src/static/assets/driftwood-isle',{recursive:true});writeFileSync('src/static/assets/driftwood-isle/mount.bin','tracked static mount');
  assert.throws(()=>builtProduct('driftwood-isle'),/source inventory differs/u);
  receipt.inputs.push({path:'src/static/assets/driftwood-isle/mount.bin',sha256:hash('src/static/assets/driftwood-isle/mount.bin')});save();
  assert.equal(builtProduct('driftwood-isle'),'out/driftwood-isle');
  writeFileSync('src/static/assets/driftwood-isle/mount.bin','changed mount');assert.throws(()=>builtProduct('driftwood-isle'),/source input differs/u);
  rmSync('src/static/assets/driftwood-isle/mount.bin');receipt.inputs.pop();save();
  receipt.files.push({path:'../foreign.json',sha256:'a'.repeat(64)});save();assert.throws(()=>builtProduct('driftwood-isle'),/Foreign producer output/u);
 }finally{process.chdir(previous);rmSync(root,{recursive:true,force:true});}
});
