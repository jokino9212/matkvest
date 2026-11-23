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
console.log('PASS: route state/history and fresh Vue actions contracts');
