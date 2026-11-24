'use strict';
const assert=require('node:assert/strict');
const {profileDialogActions}=require('../assets/ui/legacy-vue-actions.js');
const calls=[],record=key=>(...args)=>{calls.push([key,...args]);return key};
let live=true,blocked=false;
const profile=profileDialogActions({isCurrent:()=>live&&!blocked,profileCount:3,
 close:record('close'),shop:record('shop'),collection:record('collection'),
 edit:record('edit'),select:record('select'),create:record('create')});
assert.deepEqual(Object.keys(profile),['close','shop','collection','edit','select','create']);
for(const key of ['close','shop','collection','edit','create'])assert.equal(profile[key](),key);
assert.equal(profile.select(0),'select');
assert.equal(profile.select(2),'select');
const size=calls.length;
for(const index of [-1,3,99,NaN,1.25,'1',null,undefined])assert.equal(profile.select(index),undefined);
assert.equal(calls.length,size,'Only valid profile indices can select');
live=false;
for(const key of Object.keys(profile))profile[key](0);
assert.equal(calls.length,size,'Detached profile dialog ignores all gestures');
live=true;blocked=true;
for(const key of Object.keys(profile))profile[key](1);
assert.equal(calls.length,size,'Confirmation dialog blocks profile actions');
blocked=false;
const fresh=profileDialogActions({isCurrent:()=>true,profileCount:1,
 close:record('new-close'),shop:record('new-shop'),collection:record('new-collection'),
 edit:record('new-edit'),select:record('new-select'),create:record('new-create')});
assert.notEqual(fresh,profile);
assert.equal(fresh.select(0),'new-select');
assert.equal(fresh.select(1),undefined);
console.log('PASS_V278_PROFILE_ACTION_CONTRACTS select/create/close/enter/shop/collection/stale/invalid-index');
