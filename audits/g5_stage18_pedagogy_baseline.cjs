'use strict';
// Stage18: read-only diagnostic. Candidate deficits are NOT mathematical errors.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
function canonical(s){return String(s||'').toLowerCase().replace(/[-+]?\d+(?:[.,/]\d+)*/g,'#').replace(/\s+/g,' ').trim();}
function genre(t){
 if(/ошибк|исправ/.test(t))return 'error';
 if(/сравни|больше|меньше|упорядоч/.test(t))return 'comparison';
 if(/вычисли|найди значение|реши|сложи|вычти|умножь|раздели/.test(t.slice(0,45)))return 'arithmetic';
 if(/сколько|купил|продал|осталось|потратили|длина|площадь|скорость|время|масса|расстояние|литр|метр|километр|тетрад|лента|турист/.test(t))return 'situational';
 return 'other';
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const raw=await page.evaluate(()=>{
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],rows=[],bad=[];
   for(const topic of topics)for(let stage=0;stage<3;stage++){
    const examples={},templates={},samples=[],sessions=[];
    for(let run=0;run<20;run++){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     const session=[];
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(qid),text=stripHtmlText(String(q.text||'')),answer=String(q.correctText||''),
         template=String(q.templateId||'base');
       if(!text.trim())throw new Error('empty task');
       if(!answer.trim())throw new Error('empty answer');
       templates[template]=(templates[template]||0)+1;
       if(!examples[template])examples[template]={text:text.slice(0,230),answer:answer.slice(0,100)};
       samples.push({text,answer,template});
       session.push(text+'|'+answer);
      }catch(err){bad.push({topic:topic.id,stage,run,pos,error:String(err)});}
     }
     sessions.push(session);
    }
    rows.push({topic:topic.id,stage,templates,examples,samples,sessions});
   }
   return {topics:topics.length,rows,bad};
  });
  assert.deepEqual(pageErrors,[],'browser errors');
  assert.equal(raw.topics,53,'number of grade-five topics changed');
  assert.equal(raw.rows.length,159);
  assert.equal(raw.bad.length,0,JSON.stringify(raw.bad.slice(0,5)));
  const rows=raw.rows.map(r=>{
   const texts=r.samples.map(q=>q.text.toLowerCase());
   const kinds={};
   for(const text of texts){const k=genre(text);kinds[k]=(kinds[k]||0)+1;}
   const distinctStems=new Set(texts.map(canonical)).size;
   const distinctTemplates=Object.keys(r.templates).length;
   const repeatSessions=r.sessions.filter(s=>new Set(s).size!==s.length).length;
   // Context signals are candidates only: not all lesson topics need story problems.
   const contextual=texts.filter(t=>genre(t)==='situational').length;
   const topKind=Math.max(...Object.values(kinds));
   return {topic:r.topic,stage:r.stage,total:r.samples.length,distinctStems,distinctTemplates,
    contextualCandidates:contextual,dominantGenreShare:+(topKind/r.samples.length).toFixed(3),
    repeatSessions,genres:kinds,templates:r.templates,examples:Object.values(r.examples).slice(0,4)};
  });
  const ranked=rows.slice().sort((a,b)=>
   a.distinctTemplates-b.distinctTemplates||
   a.distinctStems-b.distinctStems||
   b.dominantGenreShare-a.dominantGenreShare||
   a.topic.localeCompare(b.topic));
  const result={version:'stage18-read-only',sampleSize:rows.reduce((s,r)=>s+r.total,0),
   topics:raw.topics,configs:rows.length,
   note:'Candidate rankings are diagnostic, not evidence of a math defect. Human inspection of exact stems required.',
   ranked,reviewFirst:ranked.slice(0,25).map(x=>({topic:x.topic,stage:x.stage,distinctTemplates:x.distinctTemplates,distinctStems:x.distinctStems,contextualCandidates:x.contextualCandidates,repeatSessions:x.repeatSessions,genres:x.genres,examples:x.examples}))};
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage18_pedagogy_baseline.json',JSON.stringify(result,null,2));
  console.log('STAGE18_BASELINE_SUMMARY',JSON.stringify({topics:result.topics,configs:result.configs,sampleSize:result.sampleSize,reviewFirst:result.reviewFirst}));
  assert.equal(result.sampleSize,15900);
  console.log('STAGE18_BASELINE_PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error('STAGE18_BASELINE_FAIL',e.stack||e);process.exit(1)});
