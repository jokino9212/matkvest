'use strict';
const assert=require('node:assert/strict');
const {schoolColumnActions}=require('../assets/ui/legacy-vue-actions.js');
let active=true,blocked=false,solved=false,hasAttempt=true;
const calls=[];
const record=key=>(...args)=>{calls.push([key,...args]);return key;};
const actions=schoolColumnActions({
 isCurrent:()=>active&&!blocked,isSolved:()=>solved,hasAttempt:()=>hasAttempt,
 check:record('check'),next:record('next'),requestSkip:record('skip-confirm'),
 inputCell:record('input-cell'),moveCell:record('move-cell'),toggleDot:record('toggle-dot')
});
assert.deepEqual(Object.keys(actions),['primary','skip','inputCell','moveCell','toggleDot']);
assert.equal(actions.primary(),'check');
assert.equal(actions.skip(),'skip-confirm');
assert.equal(actions.inputCell({value:'3'}),'input-cell');
assert.equal(actions.moveCell({key:'ArrowRight'},{}),'move-cell');
assert.equal(actions.toggleDot({value:''}),'toggle-dot');
assert.deepEqual(calls.map(x=>x[0]),['check','skip-confirm','input-cell','move-cell','toggle-dot']);
solved=true;
assert.equal(actions.primary(),'next');
assert.equal(actions.skip(),undefined);
assert.deepEqual(calls.map(x=>x[0]).slice(-1),['next']);
solved=false;hasAttempt=false;assert.equal(actions.skip(),'next');
active=false;let size=calls.length;
for(const method of Object.values(actions))method();
assert.equal(calls.length,size,'Detached column exercise must not process stale events');
active=true;blocked=true;
for(const method of Object.values(actions))method();
assert.equal(calls.length,size,'Confirmation dialog must block all column gestures');
blocked=false;
const fresh=schoolColumnActions({
 isCurrent:()=>true,isSolved:()=>true,hasAttempt:()=>true,
 check:record('never'),next:()=>42,requestSkip:record('never'),
 inputCell:()=>1,moveCell:()=>2,toggleDot:()=>3
});
assert.notStrictEqual(fresh,actions,'Each exercise needs fresh actions');
assert.equal(fresh.primary(),42);
assert.equal(fresh.inputCell(),1);
assert.equal(fresh.moveCell(),2);
assert.equal(fresh.toggleDot(),3);
console.log('PASS_V274_COLUMN_ACTION_CONTRACTS primary/skip/inputCell/moveCell/toggleDot/dialog/stale');
