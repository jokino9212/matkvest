'use strict';
const assert = require('node:assert/strict');
const core = require('../assets/ui/legacy-navigation-core.js');
const history = {
  state: null, writes: [],
  pushState(value) { this.state = value; this.writes.push('push'); },
  replaceState(value) { this.state = value; this.writes.push('replace'); },
};
assert.deepEqual(core.currentRoute(null), { screen: 'home' });
assert.equal(core.currentDepth(null), 0);
assert.equal(core.writeHistory(history, { screen: 'grade', grade: 4 }), true);
assert.equal(core.currentDepth(history.state), 1);
assert.equal(core.writeHistory(history, { screen: 'grade', grade: 4 }), false);
assert.deepEqual(history.writes, ['push']);
assert.equal(core.writeHistory(history, { screen: 'topic', grade: 4, topicId: 'x' }), true);
assert.equal(core.currentDepth(history.state), 2);
assert.equal(core.writeHistory(history, { screen: 'home' }, 'replace'), true);
assert.equal(core.currentDepth(history.state), 2);
assert.deepEqual(history.writes, ['push', 'push', 'replace']);
assert.equal(core.currentDepth({ __matkvest854: true, depth: -3 }), 0);
const oldAction = () => 'old', newAction = () => 'new';
const original = { next: oldAction, back: () => 'back' };
const actions = core.freshVueActions(original, { next: newAction });
assert.equal(actions.next(), 'new');
assert.equal(actions.back(), 'back');
assert.equal(original.next(), 'old');
assert.equal(core.freshVueActions({ next: oldAction }).next(), 'old');
assert.equal(core.freshVueActions({ next: newAction }).next(), 'new');
const broken = { state: null, pushState() { throw Error('blocked'); } };
let notified = false;
assert.equal(core.writeHistory(broken, { screen: 'grade', grade: 1 }, 'push', () => { notified = true; }), false);
assert.equal(notified, true);

assert.equal(core.shouldDeferRestore({screen:'grade',grade:4}),true);
assert.equal(core.shouldDeferRestore({screen:'topic',grade:'8'}),true);
assert.equal(core.shouldDeferRestore({screen:'grade',grade:10}),false);
assert.equal(core.shouldDeferRestore({screen:'trainer'}),false);
assert.equal(core.shouldDeferRestore({screen:'chest'}),true);
assert.equal(core.shouldDeferRestore(null),false);
const called = [];
const handlers = {
  home:route=>{called.push('home');return route.screen;},
  grade:route=>{called.push('grade:'+route.grade);return route.grade;},
  trainer:()=>{called.push('trainer');return 'trainer';},
  other:route=>{called.push('other:'+route.screen);return route.screen==='custom';},
};
assert.equal(core.dispatchRoute({screen:'grade',grade:7},handlers),7);
assert.equal(core.dispatchRoute({screen:'trainer'},handlers),'trainer');
assert.equal(core.dispatchRoute({screen:'custom'},handlers),true);
assert.equal(core.dispatchRoute({screen:'unhandled'},handlers),'home');
assert.equal(core.dispatchRoute(null,handlers),'home');
assert.deepEqual(called,['grade:7','trainer','other:custom','other:unhandled','home','home']);
const runA=()=>1,runB=()=>2,back=()=>3;
assert.equal(core.homeVueActions(runA).run(),1);
assert.equal(core.homeVueActions(runB).run(),2);
assert.notStrictEqual(core.homeVueActions(runA),core.homeVueActions(runA));
assert.equal(core.trainingPlanReturnVueActions(back).returnToPlan(),3);
console.log('PASS: route state/history and fresh Vue actions contracts');
