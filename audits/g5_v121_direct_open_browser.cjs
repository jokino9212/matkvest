'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-textbook-navigation-v121.js"><\/script>/g)||[]).length,1);
 assert(!html.includes('<script src="g5-textbook-navigation-v120.js"></script>'));
 assert(sw.includes('"./g5-textbook-navigation-v121.js"'));
 assert(!sw.includes('"./g5-textbook-navigation-v120.js"'));
 assert(sw.includes('matkvest-iphone-v121'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let total=0;
 try{
 for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   renderGrade5();
   const issues=[],check=(ok,msg)=>{if(!ok)issues.push(msg)};
   const nav=mainView.querySelector('#mk-g5-textbook-nav'),rows=[...nav.querySelectorAll('.mk-g5-toc-list li')];
   check(rows.length===51,'Missing textbook paragraphs');
   check(g5AllTopics().length===74,'Missing existing Grade 5 cards');
   check(window.mkG5TextbookNavigation?.version===121,'Wrong nav version');
   check(nav.querySelectorAll('input').length===0,'Duplicate search inside textbook menu');
   const upper=mainView.querySelector('#mk-textbook-search-input-5');
   check(!!upper,'Upper topic search missing');
   const allButtons=[...nav.querySelectorAll('button.mk-g5-toc-link')];
   check(allButtons.length>=51,'Missing textbook topic actions');
   check(allButtons.every(b=>g5AllTopics().some(t=>t.id===b.dataset.topicId)),'Missing direct topic identifiers');
   // Test topics in the first volume and across fractions/decimals in the second volume.
   const cases=['natural','natural_divide','division_remainder','simplify_expressions','expand_brackets','cuboid','frac_parts','frac_to_mixed','mixed_to_frac','dec_add','dec_compare','calculator'];
   for(const id of cases){
     const trigger=nav.querySelector('[data-topic-id="'+id+'"]');
     if(!trigger){issues.push('Missing topic action '+id);continue}
     // Open parent accordion first, exactly as a learner would.
     const chapter=trigger.closest('details');chapter.open=true;
     let cardScrolls=0;
     const originals=new Map();
     for(const card of mainView.querySelectorAll('.g5-card')){
       originals.set(card,card.scrollIntoView);
       card.scrollIntoView=function(){cardScrolls++};
     }
     trigger.click();
     for(const [card,method] of originals)card.scrollIntoView=method;
     const modal=document.getElementById('modal');
     const heading=modal?.querySelector('h2')?.textContent||'';
     const expected=g5AllTopics().find(t=>t.id===id)?.title;
     check(!!modal&&modal.getClientRects().length>0,'No topic dialog for '+id);
     check(heading.includes(expected),'Wrong dialog for '+id+' expected '+expected+' actual '+heading);
     check(modal?.querySelectorAll('.stage-card').length===3,'Missing three training stages for '+id);
     check(cardScrolls===0,'Accidental scroll to a card for '+id);
     check(document.activeElement?.classList?.contains('g5-card')!==true,'Moved focus to a card for '+id);
     if(typeof closeModal==='function')closeModal();
   }
   // Searching the topic must not break one-click entry.
   if(upper){
    upper.value='деление с остатком';upper.dispatchEvent(new Event('input',{bubbles:true}));
    const trigger=nav.querySelector('[data-topic-id="division_remainder"]');
    trigger?.click();
    check(document.getElementById('modal')?.querySelector('h2')?.textContent.includes('Деление с остатком'),'Search then one click did not open dialog');
    check(upper.value==='','Selecting a topic did not clear the upper search');
    if(typeof closeModal==='function')closeModal();
   }
   check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal overflow at '+innerWidth);
   return {issues,topics:allButtons.length,chapters:nav.querySelectorAll('details').length};
  });
  assert.deepEqual(result.issues,[],JSON.stringify({width,result}));
  assert.deepEqual(errors,[],JSON.stringify({width,errors}));
  total++;
  await page.close();
 }
 console.log('G5_V121_DIRECT_LESSON_NAVIGATION_PASS',JSON.stringify({screens:total,topicsChecked:12,allTopicLinks:'valid'}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V121_DIRECT_LESSON_NAVIGATION_FAIL',e.stack||e);process.exit(1)});
