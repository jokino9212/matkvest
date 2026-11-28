import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewQueue} from '../integrations/v307/review_queue.mjs';
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',U='b1436d1d-0123-4f25-8ae9-df61e8a85370',K='c1436d1d-0123-4f25-8ae9-df61e8a85370';
function setup(){let row=null,s={owner:U,profile:P,role:'student',ticket:1},actor={id:U,role:'student'},fail=false,conflict=false,calls=[];const store={read:async()=>row,reserve:async(r,guard)=>{if(guard&&guard()!==true)throw Error('SCOPE_CHANGED');return row??=r},clear:async(k,id)=>{if(row?.key===id)row=null;}};const api={resumeSession:async()=>actor,reviewStart:async(p,b,k)=>{calls.push([p,b,k]);if(fail)throw Error('lost');return {id:K,mode:b.mode,revision:0,status:'active'}},reviewStep:async(p,id,b,k)=>{calls.push([p,id,b,k]);if(conflict)throw Object.assign(Error('conflict'),{status:409,code:'REVIEW_REVISION_CONFLICT'});if(fail)throw Error('lost');return {id,revision:b.revision+1,status:'active'}}};const make=()=>createReviewQueue({api,scope:()=>s,store,online:()=>true,makeId:()=>K});return {make,calls,store,seed:v=>row=v,set:v=>s={...s,...v},fail:v=>fail=v,actor:v=>actor=v,conflict:v=>conflict=v};}
const start={kind:'start',body:{mode:'control',grade:'4',count:10,topic:null}},step={kind:'step',review:K,body:{revision:0,action:'check',cells:{'answer:0':'6'}}};
test('lost review start and checked answer use exact same key and payload',async()=>{const x=setup();x.fail(true);await assert.rejects(x.make().submit(start));assert.equal((await x.make().pending()).key,K);await assert.rejects(x.make().submit(step),/PENDING_OTHER_OPERATION/);x.fail(false);await x.make().submit(start);assert.deepEqual(x.calls[0],x.calls[1]);x.fail(true);await assert.rejects(x.make().submit(step));x.fail(false);await x.make().submit(step);assert.deepEqual(x.calls[2],x.calls[3]);assert.equal(await x.make().pending(),null);});
test('review does not use a foreign login, validates lengths and clears confirmed no-write conflict',async()=>{const x=setup();x.actor({id:P,role:'student'});await assert.rejects(x.make().submit(start),/REVIEW_SCOPE/);assert.equal(x.calls.length,0);x.actor({id:U,role:'student'});await assert.rejects(x.make().submit({...start,body:{...start.body,count:1}}),/INVALID_REVIEW_REQUEST/);x.conflict(true);await assert.rejects(x.make().submit(step));assert.equal(await x.make().pending(),null);x.set({role:'tutor'});await assert.rejects(x.make().submit(step),/REVIEW_SCOPE/);});

test('review pending rejects wrong actor and mismatched stored scope before exposing a body',async()=>{
 const x=setup(),b=start,row={scope:U+':'+P,owner:U,profile:P,key:K,body:b};
 x.seed({...row,scope:'foreign'});await assert.rejects(x.make().pending(),/PENDING_RECORD_INVALID/);
 x.seed(row);x.actor({id:P,role:'student'});await assert.rejects(x.make().pending(),/SCOPE/);
 x.actor({id:U,role:'student'});assert.deepEqual(await x.make().pending(),row);
});
test('review scope change during reserve aborts the new journal before write',async()=>{
 const x=setup(),reserve=x.store.reserve;
 x.store.reserve=async(row,guard)=>{x.set({ticket:2});return reserve(row,guard)};
 await assert.rejects(x.make().submit(start),/SCOPE_CHANGED/);
 assert.equal(await x.store.read(),null);assert.equal(x.calls.length,0);
});
