'use strict';
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const topics=g6AllTopics(),rows=[];
   const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
   const normalize=s=>plain(s).toLocaleLowerCase('ru').replace(/\d+(?:[.,]\d+)*/g,'#').replace(/\s+/g,' ').trim();
   for(const t of topics)for(let stage=0;stage<3;stage++){
    const sessions=[],types=new Map(),issues=[];
    for(let session=0;session<12;session++){
     blockSession={kind:'g6quiz',key:t.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};
     qid=t.id;
     const texts=[],stems=[],templates=[];
     for(let pos=0;pos<5;pos++){
      blockSession.done=pos;
      try{
       const q=freshQuiz(t.id);
       if(!q||!q.text||!q.ex)issues.push({kind:'missing_question_or_explanation',session,pos});
       const stem=plain(q?.text),pattern=normalize(q?.text),id=String(q?.templateId||'unknown');
       texts.push(stem);stems.push(pattern);templates.push(id);
       types.set(id,(types.get(id)||0)+1);
       if(!stem||!String(q?.correctText||q?.ans||'').trim())issues.push({kind:'empty_prompt_or_answer',session,pos});
      }catch(e){issues.push({kind:'generation_error',session,pos,error:String(e)})}
     }
     const distinct=new Set(texts).size,semantic=new Set(stems).size,families=new Set(templates).size;
     sessions.push({distinct,semantic,families});
    }
    rows.push({id:t.id,title:t.title,stage,sessions:sessions.length,exactRepeatSessions:sessions.filter(x=>x.distinct<5).length,oneStemSessions:sessions.filter(x=>x.semantic===1).length,oneFamilySessions:sessions.filter(x=>x.families===1).length,avgSemanticStems:Math.round(100*sessions.reduce((a,x)=>a+x.semantic,0)/sessions.length)/100,families:[...types.entries()].sort((a,b)=>b[1]-a[1]),issues:issues.slice(0,20),issueCount:issues.length});
   }
   return {topics:topics.length,stageRows:rows.length,questions:rows.length*12*5,rows};
  });
  result.pageErrors=errors;fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g6_stage18t_semantic_inventory.json',JSON.stringify(result,null,2)+'\n');
  const ranking=[...result.rows].sort((a,b)=>b.oneStemSessions-a.oneStemSessions||b.oneFamilySessions-a.oneFamilySessions||a.avgSemanticStems-b.avgSemanticStems);
  console.log('G6_SEMANTIC_AUDIT_SUMMARY',JSON.stringify({topics:result.topics,rows:result.stageRows,questions:result.questions,pageErrors:errors,rowsWithIssues:result.rows.filter(x=>x.issueCount).length,exactRepeatSessions:result.rows.reduce((s,x)=>s+x.exactRepeatSessions,0),singleStemSessions:result.rows.reduce((s,x)=>s+x.oneStemSessions,0),singleFamilySessions:result.rows.reduce((s,x)=>s+x.oneFamilySessions,0)}));
  console.log('G6_SEMANTIC_WEAKEST_20',JSON.stringify(ranking.slice(0,20)));
  if(errors.length||result.topics!==58||result.stageRows!==174||result.rows.some(x=>x.issueCount))throw Error('Grade 6 content generation needs repair');
 }finally{await browser.close()}
})().catch(e=>{console.error('G6_SEMANTIC_AUDIT_ERROR',e.stack||e);process.exit(1)});
