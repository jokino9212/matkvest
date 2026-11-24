'use strict';
const assert=require('node:assert/strict');
const {leaderboardDialogActions}=require('../assets/ui/legacy-vue-actions.js');
let live=true,revision=1;
const calls=[],helpArg={id:'help-opener'};
const guarded=leaderboardDialogActions({isCurrent:()=>live&&revision===1,
 close:()=>{calls.push('close');return 'closed'},
 help:opener=>{calls.push(opener);return 'help'}});
assert.equal(guarded.help(helpArg),'help');
assert.equal(guarded.close(),'closed');
assert.deepEqual(calls,[helpArg,'close']);
revision=2;
assert.equal(guarded.help(helpArg),undefined);
assert.equal(guarded.close(),undefined);
assert.equal(calls.length,2);
const fresh=leaderboardDialogActions({isCurrent:()=>live,close:()=>calls.push('new-close'),
 help:x=>calls.push(x)});
assert.equal(fresh.help(helpArg),3);
live=false;
fresh.close();fresh.help(helpArg);
assert.equal(calls.length,3);
console.log('PASS_V283_LEADERBOARD_ACTION_CONTRACTS help/close/focus-opener/revision/detached');
