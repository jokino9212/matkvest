'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS];
   const rows=[],faults=[];
   const perTopic={};
   for(const topic of topics)for(let stage=0;stage<3;stage++){
    const counts={};const sample=[], levels=[[],[],[],[],[]];let total=0,three=0,borrows=0,nonborrows=0,word=0;
    for(let run=0;run<36;run++){
     blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid='g5:'+topic.id;
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      let q;try{q=freshQuiz(qid)}catch(e){faults.push({topic:topic.id,stage,pos,error:String(e)});continue}
      const text=stripHtmlText(String(q.text||''));
      const template=String(q.templateId||'base');
      counts[template]=(counts[template]||0)+1;
      levels[pos].push(q.mk5Audit?.level ?? null);
      if(/три дроби/i.test(text))three++;
      if(/ленты|маршрут|пути|отрезк|пирог|полосок|метр|километр/i.test(text))word++;
      if(topic.id==='mixed_sub'){
        const plain=text.replace(/\s+/g,' ');
        const matches=[...plain.matchAll(/(\d+)\s+(\d+)\/(\d+)/g)];
        if(matches.length>=2){
         const a=matches[0],b=matches[1];
         if(+a[3]!==+b[3])faults.push({topic:topic.id,stage,pos,error:'different denominators',text});
         if(+a[2]<+b[2])borrows++;else nonborrows++;
         const result=(+a[1]*+a[3]+ +a[2])-(+b[1]*+b[3]+ +b[2]);
         if(result<=0)faults.push({topic:topic.id,stage,pos,error:'nonpositive result',text});
        }else faults.push({topic:topic.id,stage,pos,error:'cannot parse both mixed fractions',text});
      }
      if(sample.length<5&& !sample.some(x=>x.template===template))
       sample.push({template,example:text.slice(0,190),level:q.mk5Audit?.level,mode:q.answerMode||'choice'});
      total++;
     }
    }
    const uniqueLevels=levels.map(x=>[...new Set(x)]);
    const expected=[[0,0,0,0,1],[0,0,1,1,2],[1,1,2,2,2]][stage];
    if(uniqueLevels.some((arr,i)=>arr.length!==1||arr[0]!==expected[i]))
     faults.push({topic:topic.id,stage,error:'difficulty sequence differs',actual:uniqueLevels,expected});
    rows.push({topic:topic.id,stage,total,types:Object.keys(counts).length,templates:counts,three,word,borrows,nonborrows,sample});
   }
   return {topics:topics.length,rows,faults};
  });
  const get=(id,stage)=>data.rows.find(x=>x.topic===id&&x.stage===stage);
  assert.equal(data.topics,53);
  assert.equal(data.rows.length,159);
  assert.equal(data.rows.reduce((sum,r)=>sum+r.total,0),28620);
  assert.deepEqual(data.faults,[],'content or progression faults');
  for(const stage of [0,1,2]){
   const sub=get('mixed_sub',stage);
   assert.equal(sub.total,180);
   if(stage===0){assert(sub.nonborrows>0,'easy stage should contain subtraction without borrowing')}
   if(stage===1){assert(sub.nonborrows>0&&sub.borrows>0,'middle stage must mix borrowing and nonborrowing')}
   if(stage===2){assert(sub.borrows>0,'advanced stage must include borrowing')}
   assert(get('mixed_compare',stage).types>=2,'mixed comparison lacks structural families');
  }
  for(const id of ['frac_compare_den','frac_compare_num']){
    assert.equal(get(id,0).three,0,'easy stage must use pairwise fraction comparison');
    assert(get(id,2).three>0,'hard stage must include a three-fraction decision');
  }
  assert.deepEqual(errors,[],'page runtime errors');
  const report={topics:data.topics,configs:data.rows.length,questions:28620,
   progression:'expected 0-0-0-0-1 / 0-0-1-1-2 / 1-1-2-2-2',
   mixedSub:data.rows.filter(x=>x.topic==='mixed_sub'),
   fractionCompare:data.rows.filter(x=>['frac_compare_den','frac_compare_num'].includes(x.topic)),
   lowTypes:data.rows.filter(x=>x.types<2),all:data.rows};
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_stage11_difficulty_report.json',JSON.stringify(report,null,2));
  console.log('STAGE11_DIFFICULTY_PASS',JSON.stringify({topics:data.topics,configs:data.rows.length,
    questions:28620,mixedSub:report.mixedSub.map(x=>({stage:x.stage,borrows:x.borrows,nonborrows:x.nonborrows})),
    hardThree:report.fractionCompare.filter(x=>x.stage===2).map(x=>({topic:x.topic,count:x.three})),
    lowTypeConfigs:report.lowTypes.length}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE11_DIFFICULTY_FAIL',e.stack||e);process.exit(1)});
