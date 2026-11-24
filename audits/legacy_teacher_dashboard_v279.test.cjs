'use strict';
const assert=require('node:assert/strict');
const {teacherDashboardActions}=require('../assets/ui/legacy-vue-actions.js');
let live=true,locked=false;
const calls=[],source={};
for(const key of ['close','search','sort','filter','open','profiles','backup']){
 source[key]=function(...args){assert.equal(this,source);calls.push([key,...args]);return key}
}
const actions=teacherDashboardActions({isCurrent:()=>live&&!locked,actions:source,
 sorts:['name','xp'],filters:['all','g5'],profileIds:['p-1','p-2']});
assert.deepEqual(Object.keys(actions),Object.keys(source));
assert.equal(actions.search('ученик'),'search');
assert.equal(actions.sort('name'),'sort');
assert.equal(actions.filter('g5'),'filter');
assert.equal(actions.open('p-2'),'open');
for(const key of ['profiles','backup','close'])assert.equal(actions[key](),key);
const count=calls.length;
for(const key of ['sort','filter','open'])for(const invalid of [null,0,'invalid','__proto__',undefined])
 assert.equal(actions[key](invalid),undefined);
assert.equal(calls.length,count,'Invalid roster, filter and sort IDs must not dispatch');
live=false;
for(const key of Object.keys(actions))actions[key]('p-1');
assert.equal(calls.length,count,'Stale detached teacher dashboard cannot dispatch');
live=true;locked=true;
for(const key of Object.keys(actions))actions[key]('p-1');
assert.equal(calls.length,count,'Locked mode cannot dispatch');
locked=false;
const fresh=teacherDashboardActions({isCurrent:()=>true,actions:source,
 sorts:['xp'],filters:['all'],profileIds:['p-3']});
assert.equal(fresh.open('p-1'),undefined,'Old roster ID invalid for fresh dashboard');
assert.equal(fresh.open('p-3'),'open');
assert.equal(fresh.sort('xp'),'sort');
assert.equal(fresh.sort('name'),undefined);
assert.notStrictEqual(fresh,actions);
console.log('PASS_V279_TEACHER_DASHBOARD_ACTION_CONTRACTS close/search/sort/filter/roster/backup/stale');
