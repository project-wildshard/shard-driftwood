// J186: real authored AS -> public compilers -> admitted v0/v2 execution.
// Shadow ABI2 is never published as gameplay; today's wire stays unchanged.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as v from 'valibot';

const { simulationPair } = await import('./guest-pair.ts');
const { compileBehaviourModule } = await import('@wildshard/sharddev/buildBehaviour');
const { compileDualScriptV2 } = await import('@wildshard/sharddev/test/compileDualScriptV2');
const { compileScript } = await import('@wildshard/sharddev/compileScript');
const { generateDirectorAbi } = await import('@wildshard/sharddev/directorAbi');
const { scriptV1Identifier } = await import('@wildshard/format/decisionScripts');
const { parseDirector } = await import('@wildshard/format/director');
const { prepareEmbeddedDirector } = await import('@wildshard/engine/game/plugin/director');
const root = 'src';
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
const legacy = `import {onTick} from './directorV2';import {begin} from './generated/driftwoodDirector';
export function ws_abi():i32{return 1;}export function ws_io():i32{return 16384;}
export function ws_init(lo:i32,hi:i32):void{}
export function ws_handle():i32{begin(16384,i32(load<f64>(16392)));onTick();return 0;}`;

function readAnswer(view, base, tick) {
  const count = view.getFloat64(base + 2048, true);
  assert.ok(Number.isInteger(count) && count >= 0 && count <= 8);
  return { state: Object.fromEntries(states.map((row,i)=>[row.name,view.getFloat64(base+512+i*8,true)])), events: Array.from({ length: count }, (_, i) => {
    const at = base + 2056 + i * 24, event = data.events.find(row => row.id === view.getFloat64(at, true) && row.direction === 'output');
    assert.ok(event); assert.equal(view.getFloat64(at + 8, true), data.entity);
    return { director: data.id, tick, key: event.key, type: event.type, value: view.getFloat64(at + 16, true) };
  }) };
}

function session(factory, pair) {
  let old = factory(), state = Object.fromEntries(states.map(row=>[row.name,row.initial]));
  const options = { ioBytes: 4096, output: [{ offset: 1536, count: 4, width: 8 }, { offset: 3072, count: 25, width: 8 }] };
  let compare = simulationPair(pair, options);
  return (observations, { dt = 1 / 60, events = [], dispatch = false, restore = false } = {}) => {
    const tick = dispatch ? old.tick : old.tick + 1;
    const incoming = events.map(key => {
      const event = data.events.find(row => row.key === key && row.direction === 'input'); assert.ok(event);
      old.enqueue(key); return event.id;
    });
    const expected = dispatch ? old.dispatch(observations) : old.step(tick, observations, dt);
    const answer = compare(tick, (view, base) => {
      new Uint8Array(view.buffer, base, 4096).fill(0);
      view.setFloat64(base + 8, tick, true);
      view.setFloat64(base + 16, dispatch ? 0 : dt, true); view.setFloat64(base + 32, incoming.length, true);
      incoming.forEach((id, i) => view.setFloat64(base + 64 + i * 8, id, true));
      states.forEach((row,i)=>view.setFloat64(base+512+i*8,state[row.name],true));
      data.parameters.forEach((value, i) => view.setFloat64(base + 768 + i * 8, value, true));
      data.inputs.forEach((row, i) => { assert.ok(Object.hasOwn(observations, row.key)); view.setFloat64(base + 1024 + i * 8, observations[row.key], true); });
    }, (view, base) => readAnswer(view, base, tick));
    assert.deepEqual(answer.events, expected, `Shipping/shadow event mismatch at tick ${tick}`); state = answer.state;
    if (restore) {
      const saved = old.snapshot(); old = factory(); old.restore(saved); assert.equal(old.snapshot(), saved);
      const wire = JSON.stringify(state);
      state = v.parse(v.record(v.string(), v.number()), JSON.parse(wire));
      assert.equal(JSON.stringify(state), wire);
      compare = simulationPair(pair, options);
    }
    return answer;
  };
}

test('Driftwood actual shipping director and shadow port keep event and saved-continuation parity', { timeout: 9500 }, async () => {
  const sources = { 'wildshard-director.ts': generateDirectorAbi(data) };
  const shipping = await compileBehaviourModule(original, 1, sources);
  assert.equal(shipping.module, data.module, 'The shipping module must retain its immutable identity');
  const boundary = { 'generated/driftwoodDirector.ts': bindings };
  const input = { authored: new Map([['directorV2.ts', authored]]), legacy: { source: legacy, sources: boundary },
    candidate: { source: entry, sources: boundary, lane: 'sim', ioBytes: 4096 }, pages: 1 };
  const pair = await compileDualScriptV2(input);
  assert.deepEqual(pair.authors.map(row => row.path), ['directorV2.ts']);
  assert.deepEqual(await compileScript(legacy, { abi: 1, maximumPages: 1, sources: { 'directorV2.ts': authored, ...boundary } }), pair.legacy.bytes);
  assert.deepEqual(await compileBehaviourModule(original, 1, sources), shipping, 'Shadow compilation must not change shipping compiler output');
  const factory = await prepareEmbeddedDirector(data, shipping, 357);
  const observation = {altar:0,dead:0,seen:0,'player-x':30,'player-z':30,'reward-x':0,'reward-z':0};
  const resumed = session(factory,pair);
  assert.deepEqual(resumed({...observation,altar:1},{dt:1,restore:true}).events.map(row=>row.key),['captain.restore']);
  assert.deepEqual(resumed({...observation,altar:1},{dispatch:true}).events,[]);
  const run=session(factory,pair);
  assert.deepEqual(run(observation,{dt:0}).events,[]);
  assert.deepEqual(run({...observation,altar:1},{dispatch:true}).events.map(row=>row.key),['captain.wake']);
  const dead={...observation,altar:1,dead:1,'player-x':0,'player-z':0};
  const killed=run(dead,{dispatch:true,restore:true});
  assert.deepEqual(killed.events.map(row=>row.key),['captain.dead']);assert.equal(killed.state.reward,-1);
  const start = run(dead,{dt:1,restore:true});
  assert.deepEqual(start.events.map(row=>row.key),['reward.start']); assert.equal(start.state.reward,1);
  for(let i=0;i<6;i++) assert.deepEqual(run(dead,{dt:1,restore:true}).events,[]);
  const finish=run(dead,{dt:.01,restore:true});
  assert.deepEqual(finish.events.map(row=>row.key),['reward.finish']);assert.equal(finish.state.reward,-2);
  assert.deepEqual(run(dead,{dt:1}).events,[]);
  for(const seen of [0,1]){
    const boundary=session(factory,pair);boundary({...dead,seen},{dt:1});
    assert.deepEqual(boundary({...dead,seen,'player-x':7},{dt:1}).events,[]);
    assert.deepEqual(boundary({...dead,seen},{dt:0}).events,[]);
    assert.deepEqual(boundary({...dead,seen},{dt:.1,restore:true}).events.map(row=>row.key),seen?[]:['reward.start']);
  }
  const long=session(factory,pair),emitted=[];long(observation,{dt:0});
  for(let i=0;i<1200;i++) emitted.push(...long({...observation,altar:Number(i>=10),dead:Number(i>=20),'player-x':i<60?30:0,'player-z':0},{dt:i%7===0?0:1/60,restore:i%29===0}).events.map(row=>row.key));
  assert.deepEqual(emitted,['captain.wake','captain.dead','reward.start','reward.finish']);
});
