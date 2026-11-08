// J186: real authored AS -> public compilers -> admitted v0/v2 execution.
// Shadow ABI2 is never published as gameplay; today's wire stays unchanged.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const { compileBehaviourModule } = await import('@wildshard/sharddev/buildBehaviour');
const { compileScriptV2 } = await import('@wildshard/sharddev/compileScriptV2');
const { generateDirectorAbi } = await import('@wildshard/sharddev/directorAbi');
const { scriptV1Identifier } = await import('@wildshard/format/decisionScripts');
const { parseDirector } = await import('@wildshard/format/director');
const { prepareEmbeddedDirector } = await import('@wildshard/engine/game/plugin/director');
const { ScriptModuleV2 } = await import('@wildshard/engine/script/moduleV2');
const root = 'src/shards/driftwood-isle';
const original = readFileSync(`${root}/behaviour/director.as`, 'utf8');
const authored = readFileSync(`${root}/behaviour/directorV2.as`, 'utf8');
const data = parseDirector(JSON.parse(readFileSync(`${root}/data/director.json`, 'utf8')));
const parameterNames = ['radius', 'delay'];
const states = [{name:'initialized',type:'bool',initial:0}, {name:'altar',type:'bool',initial:0}, {name:'dead',type:'bool',initial:0}, {name:'reward',type:'f64',initial:-1}];
const bindings = `let io:usize=0;let tick:i32=0;
export function begin(base:usize,now:i32):void{io=base;tick=now;}
export class Clock{static get tick():i32{return tick;}static get dt():f64{return load<f64>(io+16);}}
export class Inputs{${data.inputs.map((row, i) => `static get ${scriptV1Identifier(row.key)}():f64{return load<f64>(io+${1024+i*8});}`).join('')}}
export class Params{${parameterNames.map((name, i) => `static get ${name}():f64{return load<f64>(io+${768+i*8});}`).join('')}}
export class Incoming{static get count():i32{return i32(load<f64>(io+32));}static type(i:i32):i32{if(i<0||i>=Incoming.count)unreachable();return i32(load<f64>(io+64+usize(i)*8));}}
export class State{${states.map((row,i)=>`static get ${row.name}():${row.type}{return ${row.type==='bool'?`load<f64>(io+${512+i*8})==1`:`load<f64>(io+${512+i*8})`};}static set ${row.name}(value:${row.type}){store<f64>(io+${512+i*8},${row.type==='bool'?'value?1.0:0.0':'value'});}`).join('')}}
export namespace Do{export function event(type:i32,value:f64=0):void{const n=i32(load<f64>(io+2048));if(n>=8)unreachable();const at=io+2056+usize(n)*24;store<f64>(at,f64(type));store<f64>(at+8,${data.entity}.0);store<f64>(at+16,value);store<f64>(io+2048,f64(n+1));}}
`;
const entry = `import {onTick} from './directorV2';import {begin} from './generated/driftwoodDirector';
export function ws_abi():i32{return 2;}export function ws_io():i32{return 1024;}
export function ws_init(lo:i32,hi:i32,fuel:i32):i32{return 0;}
export function ws_step(tick:i32,fuel:i32):i32{begin(1024,tick);onTick();return 0;}`;

function readAnswer(view, base, tick) {
  const count = view.getFloat64(base + 2048, true);
  assert.ok(Number.isInteger(count) && count >= 0 && count <= 8);
  return { state: Object.fromEntries(states.map((row,i)=>[row.name,view.getFloat64(base+512+i*8,true)])), events: Array.from({ length: count }, (_, i) => {
    const at = base + 2056 + i * 24, event = data.events.find(row => row.id === view.getFloat64(at, true) && row.direction === 'output');
    assert.ok(event); assert.equal(view.getFloat64(at + 8, true), data.entity);
    return { director: data.id, tick, key: event.key, type: event.type, value: view.getFloat64(at + 16, true) };
  }) };
}

function session(factory, bytes) {
  let old = factory(), state = Object.fromEntries(states.map(row=>[row.name,row.initial]));
  let shadow = new ScriptModuleV2(bytes, { seed: [0, 0], initFuel: 1000000, ioBytes: 4096,
    output: [{ offset: 1536, count: 4, width: 8 }, { offset: 3072, count: 25, width: 8 }] });
  return (observations, { dt = 1 / 60, events = [], dispatch = false, restore = false } = {}) => {
    const tick = dispatch ? old.tick : old.tick + 1;
    const incoming = events.map(key => {
      const event = data.events.find(row => row.key === key && row.direction === 'input'); assert.ok(event);
      old.enqueue(key); return event.id;
    });
    const expected = dispatch ? old.dispatch(observations) : old.step(tick, observations, dt);
    const answer = shadow.step(tick, 1000000, view => {
      const base = shadow.io; new Uint8Array(view.buffer, base, 4096).fill(0);
      view.setFloat64(base + 16, dispatch ? 0 : dt, true); view.setFloat64(base + 32, incoming.length, true);
      incoming.forEach((id, i) => view.setFloat64(base + 64 + i * 8, id, true));
      states.forEach((row,i)=>view.setFloat64(base+512+i*8,state[row.name],true));
      data.parameters.forEach((value, i) => view.setFloat64(base + 768 + i * 8, value, true));
      data.inputs.forEach((row, i) => { assert.ok(Object.hasOwn(observations, row.key)); view.setFloat64(base + 1024 + i * 8, observations[row.key], true); });
    }, view => readAnswer(view, shadow.io, tick)).value;
    assert.deepEqual(answer.events, expected, `Shipping/shadow event mismatch at tick ${tick}`); state = answer.state;
    if (restore) {
      const saved = old.snapshot(); old = factory(); old.restore(saved); assert.equal(old.snapshot(), saved);
      shadow = new ScriptModuleV2(bytes, { seed: [0, 0], initFuel: 1000000, ioBytes: 4096,
        output: [{ offset: 1536, count: 4, width: 8 }, { offset: 3072, count: 25, width: 8 }] });
    }
    return answer;
  };
}

test('Driftwood actual shipping director and shadow port keep event and saved-continuation parity', { timeout: 9500 }, async () => {
  const sources = { 'wildshard-director.ts': generateDirectorAbi(data) };
  const shipping = await compileBehaviourModule(original, 1, sources);
  assert.equal(shipping.module, data.module, 'The shipping module must retain its immutable identity');
  const bytes = await compileScriptV2(entry, { maximumPages: 1, lane: 'sim', ioBytes: 4096,
    sources: { 'directorV2.ts': authored, 'generated/driftwoodDirector.ts': bindings } });
  assert.deepEqual(await compileBehaviourModule(original, 1, sources), shipping, 'Shadow compilation must not change shipping compiler output');
  const factory = await prepareEmbeddedDirector(data, shipping, 357);
  const observation = {altar:0,dead:0,seen:0,'player-x':30,'player-z':30,'reward-x':0,'reward-z':0};
  const resumed = session(factory,bytes);
  assert.deepEqual(resumed({...observation,altar:1},{dt:1,restore:true}).events.map(row=>row.key),['captain.restore']);
  assert.deepEqual(resumed({...observation,altar:1},{dispatch:true}).events,[]);
  const run=session(factory,bytes);
  assert.deepEqual(run(observation,{dt:0}).events,[]);
  assert.deepEqual(run({...observation,altar:1},{dispatch:true}).events.map(row=>row.key),['captain.wake']);
  const dead={...observation,altar:1,dead:1,'player-x':0,'player-z':0};
  const killed=run(dead,{dispatch:true,restore:true});
  assert.deepEqual(killed.events.map(row=>row.key),['captain.dead']);assert.equal(killed.state.reward,-1);
  assert.deepEqual(run(dead,{dt:1,restore:true}).events.map(row=>row.key),['reward.start']);
  for(let i=0;i<6;i++) assert.deepEqual(run(dead,{dt:1,restore:true}).events,[]);
  const finish=run(dead,{dt:.01,restore:true});
  assert.deepEqual(finish.events.map(row=>row.key),['reward.finish']);assert.equal(finish.state.reward,-2);
  assert.deepEqual(run(dead,{dt:1}).events,[]);
  for(const seen of [0,1]){
    const boundary=session(factory,bytes);boundary({...dead,seen},{dt:1});
    assert.deepEqual(boundary({...dead,seen,'player-x':7},{dt:1}).events,[]);
    assert.deepEqual(boundary({...dead,seen},{dt:0}).events,[]);
    assert.deepEqual(boundary({...dead,seen},{dt:.1,restore:true}).events.map(row=>row.key),seen?[]:['reward.start']);
  }
  const long=session(factory,bytes),emitted=[];long(observation,{dt:0});
  for(let i=0;i<1200;i++) emitted.push(...long({...observation,altar:Number(i>=10),dead:Number(i>=20),'player-x':i<60?30:0,'player-z':0},{dt:i%7===0?0:1/60,restore:i%29===0}).events.map(row=>row.key));
  assert.deepEqual(emitted,['captain.wake','captain.dead','reward.start','reward.finish']);
});
