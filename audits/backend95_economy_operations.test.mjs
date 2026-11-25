import assert from 'node:assert/strict';
import {createEconomyOperations} from '../integrations/backend95/economy_operations.mjs';
let records=new Map(), calls=[], commits=new Map(), wallet=500, drop=true, online=true;
const state={status:'ready',user:{id:'owner',role:'student'},selectedId:'student-a',snapshot:{profile:{id:'student-a'},economy:{}}};
const store={read:()=>structuredClone(state),logoutPending:()=>false,select:async()=>{}};
const journal={read:async key=>records.get(key)||null,claim:async row=>{if(records.has(row.scope))return null;records.set(row.scope,structuredClone(row));return row},settle:async(key,id)=>{if(records.get(key)?.id===id)records.delete(key)}};
const api={resumeSession:async()=>state.user,request:async(method,path,{body,idempotencyKey})=>{
 calls.push({path,body,idempotencyKey});
 if(!commits.has(idempotencyKey)){wallet-=body.expected_price;commits.set(idempotencyKey,{profile_id:state.selectedId,operation_id:idempotencyKey,action:body.action});}
 if(drop){drop=false;throw Object.assign(new Error('lost receipt'),{status:0,code:'NETWORK_UNAVAILABLE'});}
 return commits.get(idempotencyKey);
}};
let n=0;
const make=()=>createEconomyOperations({api,store,mode:()=> 'server',emit:()=>{},journal,uuid:()=>`test-${++n}`,online:()=>online});
let ops=make();await ops.onAccount();await ops.run({action:'buy',item_id:'pet_bot',expected_price:240});
assert.equal(wallet,260);assert.equal(commits.size,1);assert.equal(records.size,1);assert.equal(ops.read().pending,true);assert.equal(ops.read().busy,false);
const initial=calls[0];
ops=make();await ops.onAccount();assert.equal(ops.read().pending,true);
state.selectedId='student-b';state.snapshot.profile.id='student-b';await ops.onAccount();assert.equal(ops.read().pending,false);await ops.retry();assert.equal(calls.length,1);
state.selectedId='student-a';state.snapshot.profile.id='student-a';await ops.onAccount();await ops.run({action:'chest',expected_price:200});assert.equal(calls.length,1);
online=false;await ops.retry();assert.equal(calls.length,1);
online=true;await ops.retry();assert.equal(calls.length,2);assert.deepEqual(calls[1],initial);assert.equal(wallet,260);assert.equal(commits.size,1);assert.equal(records.size,0);assert.equal(ops.read().pending,false);
console.log('PASS_ECONOMY_DURABLE_RECEIPT_LOSS_CONTROLLER');
