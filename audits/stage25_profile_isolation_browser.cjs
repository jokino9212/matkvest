'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const FILE='file://'+path.resolve('index.html');

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let fails=0;
 try{
  for(const width of [320,390,768]){
   const context=await browser.newContext({viewport:{width,height:780},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   try{
    await page.goto(FILE,{waitUntil:'domcontentloaded'});
    const a=await page.evaluate(()=>{
      openProfiles();
      document.getElementById('newProfileName').value='Ученик A';
      createProfile();
      state.xp=107;state.coins=203;
      progressFor('g7:rational_numbers_forms').best[0]=3;
      persistSilently();
      startG7QuizStage('g7:rational_numbers_forms',0);
      skipNormalQuiz();
      const input=document.getElementById('quizInput');
      if(input){input.value='-13579';input.dispatchEvent(new Event('input',{bubbles:true}))}
      if(!mk872PersistDraft())throw Error('A draft not saved');
      const d=mk872ReadDraft();
      return {name:currentProfile,id:mk872ProfileId(),attempt:d?.attemptId,question:q?.sig||q?.text,
       done:blockSession.done,xp:state.xp,coins:state.coins,best:progressFor('g7:rational_numbers_forms').best[0],
       input:input?.value,storageKey:mk872DraftKey(),draftValid:mk872DraftUsable(d)};
    });
    assert(a.draftValid&&a.attempt,'A missing draft');
    // Verify direct selection cannot override an active learner session.
    const locked=await page.evaluate(()=>{
      profiles['Ученик B']=ensureProfileIdentity({...EMPTY_STATE,courseProgress:{},questionHistory:{}});
      persistSilently();
      const before={name:currentProfile,attempt:blockSession?.attemptId};
      window._profileNames=['Ученик A','Ученик B'];
      selectProfile(1);
      const current={name:currentProfile,attempt:blockSession?.attemptId,dialog:!!document.querySelector('.mk872-training-dialog')};
      const stay=[...document.querySelectorAll('.mk872-training-dialog button')].find(b=>b.textContent.includes('Остаться'));
      stay?.click();
      return {before,current,after:{name:currentProfile,attempt:blockSession?.attemptId,dialog:!!document.querySelector('.mk872-training-dialog')}};
    });
    assert(locked.current.dialog,'Switch did not prompt active-attempt protection');
    assert.equal(locked.current.name,a.name,'Switch changed profile with active attempt');
    assert.equal(locked.after.attempt,a.attempt,'Switch lost running attempt');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(80);
    const b=await page.evaluate(()=>{
      const dlg=document.querySelector('.mk872-training-dialog');
      if(dlg){const later=[...dlg.querySelectorAll('button')].find(b=>b.textContent.includes('Позже'));later?.click()}
      openProfiles();
      const names=window._profileNames;
      selectProfile(names.indexOf('Ученик B'));
      if(currentProfile!=='Ученик B')throw Error('Could not switch to B');
      if(mk872ReadDraft())throw Error('Profile A draft leaked into B');
      state.xp=333;state.coins=777;
      progressFor('g7:rational_numbers_forms').best[0]=1;
      persistSilently();
      startG7QuizStage('g7:rational_numbers_forms',0);
      skipNormalQuiz();
      const input=document.getElementById('quizInput');
      if(input){input.value='9876';input.dispatchEvent(new Event('input',{bubbles:true}))}
      if(!mk872PersistDraft())throw Error('B draft not saved');
      const d=mk872ReadDraft();
      return {name:currentProfile,id:mk872ProfileId(),attempt:d?.attemptId,question:q?.sig||q?.text,
       done:blockSession.done,xp:state.xp,coins:state.coins,best:progressFor('g7:rational_numbers_forms').best[0],
       input:input?.value,storageKey:mk872DraftKey(),draftValid:mk872DraftUsable(d)};
    });
    assert(b.draftValid&&b.attempt,'B missing draft');
    assert.notEqual(a.id,b.id,'Two students share same profile ID');
    assert.notEqual(a.storageKey,b.storageKey,'Draft localStorage keys collided');
    assert.notEqual(a.attempt,b.attempt,'Two students share attempt ID');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(80);
    const aReturn=await page.evaluate(()=>{
      const dialog=document.querySelector('.mk872-training-dialog');
      if(dialog)[...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Позже'))?.click();
      openProfiles();selectProfile(window._profileNames.indexOf('Ученик A'));
      const d=mk872ReadDraft();
      return {name:currentProfile,id:mk872ProfileId(),draft:d?.attemptId,
       xp:state.xp,coins:state.coins,best:progressFor('g7:rational_numbers_forms').best[0],
       dValid:d?mk872DraftUsable(d):false,otherDraft:!!mk872ReadDraft(profiles['Ученик B'].profileId)};
    });
    assert.equal(aReturn.name,'Ученик A');
    assert.equal(aReturn.draft,a.attempt,'A draft lost on B→A');
    assert.equal(aReturn.xp,a.xp,'A XP overwritten');
    assert.equal(aReturn.coins,a.coins,'A coins overwritten');
    assert.equal(aReturn.best,a.best,'A progress overwritten');
    assert(aReturn.otherDraft,'B draft removed when switching back to A');
    await page.waitForTimeout(70);
    const restoredA=await page.evaluate(()=>{
      const d=mk872ReadDraft();
      mk872RestoreDraft(d);
      return {name:currentProfile,attempt:blockSession?.attemptId,
       question:q?.sig||q?.text,done:blockSession?.done,
       input:document.getElementById('quizInput')?.value};
    });
    assert.equal(restoredA.attempt,a.attempt,'Restored A wrong attempt');
    assert.equal(restoredA.question,a.question,'Restored A wrong question');
    assert.equal(restoredA.done,a.done,'Restored A wrong progress');
    if(a.input!==undefined)assert.equal(restoredA.input,a.input,'Restored A wrong input');
    // Another reload, then switching back to B must load only B's data/draft.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(80);
    const bReturn=await page.evaluate(()=>{
      const dialog=document.querySelector('.mk872-training-dialog');
      if(dialog)[...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Позже'))?.click();
      openProfiles();selectProfile(window._profileNames.indexOf('Ученик B'));
      const d=mk872ReadDraft();
      return {name:currentProfile,id:mk872ProfileId(),draft:d?.attemptId,
        xp:state.xp,coins:state.coins,best:progressFor('g7:rational_numbers_forms').best[0],
        dValid:d?mk872DraftUsable(d):false};
    });
    assert.equal(bReturn.name,'Ученик B');
    assert.equal(bReturn.draft,b.attempt);
    assert.equal(bReturn.xp,b.xp);
    assert.equal(bReturn.coins,b.coins);
    assert.equal(bReturn.best,b.best);
    assert(bReturn.dValid,'B draft cannot be resumed');
    if(errors.length)throw Error('JS errors '+errors.slice(0,5).join(' | '));
    console.log('PASS_STAGE25',JSON.stringify({width,a,b,locked,aReturn,restoredA,bReturn,errors}));
   }catch(e){fails++;console.error('FAIL_STAGE25',JSON.stringify({width,error:String(e),stack:String(e.stack||'').slice(0,1800)}))}
   await context.close();
  }
 }finally{await browser.close()}
 console.log('STAGE25_SUMMARY',JSON.stringify({expected:3,failures:fails}));
 if(fails)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
