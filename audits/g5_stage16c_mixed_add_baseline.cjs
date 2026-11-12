'use strict';
/* Stage16C read-only baseline: do not change generators or production. */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result = await page.evaluate(() => {
   const topic = [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(t=>t.id==='mixed_add');
   if (!topic) throw new Error('mixed_add not found; do not guess topic id');
   const stages = [];
   for (let stage=0;stage<3;stage++) {
    const templateCounts={},stories=[],samples=[],signatures=new Set();
    let checked=0,storyCount=0;
    for (let run=0;run<48;run++) {
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     for(let pos=0;pos<5;pos++) {
      blockSession.done=pos;
      const q=freshQuiz(qid);
      const txt=stripHtmlText(String(q.text||''));
      const template=String(q.templateId||'base');
      const signature=txt+'|'+String(q.correctText||'');
      signatures.add(signature);
      checked++;
      templateCounts[template]=(templateCounts[template]||0)+1;
      const hasLifeContext=/(?:метр|килограмм|литр|кг|\bкм\b|\bм\b|\bл\b|книг|лент|пирог|ученик|турист|билет|ткан|яблок|сок|дорожк|магазин|мешк|корзин|взял|купил|прошёл|потратил|осталось)/i.test(txt);
      const isStory=hasLifeContext && !/^\s*(?:вычисли|найди значение|сложи|реши|упрости)\b/i.test(txt);
      if(isStory){storyCount++;if(stories.length<8)stories.push({text:txt,answer:String(q.correctText||''),template})}
      else if(samples.length<5)samples.push({text:txt,answer:String(q.correctText||''),template});
     }
    }
    stages.push({stage,checked,templateCounts,distinctVisibleQuestions:signatures.size,storyCount,storySamples:stories,mathSamples:samples});
   }
   return {topic:'mixed_add',stages,storyRegexHeuristic:true};
  });
  assert.deepEqual(errors,[]);
  for(const s of result.stages) {
   assert.equal(s.checked,240);
   assert(Object.keys(s.templateCounts).length>=3,'lost mathematical template diversity');
   assert(s.distinctVisibleQuestions>=100,'unexpectedly repetitive questions');
  }
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage16c_mixed_add_baseline.json',JSON.stringify(result,null,2));
  console.log('STAGE16C_MIXED_ADD_BASELINE',JSON.stringify(result));
  if(process.env.STAGE16C_REQUIRE_STORIES==='1')
   for(const s of result.stages)assert(s.storyCount>=10,'too few contextual questions at stage '+s.stage);
  console.log('STAGE16C_MIXED_ADD_BASELINE_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE16C_MIXED_ADD_FAIL',e.stack||e);process.exit(1)});
