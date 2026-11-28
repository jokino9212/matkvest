import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraftKeySession} from '../integrations/v307/draft_key_session.mjs';
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),other=id('d');
const ctx={owner,profile,role:'student',kind:'homework',assignment:id('e')};
const seal={operation:'seal',keyId:null,pack},open={operation:'open',keyId:'k1',pack};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
async function setup(overrides={}){
 let scope={...ctx,ticket:1},online=true,time=100,denied=false,requests=0;
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),credential={keyId:'k1',key};
 const grant={credential,offlineForMs:200};
 const session=createDraftKeySession({scope:()=>scope,online:()=>online,now:()=>time,maxOfflineMs:100,
  fetchKey:async()=>{requests++;if(denied)throw Error('REVOKED');return grant},
  fetchFloor:async()=>{if(denied)throw Error('REVOKED');return {minimum:4,offlineForMs:200}},...overrides});
 return {session,grant,credential,setScope:s=>scope=s,setOnline:v=>online=v,setTime:v=>time=v,deny:v=>denied=v,requests:()=>requests};
}
test('exact online grant and bounded offline lease; unrelated pack or operation cannot reuse it',async()=>{
 const x=await setup(),s=x.session;
 assert.equal((await s.keyFor(ctx,seal)).key,x.credential.key);
 assert.equal(await s.floorFor(ctx,pack),4);
 x.setOnline(false);x.setTime(199);
 assert.equal((await s.keyFor(ctx,seal)).key,x.credential.key);assert.equal(await s.floorFor(ctx,pack),4);
 await assert.rejects(s.keyFor(ctx,{...seal,pack:other}),/OFFLINE_LEASE/);
 await assert.rejects(s.keyFor(ctx,open),/OFFLINE_LEASE/);
 x.setTime(200);await assert.rejects(s.keyFor(ctx,seal),/OFFLINE_LEASE/);await assert.rejects(s.floorFor(ctx,pack),/OFFLINE_LEASE/);
 assert.equal(x.requests(),1);
});
test('wrong profile or assignment cannot request key; old guard invalid after account ticket change',async()=>{
 const x=await setup(),s=x.session,g=s.guardFor(ctx);
 await assert.rejects(s.keyFor({...ctx,profile:other},seal),/KEY_SCOPE/);
 await assert.rejects(s.keyFor({...ctx,assignment:other},seal),/KEY_SCOPE/);
 assert.equal(x.requests(),0);assert.equal(g(),true);
 x.setScope({...ctx,ticket:2});assert.equal(g(),false);
 await s.keyFor(ctx,seal);s.invalidate();x.setOnline(false);
 await assert.rejects(s.keyFor(ctx,seal),/OFFLINE_LEASE/);
});
test('revocation while grant is in flight does not publish key or revive prior guard',async()=>{
 const pending=deferred(),x=await setup({fetchKey:()=>pending.promise}),s=x.session,g=s.guardFor(ctx);
 const read=s.keyFor(ctx,seal);s.invalidate();pending.resolve(x.grant);
 await assert.rejects(read,/KEY_SESSION_CHANGED/);assert.equal(g(),false);
 x.setOnline(false);await assert.rejects(s.keyFor(ctx,seal),/OFFLINE_LEASE/);
});
test('online denial invalidates cached key and floor; no fallback to previously granted key',async()=>{
 const x=await setup(),s=x.session;
 await s.keyFor(ctx,seal);await s.floorFor(ctx,pack);const g=s.guardFor(ctx);
 x.deny(true);await assert.rejects(s.keyFor(ctx,seal),/REVOKED/);assert.equal(g(),false);
 x.setOnline(false);await assert.rejects(s.keyFor(ctx,seal),/OFFLINE_LEASE/);await assert.rejects(s.floorFor(ctx,pack),/OFFLINE_LEASE/);
});
test('online-only default, mismatched key IDs, backwards clock and connection changes fail closed',async()=>{
 const x=await setup({maxOfflineMs:0}),s=x.session;
 await s.keyFor(ctx,seal);x.setOnline(false);await assert.rejects(s.keyFor(ctx,seal),/OFFLINE_LEASE/);
 x.setOnline(true);await assert.rejects(s.keyFor(ctx,{...open,keyId:'different'}),/KEY_INVALID/);
 x.setTime(99);await assert.rejects(s.keyFor(ctx,seal),/KEY_CLOCK/);
 const pending=deferred(),y=await setup({fetchKey:()=>pending.promise});
 const read=y.session.keyFor(ctx,seal);y.setOnline(false);pending.resolve(y.grant);
 await assert.rejects(read,/CONNECTION_CHANGED/);
});
test('request journal channel is scoped independently; no school floor or foreign channel allowed',async()=>{
 const x=await setup(),s=x.session,journal={owner,profile,role:'student',channel:'quick',scope:owner+':'+profile};
 x.setScope({...journal,ticket:2});
 const request={operation:'seal',keyId:null,requestId:pack};
 await s.keyFor(journal,request);
 await assert.rejects(s.keyFor({...journal,channel:'review'},request),/KEY_SCOPE/);
 await assert.rejects(s.floorFor(journal,pack),/KEY_REQUEST/);
});
test('lease lifetime is counted from request start not receipt; stale floor cannot revive invalidated scope',async()=>{
 const p=deferred(),x=await setup({fetchFloor:()=>p.promise}),s=x.session;
 const read=s.floorFor(ctx,pack);x.setTime(201);p.resolve({minimum:7,offlineForMs:100});
 assert.equal(await read,7);x.setOnline(false);await assert.rejects(s.floorFor(ctx,pack),/OFFLINE_LEASE/);
 const q=deferred(),y=await setup({fetchFloor:()=>q.promise});
 const old=y.session.floorFor(ctx,pack);y.setScope({...ctx,ticket:2});q.resolve({minimum:7,offlineForMs:100});
 await assert.rejects(old,/KEY_SESSION_CHANGED/);
});

test('concurrent older floor cannot lower the already observed minimum within one session',async()=>{
 const slow=deferred();let count=0;
 const x=await setup({fetchFloor:async()=>++count===1?slow.promise:{minimum:9,offlineForMs:100}}),s=x.session,g=s.guardFor(ctx);
 const old=s.floorFor(ctx,pack);
 assert.equal(await s.floorFor(ctx,pack),9);
 slow.resolve({minimum:4,offlineForMs:100});
 await assert.rejects(old,/KEY_FLOOR_REGRESSION/);
 assert.equal(g(),false);
 x.setOnline(false);await assert.rejects(s.floorFor(ctx,pack),/OFFLINE_LEASE/);
});
