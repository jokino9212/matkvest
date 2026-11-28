import test from 'node:test';
import assert from 'node:assert/strict';
import {createEconomyQueue} from '../integrations/v307/economy_queue.mjs';
const owner='a1436d1d-0123-4f25-8ae9-df61e8a85370',profile='b1436d1d-0123-4f25-8ae9-df61e8a85370',key='c1436d1d-0123-4f25-8ae9-df61e8a85370';
function setup(){let s={owner,profile,role:'student',ticket:1},row=null,fail=false,actor={id:owner,role:'student'},calls=[];const store={read:async()=>row,reserve:async(r,guard)=>{if(guard&&guard()!==true)throw Error('SCOPE_CHANGED');return row??=r},clear:async(k,id)=>{if(row?.key===id)row=null;}};const api={resumeSession:async()=>actor,economyOperation:async(p,b,k)=>{calls.push([p,b,k]);if(fail)throw Error('lost');return {profile_id:p,operation_id:k,action:b.action,balance:100};}};const make=()=>createEconomyQueue({api,scope:()=>s,store,online:()=>true,uuid:()=>key});return {make,calls,store,seed:v=>row=v,set:v=>s={...s,...v},fail:v=>fail=v,actor:v=>actor=v};}
test('lost receipt survives new queue and retries identical request; conflicting request blocked',async()=>{const x=setup(),b={action:'chest',expected_price:200};x.fail(true);await assert.rejects(x.make().submit(b));assert.equal((await x.make().pending()).key,key);await assert.rejects(x.make().submit({action:'buy',item_id:'pet_cat',expected_price:100}),/PENDING_OTHER_OPERATION/);x.fail(false);await x.make().submit(b);assert.deepEqual(x.calls[0],x.calls[1]);assert.equal(await x.make().pending(),null)});
test('verify cookie actor before dispatch; tutor and different account cannot send',async()=>{const x=setup();x.actor({id:profile,role:'student'});await assert.rejects(x.make().submit({action:'chest',expected_price:200}),/SCOPE_CHANGED/);assert.equal(x.calls.length,0);x.set({role:'tutor'});await assert.rejects(x.make().submit({action:'chest',expected_price:200}),/INVALID_ECONOMY_SCOPE/);});

test('economy pending rejects wrong actor and mismatched stored scope before exposing a body',async()=>{
 const x=setup(),b={action:'chest',expected_price:200},row={scope:owner+':'+profile,owner:owner,profile:profile,key:key,body:b};
 x.seed({...row,scope:'foreign'});await assert.rejects(x.make().pending(),/PENDING_RECORD_INVALID/);
 x.seed(row);x.actor({id:profile,role:'student'});await assert.rejects(x.make().pending(),/SCOPE/);
 x.actor({id:owner,role:'student'});assert.deepEqual(await x.make().pending(),row);
});
test('economy scope change during reserve aborts the new journal before write',async()=>{
 const x=setup(),reserve=x.store.reserve;
 x.store.reserve=async(row,guard)=>{x.set({ticket:2});return reserve(row,guard)};
 await assert.rejects(x.make().submit({action:'chest',expected_price:200}),/SCOPE_CHANGED/);
 assert.equal(await x.store.read(),null);assert.equal(x.calls.length,0);
});
