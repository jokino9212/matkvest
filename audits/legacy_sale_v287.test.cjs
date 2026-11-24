'use strict';
const assert=require('node:assert/strict');
const {saleDialogDispatchActions}=require('../assets/ui/legacy-vue-actions.js');
let active=true,host='A';const calls=[];
const first=saleDialogDispatchActions({
 isCurrent:()=>active&&host==='A',
 run:(r,c)=>calls.push(['A-run',r,c]),
 choose:i=>calls.push(['A-choose',i])
});
first.run(2,1);first.choose(3);
assert.deepEqual(calls,[['A-run',2,1],['A-choose',3]]);
host='B';first.run(0,0);first.choose(0);
assert.equal(calls.length,2,'Detached modal callbacks must not dispatch');
const second=saleDialogDispatchActions({
 isCurrent:()=>active&&host==='B',
 run:(r,c)=>calls.push(['B-run',r,c]),
 choose:i=>calls.push(['B-choose',i])
});
second.run(0,0);second.choose(2);
assert.deepEqual(calls.slice(2),[['B-run',0,0],['B-choose',2]]);
active=false;second.run(0,0);second.choose(0);
assert.equal(calls.length,4,'Closed modal actions must be inert');
console.log('PASS_V287_SALE_DISPATCH_ACTION_CONTRACTS current/detached/closed/run/choose');
