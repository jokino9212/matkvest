'use strict';
const assert=require('node:assert/strict');
const api=require('../assets/ui/legacy-vue-actions.js');
const calls=[];
let current=true,blocked=false;
const actions={
 back(){calls.push(['back']);return 1},
 open(id){calls.push(['open',id]);return id},
 search(value){calls.push(['search',value]);return value},
 formatDate(value){calls.push(['format',value]);return 'time'},
 missing:null
};
const bound=api.analyticsViewActions({isCurrent:()=>current&&!blocked,actions});
assert.deepEqual(Object.keys(bound),Object.keys(actions));
assert.equal(bound.open('g5:natural'),'g5:natural');
assert.equal(bound.search('дробь'),'дробь');
assert.equal(bound.formatDate(123),'time');
assert.equal(bound.missing,null);
current=false;
let size=calls.length;
for(const key of ['back','open','search','formatDate'])bound[key]('ignored');
assert.equal(calls.length,size,'Stale knowledge-map and grade actions must not run');
current=true;blocked=true;
bound.open('g8:invalid');bound.back();
assert.equal(calls.length,size,'Blocked navigation actions must not run');
blocked=false;
const fresh=api.analyticsViewActions({isCurrent:()=>true,actions});
assert.notStrictEqual(fresh,bound,'New mount needs fresh bound actions');
assert.equal(fresh.back(),1);
assert.deepEqual(calls.slice(0,4),[
 ['open','g5:natural'],['search','дробь'],['format',123],['back']
]);
assert.equal(typeof api.teacherViewActions,'function');
assert.equal(typeof api.reportSurfaceActions,'function');
console.log('PASS_V277_ANALYTICS_ACTION_CONTRACTS grade/map/detail/stale/blocked/fresh/fallback');
