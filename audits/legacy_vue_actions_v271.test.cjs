'use strict';
const assert=require('node:assert/strict');
const actions=require('../assets/ui/legacy-vue-actions.js');
const calls=[];
const handlers=Object.fromEntries(['home','profile','wallet','shop','data','journal','leaders']
  .map(key=>[key,()=>calls.push(key)]));
const header=actions.headerActions(handlers);
assert.deepEqual(Object.keys(header),['home','profile','wallet','shop','data','journal','leaders']);
Object.values(header).forEach(cb=>cb());
assert.deepEqual(calls,['home','profile','wallet','shop','data','journal','leaders']);
assert.notStrictEqual(actions.headerActions(handlers),header,'header callbacks must refresh per mount');
let active=true,blocked=false;
const setup=actions.quickSetupActions({
  isCurrent:()=>active,isBlocked:()=>blocked,
  choice:value=>calls.push('choice:'+value),smart:value=>calls.push('smart:'+value),
  start:()=>calls.push('start'),trainAll:()=>calls.push('train-all'),home:()=>calls.push('setup-home')
});
['choice:all','choice:3','smart:mistakes','start','train-all','home'].forEach(x=>setup.run(x));
assert.deepEqual(calls.slice(7),['choice:all','choice:3','smart:mistakes','start','train-all','setup-home']);
blocked=true;setup.run('start');assert.equal(calls.length,13,'dialog blocks actions');
blocked=false;active=false;setup.run('start');assert.equal(calls.length,13,'stale setup blocks actions');
active=true;
let hasPlan=false,selection={type:'squares',min:2,max:9};
const result=actions.quickResultActions({
  isCurrent:()=>active,selection,hasPlan:()=>hasPlan,
  again:s=>{assert.strictEqual(s,selection);calls.push('again')},
  home:()=>calls.push('result-home'),returnToPlan:()=>calls.push('return-to-plan')
});
result.again();result.home();result.returnToPlan();
assert.deepEqual(calls.slice(13),['again','result-home'],'plan return hidden unless active');
hasPlan=true;result.returnToPlan();
assert.equal(calls.at(-1),'return-to-plan');
active=false;const before=calls.length;
result.again();result.home();result.returnToPlan();
assert.equal(calls.length,before,'stale result actions cannot mutate navigation or rewards');
console.log('PASS_V271_VUE_ACTION_CONTRACTS header/setup/result/stale/dialog/plan');
