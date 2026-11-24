'use strict';
const assert=require('node:assert/strict');
const api=require('../assets/ui/legacy-vue-actions.js');
let live=true,blocked=false;
const calls=[];
const isCurrent=()=>live&&!blocked;
const call=name=>(...args)=>{calls.push([name,...args]);return name};
const frame=api.schoolAttemptFrameActions({isCurrent,close:call('frame-close')});
const journal=api.attemptJournalActions({
 isCurrent,close:call('journal-close'),back:call('journal-back'),
 review:call('review'),recordCount:2
});
const emptyJournal=api.attemptJournalActions({
 isCurrent,close:call('journal-close'),back:null,review:call('should-not-call'),recordCount:0
});
const review=api.attemptReviewActions({
 isCurrent,close:call('review-close'),journal:call('review-journal'),result:call('review-result')
});
assert.equal(frame.close(),'frame-close');
assert.equal(journal.review(0),'review');
assert.equal(journal.review(1),'review');
assert.equal(journal.review(-1),undefined);
assert.equal(journal.review(2),undefined);
assert.equal(journal.review('1'),undefined);
assert.equal(journal.review(1.1),undefined);
assert.equal(emptyJournal.review(0),undefined);
assert.equal(journal.back(),'journal-back');
assert.equal(journal.close(),'journal-close');
assert.equal(review.journal(),'review-journal');
assert.equal(review.result(),'review-result');
assert.equal(review.close(),'review-close');
assert.deepEqual(Object.keys(emptyJournal),['close','review']);
const valid=calls.length;
live=false;
frame.close();journal.close();journal.back();journal.review(0);review.close();review.journal();review.result();
assert.equal(calls.length,valid,'Detached screen actions must not navigate or mutate');
live=true;blocked=true;
frame.close();journal.review(1);review.journal();
assert.equal(calls.length,valid,'Open modal dialog must block actions');
blocked=false;
const another=api.schoolAttemptFrameActions({isCurrent,close:()=>42});
assert.notStrictEqual(another,frame);
assert.equal(another.close(),42);
console.log('PASS_V275_FRAME_JOURNAL_ACTION_CONTRACTS close/back/review/guard/invalid-index/no-mutators');
