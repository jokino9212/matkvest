'use strict';
const assert=require('node:assert/strict');
const school=require('../assets/ui/legacy-vue-actions.js');
assert.equal(typeof school.schoolTableActions,'function');
assert.equal(typeof school.schoolQuizActions,'function');
let active=true,blocked=false,solved=false,attempt=true;
const log=[],push=(...args)=>log.push(args);
const isCurrent=()=>active&&!blocked;
const table=school.schoolTableActions({
 isCurrent,isSolved:()=>solved,hasAttempt:()=>attempt,
 check:()=>push('table-check'),next:()=>push('table-next'),
 requestSkip:()=>push('table-skip-confirm')
});
table.primary();table.skip();
assert.deepEqual(log,[['table-check'],['table-skip-confirm']]);
solved=true;table.skip();table.primary();
assert.deepEqual(log.at(-1),['table-next']);
attempt=false;solved=false;table.skip();
assert.deepEqual(log.at(-1),['table-next']);
active=false;const size=log.length;
table.primary();table.skip();assert.equal(log.length,size,'stale table clicks must not mutate attempt');
active=true;blocked=true;table.primary();assert.equal(log.length,size,'dialog must block table actions');
blocked=false;
const quiz=school.schoolQuizActions({isCurrent,choose:i=>push('choose',i),check:()=>push('check'),
 skip:()=>push('skip'),next:()=>push('next'),keydown:e=>push('keydown',e.key)});
assert.deepEqual(Object.keys(quiz),['choose','check','skip','next','keydown']);
quiz.choose(3);quiz.check();quiz.skip();quiz.next();quiz.keydown({key:'Enter'});
assert.deepEqual(log.slice(size),[['choose',3],['check'],['skip'],['next'],['keydown','Enter']]);
active=false;const fixed=log.length;
Object.values(quiz).forEach(fn=>fn('blocked'));
assert.equal(log.length,fixed,'stale quiz callbacks must not score or navigate');
active=true;blocked=true;Object.values(quiz).forEach(fn=>fn('dialog'));
assert.equal(log.length,fixed,'dialog must block quiz callbacks');
blocked=false;
const other=school.schoolQuizActions({isCurrent,choose:()=>1,check:()=>2,skip:()=>3,next:()=>4,keydown:()=>5});
assert.notStrictEqual(other,quiz,'callbacks must be fresh per question');
console.log('PASS_V273_SCHOOL_ACTION_CONTRACTS table/quiz/guards/keyboard/no-double-finish');
