'use strict';
const assert=require('node:assert/strict');
const {achievementFilterActions}=require('../assets/ui/legacy-vue-actions.js');
let live=true,revision=1;
const calls=[],actions={};
for(const key of ['view','category','sort'])actions[key]=function(value){
 assert.equal(this,actions);calls.push([key,value]);return key
};
const filter=achievementFilterActions({isCurrent:()=>live&&revision===1,
 views:['all','open','locked','legendary'],categories:['all','general','math'],
 sorts:['category','nearest'],actions});
assert.deepEqual(Object.keys(filter),['view','category','sort']);
assert.equal(filter.view('open'),'view');
assert.equal(filter.category('general'),'category');
assert.equal(filter.sort('nearest'),'sort');
const count=calls.length;
for(const key of Object.keys(filter))for(const bad of [undefined,null,0,{},'__proto__','invalid']){
 assert.equal(filter[key](bad),undefined);
}
assert.equal(calls.length,count,'Unrecognized IDs cannot change filters');
revision=2;
for(const key of Object.keys(filter))assert.equal(filter[key]('all'),undefined);
assert.equal(calls.length,count,'Old Vue render callbacks cannot change filters');
const current=achievementFilterActions({isCurrent:()=>live,
 views:['all','open'],categories:['general'],sorts:['nearest'],actions});
assert.equal(current.view('open'),'view');
live=false;
for(const key of Object.keys(current))assert.equal(current[key]('open'),undefined);
assert.equal(calls.length,count+1,'Detached achievement modal cannot change filters');
console.log('PASS_V281_ACHIEVEMENT_ACTION_CONTRACTS view/category/sort/invalid/revision/detached');
