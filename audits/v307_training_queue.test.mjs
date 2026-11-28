import test from 'node:test';
import assert from 'node:assert/strict';
import {createV307Queue,contextOf} from '../integrations/v307/training_queue.mjs';
import {applyTableAction} from '../integrations/backend95-next/school_block_queue.mjs';
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),packId=id('c'),assignment=id('d'),lesson=id('e'),device=id('f');
const pack={id:packId,topic_id:'g4:table',stage:0,full:true,expires_at:'2027-01-02T00:00:00Z',questions:Array(5).fill({a:2,b:3})};
function setup(kind='homework'){
 let s={owner,profile,role:kind==='lesson'?'tutor':'student',kind,ticket:1,...(kind==='lesson'?{lesson}:kind==='homework'?{assignment}:{})},actor={id:owner,role:s.role},online=true,fail=false,wrongAssignment=false,rows=[],calls=[];
 const response={server_time:'2027-01-01T00:00:00Z',topics:{'g4:table':{packs:[pack]}},permits:[]};
 let readable=true,permission=true,reads=0;const api={resumeSession:async()=>actor,profiles:async()=>readable?[{id:profile}]:[],lesson:async()=>({allowed:permission,lesson:{id:lesson}}),prepareHomework:async(...a)=>{calls.push(['homework',...a]);return {...response,assignment_id:wrongAssignment?lesson:assignment,pack}},prepareLesson:async(...a)=>{calls.push(['lesson',...a]);return response},request:async(...a)=>{calls.push(['practice',...a]);return response},submitBlock:async(...a)=>{calls.push(['put',...structuredClone(a)]);if(fail)throw Object.assign(Error('lost'),{status:0});return {id:packId,status:'finished',summary:{xp:20,coins:25}}}};
 const db={list:async(o,p)=>{reads++;return structuredClone(rows.filter(r=>r.owner===o&&r.profile===p))},insert:async r=>{rows.push(structuredClone(r));return r},act:async(k,rev,kind,value,guard)=>{const i=rows.findIndex(r=>r.key===k);if(guard&&guard(rows[i])!==true)throw Error('SCOPE_CHANGED');rows[i]=applyTableAction(rows[i],rev,kind,value);return structuredClone(rows[i])},settle:async(k,status,receipt)=>{const i=rows.findIndex(r=>r.key===k);rows[i]={...rows[i],status,receipt};return rows[i]}};
 const queue=createV307Queue({api,scope:()=>s,outbox:db,online:()=>online});
 return {queue,calls,db,reads:()=>reads,readable:v=>readable=v,permission:v=>permission=v,set:v=>s={...s,...v},actor:v=>actor=v,online:v=>online=v,fail:v=>fail=v,wrong:()=>wrongAssignment=true};
}
async function complete(q,r){for(let i=0;i<5;i++){r=await q.act(r,'check','6');r=await q.act(r,'advance','6')}return r}
test('homework binds assignment and keeps identical immutable journal on lost receipt',async()=>{const x=setup(),q=x.queue;let r=await q.prepare('g4:table',0,device);assert.equal(r.context.assignment,assignment);assert.deepEqual(x.calls[0],['homework',profile,assignment,device,[]]);x.online(false);r=await complete(q,r);assert.equal(r.status,'pending');assert.deepEqual(await q.flush(),[]);x.online(true);x.fail(true);assert.deepEqual(await q.flush(),[]);x.fail(false);assert.deepEqual(await q.flush(),[r.key]);assert.deepEqual(x.calls.at(-1),x.calls.at(-2));assert.equal((await q.list())[0].status,'confirmed');assert.deepEqual(await q.flush(),[]);});
test('teacher uses distinct lesson path and actor; other context cannot flush',async()=>{const x=setup('lesson'),q=x.queue;let r=await complete(q,await q.prepare('g4:table',0,device));assert.equal(r.context.lesson,lesson);x.set({lesson:assignment});assert.deepEqual(await q.flush(),[]);await assert.rejects(q.prepare('g4:table',0,device),/SCOPE_CHANGED/);x.set({lesson});x.actor({id:owner,role:'student'});assert.deepEqual(await q.flush(),[]);x.actor({id:owner,role:'tutor'});assert.deepEqual(await q.flush(),[r.key]);assert.equal(x.calls.at(-1)[4],lesson);});
test('assignment response mismatch and foreign actor fail before insertion',async()=>{const x=setup();x.wrong();await assert.rejects(x.queue.prepare('g4:table',0,device),/INVALID_ASSIGNMENT/);assert.deepEqual(await x.queue.list(),[]);x.actor({id:lesson,role:'student'});await assert.rejects(x.queue.prepare('g4:table',0,device),/SCOPE_CHANGED/);});
test('normal practice cannot use pending homework; parent and invalid contexts denied',async()=>{const x=setup(),q=x.queue;let r=await q.prepare('g4:table',0,device);x.set({kind:'practice',assignment:undefined});await assert.rejects(q.prepare('g4:table',0,device),/OTHER_BLOCK_ACTIVE/);await assert.rejects(q.act(r,'check','6'),/SCOPE_CHANGED/);assert.deepEqual(await q.list(),[]);assert.equal(contextOf({owner,profile,role:'parent',kind:'practice'}),null);});
test('same profile and pack id do not authorize a different context',async()=>{const x=setup(),q=x.queue;const r=await complete(q,await q.prepare('g4:table',0,device));await q.flush();x.set({kind:'practice',assignment:undefined});await assert.rejects(q.prepare('g4:table',0,device),/PACK_CONTEXT_CONFLICT/);assert.equal((await x.db.list(owner,profile)).length,1);});

test('saved draft denied before any storage read for missing network, actor, profile or permission',async()=>{
 const x=setup(),q=x.queue;await q.prepare('g4:table',0,device);let reads=x.reads();
 x.online(false);await assert.rejects(q.prepare('g4:table',0,device),/SCOPE_CHANGED/);assert.equal(x.reads(),reads);
 x.online(true);x.actor({id:lesson,role:'student'});await assert.rejects(q.prepare('g4:table',0,device),/SCOPE_CHANGED/);assert.equal(x.reads(),reads);
 x.actor({id:owner,role:'student'});x.readable(false);await assert.rejects(q.prepare('g4:table',0,device),/SCOPE_CHANGED/);assert.equal(x.reads(),reads);
 x.readable(true);assert.equal((await q.prepare('g4:table',0,device)).pack,packId);
 const t=setup('lesson');await t.queue.prepare('g4:table',0,device);reads=t.reads();t.permission(false);await assert.rejects(t.queue.prepare('g4:table',0,device),/SCOPE_CHANGED/);assert.equal(t.reads(),reads);
});

test('forged storage key cannot mutate another profile before scope rejection',async()=>{
 const x=setup(),q=x.queue,r=await q.prepare('g4:table',0,device);
 const foreignKey=JSON.stringify([owner,lesson,packId]);
 const foreign={...structuredClone(r),key:foreignKey,profile:lesson,context:{...r.context,profile:lesson}};
 await x.db.insert(foreign);
 await assert.rejects(q.act({...r,key:foreignKey},'input','123'),/SCOPE_CHANGED/);
 assert.deepEqual((await x.db.list(owner,lesson))[0],foreign);
 await assert.rejects(q.act({...r,pack:lesson},'input','123'),/SCOPE_CHANGED/);
 assert.deepEqual((await x.db.list(owner,profile))[0],r);
 assert.equal((await q.act(r,'input','6')).draft[0].answer,'6');
});

test('stored context is checked inside the write before mutating a same-key homework draft',async()=>{
 const x=setup(),q=x.queue,r=await q.prepare('g4:table',0,device);
 x.set({kind:'practice',assignment:undefined});
 const forged={...r,context:{owner,profile,role:'student',kind:'practice'}};
 await assert.rejects(q.act(forged,'input','123'),/SCOPE_CHANGED/);
 assert.deepEqual((await x.db.list(owner,profile))[0],r);
 x.set({kind:'homework',assignment});
 assert.equal((await q.act(r,'input','6')).draft[0].answer,'6');
});
