'use strict';
const assert=require('node:assert/strict');
const {storeTabActions}=require('../assets/ui/legacy-vue-actions.js');
let current=true,disabled=false;
const calls=[],actions={select(value){calls.push(value);return value}};
const tabs=storeTabActions({isCurrent:()=>current&&!disabled,
 categories:['avatars','frames','pets','collection','chests','wallet'],actions});
assert.deepEqual(Object.keys(tabs),['select']);
assert.equal(tabs.select('avatars'),'avatars');
assert.equal(tabs.select('collection'),'collection');
assert.equal(tabs.select('chests'),'chests');
const size=calls.length;
for(const invalid of [null,undefined,0,'unknown','__proto__','badges'])
 assert.equal(tabs.select(invalid),undefined);
assert.equal(calls.length,size,'Invalid shop category must not dispatch');
current=false;
for(const key of ['avatars','wallet'])tabs.select(key);
assert.equal(calls.length,size,'Stale shop modal cannot navigate');
current=true;disabled=true;tabs.select('frames');
assert.equal(calls.length,size,'Blocked modal cannot navigate');
disabled=false;
const fresh=storeTabActions({isCurrent:()=>true,categories:['badges'],actions});
assert.equal(fresh.select('badges'),'badges');
assert.equal(fresh.select('collection'),undefined);
assert.deepEqual(calls,['avatars','collection','chests','badges']);
console.log('PASS_V280_STORE_TAB_ACTION_CONTRACTS whitelist/stale/blocked/fresh/native');
