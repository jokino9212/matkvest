'use strict';
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {readFileSync} = require('node:fs');
const {createServer} = require('node:http');
const {resolve, extname, sep} = require('node:path');
const {chromium} = require('playwright');

const sha = body => createHash('sha256').update(body).digest('hex');
function build(root, requested) {
  let html = readFileSync(resolve(root, 'index.html'));
  let worker = readFileSync(resolve(root, 'sw.js'), 'utf8');
  const original = Number(worker.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)"/)[1]);
  assert.equal(sha(html), worker.match(/const APP_BUILD_HASH = "([0-9a-f]+)"/)[1]);
  const hashes = JSON.parse(worker.match(/const SCRIPT_HASHES = (\{[^\n]+\});/)[1]);
  for (const [file, digest] of Object.entries(hashes)) {
    assert.equal(sha(readFileSync(resolve(root, file))), digest, file);
  }
  if (requested !== undefined) {
    html = Buffer.from(html.toString().replaceAll('?v=' + original, '?v=' + requested));
    worker = worker.replace('matkvest-iphone-v' + original, 'matkvest-iphone-v' + requested)
      .replace(/const APP_BUILD_HASH = "[0-9a-f]+"/, `const APP_BUILD_HASH = "${sha(html)}"`);
  }
  return {root, html, worker, version: requested ?? original, hashes};
}
const oldRoot = resolve(process.argv[2]);
const newRoot = resolve(process.argv[3]);
const baseline = build(oldRoot), candidate = build(newRoot);
const compatible = process.argv[4] ? build(resolve(process.argv[4])) : null;
const rollback = compatible || build(oldRoot, 267), recovery = build(newRoot, 268);
const mounts = new Map();
const mime = {'.js':'text/javascript', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png'};
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const [, mount, ...parts] = url.pathname.split('/');
  const slot = mounts.get(mount);
  const file = parts.join('/');
  const bust = url.searchParams.has('mk-build');
  if (!slot) return response.writeHead(404).end();
  const stale = slot.stale === 'all' || (slot.stale === 'unversioned' && !bust);
  const build = stale ? baseline : slot.release;
  if (bust) slot.retries.add(file);
  const send = (type, body) => response.writeHead(200, {'Content-Type':type,'Cache-Control':'no-store'}).end(body);
  if (file === 'sw.js') return send('text/javascript', slot.release.worker);
  if (!file || file === 'index.html') return send('text/html; charset=utf-8', build.html);
  const path = resolve(build.root,file);
  if (!path.startsWith(build.root + sep)) return response.writeHead(404).end();
  try { return send(mime[extname(file)] || 'application/octet-stream',readFileSync(path)); }
  catch {return response.writeHead(404).end();}
});

const activeName = 'Проверка Один', otherName = 'Проверка Два';
const draftDialog = page => page.getByRole('alertdialog',{name:/незавершённая тренировка/});
async function version(page, build, vue) {
  await page.waitForFunction(number => navigator.serviceWorker.controller &&
    document.querySelector('#appVersionBadge')?.textContent === `Сборка v${number}`,build.version);
  if (vue) await page.waitForFunction(() => !!document.querySelector('[data-v-app]'));
  assert.equal(await page.evaluate(async buildName => {
    const cache = await caches.open(`matkvest-iphone-v${buildName}`);
    return (await cache.keys()).filter(key => key.url.includes('__matkvest_snapshot__/')).length;
  },build.version),Object.keys(build.hashes).length+1);
}
async function activate(page, build, vue) {
  try {
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
  } catch(error) {
    if (!/Execution context was destroyed/.test(String(error))) throw error;
  }
  await version(page,build,vue);
}
async function createProfile(page, name) {
  await page.evaluate(() => openProfiles());
  await page.locator('#newProfileName').fill(name);
  await page.locator('#newProfileName').press('Enter');
  await page.waitForFunction(label => currentProfile === label, name);
}
async function switchProfile(page, name) {
  await page.evaluate(() => openProfiles());
  await page.locator('.profile-row').filter({hasText:name}).getByRole('button',{name:'Выбрать',exact:true}).press('Enter');
  await page.waitForFunction(label => currentProfile === label, name);
}
async function solveQuick(page) {
  const answer = await page.evaluate(() => String(quickQuestion.correct));
  await page.locator('#quickStage').getByRole('button',{name:answer,exact:true}).press('Space');
  await page.locator('#quickFeedback').getByText(/Верно!/).waitFor();
}
async function startQuick(page, trainer) {
  await page.evaluate(id => openQuickTrainer(id),trainer);
  await page.locator('#quickStage').getByRole('button',{name:'Начать тренировку',exact:true}).press('Enter');
  await page.locator('.quick-answer').first().waitFor();
}
async function finishQuick(page) {
  await page.locator('#quickStage').getByRole('button',{name:'Завершить тренировку',exact:true}).press('Enter');
  await page.locator('#quickStage').getByRole('heading',{name:'Тренировка завершена!',exact:true}).waitFor();
}
async function startTable(page) {
  await page.evaluate(() => {openGrade(4);startTableStage(0);});
  await page.locator('#fin').waitFor();
}
async function fillTable(page) {
  const answer = await page.evaluate(() => String(ta*tb));
  await page.locator('#fin').fill(answer);
  return answer;
}
async function solveTable(page) {
  await fillTable(page);
  await page.locator('#tablePrimary').press('Enter');
  await page.locator('#tfb').getByText(/Верно!/).waitFor();
}
async function completeSchoolHistory(page) {
  await startTable(page);
  const count=await page.evaluate(() => blockSession.total);
  for (let i=0;i<count;i++) {
    await solveTable(page);
    await page.locator('#tablePrimary').press('Enter');
  }
  assert((await page.evaluate(() => progressFor('table').best[0]))>0);
  await page.evaluate(() => renderHome());
}
function snapshot(page) {
  return page.evaluate(() => {
    const keys = ['profileId','xp','coins','solved','mistakes','streak','bestStreak',
      'courseProgress','inventory','equipped','achievementUnlocks','trainingHistory','trainingAggregates'];
    const qualify=key=>/^g[1-8]:/.test(key)?key:'g4:'+key;
    function report(p) {
      const completed=(p.attemptHistory||[]).filter(r=>r.status==='finished').map(r=>[r.id,qualify(r.key),r.done,r.correct,r.endedAt]);
      return {...Object.fromEntries(keys.map(key=>[key,p[key]??null])),completed};
    }
    return {active:currentProfile, profiles:Object.fromEntries(Object.entries(profiles).map(([name,p])=>[name,report(name===currentProfile?state:p)]))};
  });
}
function draftState(page,kind) {
  return page.evaluate(kind => {
    if (kind==='school') return {id:blockSession.attemptId, item:blockSession.currentItem?.itemId || blockSession.items.at(-1).itemId,
      prompt:blockSession.currentItem?.prompt || blockSession.items.at(-1).prompt, done:blockSession.done, correct:blockSession.correct,
      a:ta,b:tb,value:document.querySelector('#fin').value,solved:tableSolved};
    return {id:quickSession.recordId, item:quickQuestion.instanceId, prompt:quickQuestion.text,config:quickSession.selectedConfig,
      settled:quickQuestionSettled,answered:quickSession.answered,correct:quickSession.correct,coins:quickSession.earnedCoins,xp:quickSession.earnedXP};
  },kind);
}
async function resumeOffline(page,context,kind,expected,vue=true) {
  await context.setOffline(true);
  await page.reload();
  const dialog = draftDialog(page);
  await dialog.getByRole('button',{name:'Продолжить',exact:true}).press('Enter');
  await page.locator((kind==='school'?'#tstage':'#quickStage')+(vue?'[data-v-app]':'')).waitFor();
  assert.deepEqual(await draftState(page,kind),expected);
}
async function finishAndVerify(page,kind,advanced,during,build,vue){
  if (kind==='school') {
    if (!advanced.solved) {
      await page.locator('#tablePrimary').press('Enter');
      await page.locator('#tfb').getByText(/Верно!/).waitFor();
    }
    const {total,done}=await page.evaluate(() => blockSession);
    for(let i=done;i<total;i++) {
      await page.locator('#tablePrimary').press('Enter'); await solveTable(page);
    }
    await page.locator('#tablePrimary').press('Enter');
  } else {
    await finishQuick(page);
  }
  const ended=await snapshot(page);
  assert.equal(ended.profiles[activeName].completed.filter(row=>row[0]===advanced.id).length,1);
  if (kind==='quick') assert.equal(ended.profiles[activeName].trainingHistory.length,during.profiles[activeName].trainingHistory.length+1);
  for(let i=0;i<2;i++) {
    await page.reload(); await version(page,build,vue);
    assert.deepEqual(await snapshot(page),ended);
    assert.equal(await draftDialog(page).count(),0);
  }
  await page.evaluate(() => renderHome());
  const report=page.locator(vue?'#modal .vue-report[data-v-app]':'#modal');
  if (vue) {
    await page.locator('#homeDashboard button[data-home-action="progress"]').press('Enter');
    await report.getByRole('heading',{name:'Мой учебный прогресс',exact:true}).waitFor();
    assert.equal(await report.locator('.mk19f-grade-row').count(),8);
    await page.keyboard.press('Escape');
  }
  await page.evaluate(() => openTrainingHistory());
  await report.getByRole('heading',{name:/Последние тренировки/}).waitFor();
  assert.equal(await report.locator('.training-history-row').count(),ended.profiles[activeName].trainingHistory.length);
}
async function scenario(browser,width,kind,steps) {
  const mount=kind+width+(steps||'');
  const slot={release:baseline,stale:null,retries:new Set()};
  mounts.set(mount,slot);
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage(), pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  try {
    const address=`http://127.0.0.1:${server.address().port}/${mount}/`;
    await page.goto(address); await version(page,baseline,false);
    await createProfile(page,otherName);
    await createProfile(page,activeName);
    await page.reload(); await version(page,baseline,false);
    await switchProfile(page,otherName);
    await startQuick(page,'squares'); await solveQuick(page); await finishQuick(page);
    await page.locator('#quickStage').getByRole('button',{name:'На главную',exact:true}).press('Enter');
    await switchProfile(page,activeName);
    await startQuick(page,'addition'); await solveQuick(page); await finishQuick(page);
    await page.locator('#quickStage').getByRole('button',{name:'На главную',exact:true}).press('Enter');
    await completeSchoolHistory(page);
    if (kind==='school') {
      await startTable(page); await solveTable(page);
      await page.locator('#tablePrimary').press('Enter'); await fillTable(page);
    } else {
      await startQuick(page,'squares'); await solveQuick(page);
    }
    const first=await draftState(page,kind);
    const saved=await snapshot(page);
    assert.equal(saved.active,activeName);
    assert.notEqual(saved.profiles[activeName].profileId,saved.profiles[otherName].profileId);
    const ownIds=new Set(saved.profiles[activeName].completed.map(row=>row[0]));
    assert(saved.profiles[otherName].completed.every(row=>!ownIds.has(row[0])));
    for(const name of [activeName,otherName]) {
      assert(saved.profiles[name].xp>0 && saved.profiles[name].coins>0);
      assert(saved.profiles[name].completed.length>0 && saved.profiles[name].trainingHistory.length>0);
    }
    assert(await page.evaluate(() => mk872PersistDraft() && mk872ReadDraft().schema===1));
    console.log('BASELINE',width,kind,first.id);

    slot.release=candidate;
    if (steps==='stale') {
      slot.stale='all';
      await page.evaluate(async () => {
        const registration=await navigator.serviceWorker.getRegistration();
        await registration.update();
        const worker=registration.installing;
        if(worker && worker.state!=='redundant') await new Promise(resolve=>{
          worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve();});
        });
      });
      await version(page,baseline,false);
      assert(slot.retries.has('index.html'));
      assert.deepEqual(await draftState(page,kind),first);
      console.log('PASS_REJECT_STALE',width,kind,slot.retries.size);
      slot.retries.clear();
      slot.stale='unversioned';
    }
    await activate(page,candidate,true);
    if (steps==='stale') {
      assert(slot.retries.has('index.html') && slot.retries.has('assets/ui/knowledge-map.js'));
      console.log('PASS_RETRY_SHA',width,kind,slot.retries.size);
    }
    slot.stale=null;
    assert.deepEqual(await snapshot(page),saved);
    if (steps==='legacy') {
      assert(await page.evaluate(()=>mk872ReadDraft().schema===1));
      slot.release=rollback;
      await activate(page,rollback,false);
      assert(!(await page.locator('#homeDashboard[data-v-app]').count()));
      await resumeOffline(page,context,kind,first,false);
      assert(await page.evaluate(()=>mk872ReadDraft().schema===2));
      assert.deepEqual(await snapshot(page),saved);
      await finishAndVerify(page,kind,first,saved,rollback,false);
      assert.deepEqual(pageErrors,[]);
      console.log('PASS_ROLLBACK_V1',width,kind);
      return;
    }
    await resumeOffline(page,context,kind,first);
    assert(await page.evaluate(() => mk872ReadDraft().schema===2));
    assert.deepEqual(await snapshot(page),saved);
    if (kind==='school') {
      await page.locator('#tablePrimary').press('Enter');
      await page.locator('#tfb').getByText(/Верно!/).waitFor();
      assert.equal((await draftState(page,kind)).done,first.done+1);
    } else {
      await page.locator('#quickNextBtn').press('Enter');
      await solveQuick(page);
      assert.equal((await draftState(page,kind)).answered,first.answered+1);
    }
    const advanced=await draftState(page,kind), during=await snapshot(page);
    assert(during.profiles[activeName].xp>saved.profiles[activeName].xp);
    await resumeOffline(page,context,kind,advanced);
    assert.deepEqual(await snapshot(page),during);
    console.log('PASS_V208_V266',width,kind,first.id);

    const draftKey=await page.evaluate(() => mk872DraftKey());
    await context.setOffline(false);
    slot.release=rollback;
    await activate(page,rollback,false);
    await context.setOffline(true); await page.reload(); await version(page,rollback,false);
    assert.equal(await page.locator('#homeDashboard[data-v-app]').count(),0);
    const rollbackState=await snapshot(page);
    assert.deepEqual(rollbackState,during);
    const draftAfter=await page.evaluate(key=>{
      const raw=JSON.parse(localStorage.getItem(key));
      return {rawId:raw?.attemptId,schema:raw?.schema,readable:!!mk872ReadDraft()};
    },draftKey);
    assert.deepEqual(draftAfter,{rawId:advanced.id,schema:2,readable:!!compatible});
    const cacheNames=await page.evaluate(() => caches.keys());
    assert(cacheNames.includes('matkvest-iphone-v266') && cacheNames.includes('matkvest-iphone-v267'));
    assert(!cacheNames.includes('matkvest-iphone-v208'));
    if (compatible) {
      await resumeOffline(page,context,kind,advanced,false);
      assert.deepEqual(await snapshot(page),during);
      console.log('PASS_ROLLBACK_V2',width,kind,advanced.id);
    } else {
      assert.equal(await draftDialog(page).count(),0);
      console.log('REPRO_ROLLBACK_CANNOT_RESUME_V2',width,kind,advanced.id);
      if (steps==='overwrite') {
        await startQuick(page,'cubes'); await solveQuick(page);
        const replacement=await page.evaluate(() => quickSession.recordId);
        assert.notEqual(replacement,advanced.id);
        await page.waitForFunction(({key,id})=>{
          const raw=JSON.parse(localStorage.getItem(key));
          return raw?.attemptId===id && raw.schema===1;
        },{key:draftKey,id:replacement});
        console.log('REPRO_ROLLBACK_REPLACES_EXISTING_DRAFT',width,kind);
        return;
      }

      await context.setOffline(false);
      slot.release=recovery;
      await activate(page,recovery,true);
      await resumeOffline(page,context,kind,advanced);
      assert.deepEqual(await snapshot(page),during);
    }
    await finishAndVerify(page,kind,advanced,during,compatible?rollback:recovery,!compatible);
    assert.deepEqual(pageErrors,[]);
    console.log(compatible?'PASS_ROLLBACK_FINISHED_ONCE':'PASS_RECOVERY_ONCE',width,kind,advanced.id);
  } finally {await context.close();}
}

async function checkSchoolForms(browser,width,kind){
  const mount=`form-${kind}-${width}`;
  const slot={release:candidate,stale:null,retries:new Set()};
  mounts.set(mount,slot);
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/${mount}/`);
    await version(page,candidate,true);
    await page.evaluate(kind=>{
      if(kind==='fraction'){openGrade(5);startG5QuizStage('frac_to_mixed',0);return}
      openGrade(4);
      if(kind==='division'){startColumnStage('div',0);return}
      if(kind==='control'){
        const target={...analyticsTopicMeta('g4:numbers'),stageIndex:0};
        startControlReviewBlock([target,target,target],4);
      }else startQuizStage('numbers',0);
    },kind);
    const fraction=kind==='fraction',division=kind==='division';
    const host=page.locator(division?'#stage':'#qstage');
    const input=host.locator(division?'input[data-exp]:not(.mark-in)':'#quizFracWhole');
    const choices=host.locator('.answers > button');
    let correctChoice;
    if(fraction){
      await input.fill('15');
      await host.locator('#quizFracNum').fill('2');
    }else if(division){
      const digits=await input.evaluateAll(fields=>fields.map(field=>field.dataset.exp));
      for(const [index,digit] of digits.entries())await input.nth(index).fill(digit);
      await input.last().fill(String((Number(digits.at(-1))+1)%10));
      await host.locator('#columnPrimary').press('Enter');
      assert.match(await input.last().getAttribute('class'),/\bbad\b/);
    }else{
      await choices.first().waitFor();
      correctChoice=await page.evaluate(()=>q.choices.findIndex(choice=>String(choice.key)===String(q.ans)));
      const wrong=correctChoice===0?1:0;
      await choices.nth(wrong).press('Space');
      assert.match(await choices.nth(wrong).getAttribute('class'),/\bbad\b/);
    }
    const read=()=>page.evaluate(()=>{
      if(!mk872PersistDraft())throw Error('Expected an active saved school attempt');
      const d=mk872ReadDraft(), {block}=d.values;
      return {attemptId:d.attemptId,itemId:block.currentItem.itemId,prompt:block.currentItem.prompt,
        checks:block.currentItem.checks,view:d.view,done:block.done,xp:state.xp,coins:state.coins};
    });
    const expected=await read();
    slot.release=rollback;
    await activate(page,rollback,false);
    await context.setOffline(true);
    await page.reload();
    await draftDialog(page).getByRole('button',{name:'Продолжить',exact:true}).press('Enter');
    assert.deepEqual(await read(),expected);
    if(fraction){
      const {numerator,denominator}=await page.evaluate(()=>{
        const given=document.querySelector('#qstage .quizq .frac');
        return {numerator:Number(given.querySelector('.num').textContent),denominator:Number(given.querySelector('.den').textContent)};
      });
      await input.fill(String(Math.floor(numerator/denominator)));
      await host.locator('#quizFracNum').fill(String(numerator%denominator));
      await host.locator('#quizCheck').press('Enter');
    }else if(division){
      const digit=await input.last().getAttribute('data-exp');
      await input.last().fill(digit);
      await host.locator('#columnPrimary').press('Enter');
    }else await choices.nth(correctChoice).press('Enter');
    await host.locator('.next-ready').waitFor();
    const settled=()=>page.evaluate(()=>{
      const item=blockSession.items.at(-1);
      return {attempt:blockSession.attemptId,item:item.itemId,done:blockSession.done,correct:item.finalCorrect,xp:state.xp,coins:state.coins};
    });
    const scored=await settled();
    assert.deepEqual([scored.attempt,scored.item,scored.done,scored.correct],[expected.attemptId,expected.itemId,1,true]);
    await page.reload();
    await draftDialog(page).getByRole('button',{name:'Продолжить',exact:true}).press('Enter');
    await host.locator('.next-ready').waitFor();
    assert.deepEqual(await settled(),scored);
    assert.deepEqual(errors,[]);
    console.log('PASS_ROLLBACK_SCHOOL_FORM',width,kind);
  } finally {await context.close();}
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.MATKVEST_CHROMIUM||undefined,headless:true});
  try {
    const runs=[[390,'school','stale'],[390,'quick'],[1280,'school','stale'],[1280,'quick']];
    // Mount separately to model continuing to use the rolled-back app after an incident.
    if(!compatible)await scenario(browser,390,'school','overwrite');
    const suites=[runs];
    if (compatible) suites.push([390,1280].flatMap(width=>['school','quick'].map(kind=>[width,kind,'legacy'])));
    for (const suite of suites) {
      const outcomes=await Promise.allSettled(suite.map(args=>scenario(browser,...args)));
      for(const outcome of outcomes) if (outcome.status==='rejected') {console.error(outcome.reason);process.exitCode=1;}
    }
    if (compatible) for (const width of [390,1280]) {
      const outcomes=await Promise.allSettled(['choice','fraction','division','control'].map(kind=>checkSchoolForms(browser,width,kind)));
      for (const outcome of outcomes) if (outcome.status==='rejected') {console.error(outcome.reason);process.exitCode=1;}
    }
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
