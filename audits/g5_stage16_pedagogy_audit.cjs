'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
const page=await browser.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const data=await page.evaluate(()=>{
const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],rows=[],bad=[];
function family(s){
 s=stripHtmlText(String(s||'')).toLowerCase();
 if(/ошибк|исправ/.test(s))return 'find-error';
 if(/какой|какая|выбери|определи|запиши|назови|как называется|на сколько|сколько существует|сколько .* среди/.test(s))return 'decide';
 if(/сравни|больше|меньше|равн|упорядоч/.test(s))return 'compare';
 if(/сколько|было|осталось|купил|продали|шли|прошёл|тратили|верёвк|привязали|сока|тетрад/.test(s))return 'word';
 if(/вычисли|найди значение|реши|сложи|вычти|раздели|умножь/.test(s))return 'compute';
 return 'other';
}
for(const topic of topics)for(let stage=0;stage<3;stage++){
const sessions=[];const all={}, examples={};
for(let run=0;run<48;run++){
blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic.id;
const stems=[],kinds=[],templates=[];
for(let pos=0;pos<5;pos++){
blockSession.done=pos;
try{
const q=freshQuiz(qid),text=stripHtmlText(q.text||''),tpl=String(q.templateId||'base'),kind=family(text),
stem=text.toLowerCase().replace(/[-+]?\d+(?:[.,/]\d+)*/g,'#').replace(/\s+/g,' ').trim();
stems.push(stem);kinds.push(kind);templates.push(tpl);
all[tpl]=(all[tpl]||0)+1;
if(!examples[tpl])examples[tpl]={text:text.slice(0,210),answer:String(q.correctText||''),level:q.mk5Audit?.level};
}catch(e){bad.push({id:topic.id,stage,run,pos,error:String(e)})}
}
const uniq=a=>new Set(a).size;
sessions.push({uniqueStems:uniq(stems),uniqueFamilies:uniq(kinds),uniqueTemplates:uniq(templates),kinds,templates,stems});
}
const avg=key=>+(sessions.reduce((s,v)=>s+v[key],0)/sessions.length).toFixed(2);
rows.push({topic:topic.id,stage,avgStems:avg('uniqueStems'),avgFamilies:avg('uniqueFamilies'),avgTemplates:avg('uniqueTemplates'),
monoFamilySessions:sessions.filter(s=>s.uniqueFamilies===1).length,monoTemplateSessions:sessions.filter(s=>s.uniqueTemplates===1).length,
allFamily:[...new Set(sessions.flatMap(s=>s.kinds))],types:all,examples,
repeatedStems:sessions.filter(s=>s.uniqueStems<3).length});
}
return {topics:topics.length,rows,bad};
});
assert.equal(data.topics,53);assert.equal(data.rows.length,159);assert.equal(data.bad.length,0);
assert.deepEqual(errs,[]);
const ranked=data.rows.slice().sort((a,b)=>b.monoTemplateSessions-a.monoTemplateSessions||a.avgTemplates-b.avgTemplates||a.avgStems-b.avgStems);
const result={topics:53,configs:159,questions:53*3*48*5,monotemplateConfigs:ranked.filter(x=>x.monoTemplateSessions===48).length,
highMonotemplate:ranked.filter(x=>x.monoTemplateSessions>=24),
ranked:ranked.slice(0,60)};
fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage16_pedagogy_audit.json',JSON.stringify(result,null,2));
console.log('STAGE16_PEDAGOGY_SUMMARY',JSON.stringify({topics:result.topics,questions:result.questions,monotemplateConfigs:result.monotemplateConfigs,highMonotemplate:result.highMonotemplate.map(x=>({topic:x.topic,stage:x.stage,mono:x.monoTemplateSessions,avgTypes:x.avgTemplates,examples:Object.values(x.examples).slice(0,3)})).slice(0,50)}));
console.log('STAGE16_PEDAGOGY_PASS');
}finally{await browser.close()}
})().catch(e=>{console.error('STAGE16_PEDAGOGY_FAIL',e.stack||e);process.exit(1)});
