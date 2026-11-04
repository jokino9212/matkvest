import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const expected='2252fe792fbef2ba6b1a4d0794ae674164f55f3260496af1156660b986b5ae16';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==expected)throw Error('Unexpected HTML version '+sha);
if(!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('SW SHA mismatch');
const bin=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:bin,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const report={phase:'16C',builtFrom:sha,createdAt:new Date().toISOString(),checks:[],defects:[],browserErrors:errors,summary:{}};
const bad=(where,kind,q,expected,got)=>{if(report.defects.length<100)report.defects.push({where,kind,text:String(q.text??'').replace(/<[^>]+>/g,' ').slice(0,350),expected,got,model:q.audit?.model??null});};
try{
  await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  const audits=await page.evaluate(()=>{
    const targets=['g2:operations_100','g2:word_problems','g2:geometric_quantities'];
    const result={cases:[],flags:[],errors:[]};
    const eq=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<1e-9;
    const evaluate=(id,m)=>{
      if(!m||typeof m!=='object')return null;
      if(id==='g2:operations_100'){
        if('m1' in m&&'m2' in m)return {value:m.a+m.m1*m.m2,extra:[['product',m.m1*m.m2]]};
        if('division' in m)return {value:m.a-m.division/m.divisor,extra:[['quotient',m.division/m.divisor]]};
        if('sum' in m)return {value:(m.a+m.b)/m.divisor,extra:[['sum',m.a+m.b]]};
        if('c' in m)return {value:m.a+m.b-m.c,extra:[['mid',m.a+m.b]]};
        return null;
      }
      if(id==='g2:word_problems'){
        switch(m.kind){
          case 'add':return {value:m.a+m.b};
          case 'sub':return {value:m.a-m.b};
          case 'two_add_sub':return {value:m.a+m.b-m.c,extra:[['mid',m.a+m.b]]};
          case 'two_sub_add':return {value:m.a-m.b+m.c,extra:[['mid',m.a-m.b]]};
          case 'mul':return {value:m.groups*m.each,extra:[['total',m.groups*m.each]]};
          case 'div':return {value:m.total/m.groups,extra:[['total',m.groups*m.each]]};
          case 'two_mul_add':return {value:m.groups*m.each+m.extra,extra:[['product',m.groups*m.each]]};
        }
        return null;
      }
      if(id==='g2:geometric_quantities'){
        const perimeter=x=>x.shape==='rectangle'?2*(x.a+x.b):x.shape==='square'?4*x.a:x.shape==='triangle'?x.a+x.b+x.c:null;
        if(m.shape==='rectangle'||m.shape==='square'||m.shape==='triangle'){
          const p=perimeter(m);
          const extra=[['perimeter',p]];
          if(m.answer!==undefined&&m.hidden!==undefined)extra.push(['answer',[m.a,m.b,m.c][m.hidden]]);
          return {value:p,field:'perimeter',extra};
        }
        if(m.left&&m.right){
          const p1=perimeter(m.left),p2=perimeter(m.right);
          return {value:p1,field:'p1',extra:[['p2',p2],['answer',p1>p2?'A':p2>p1?'B':'=']]};
        }
        if('a' in m&&'unit' in m)return {value:m.a,field:'a'};
      }
      return null;
    };
    const push=(where,kind,q,expected,got)=>{
      if(result.flags.length<80)result.flags.push({where,kind,text:String(q.text??'').replace(/<[^>]+>/g,' ').slice(0,300),expected,got,model:q.audit?.model??null});
    };
    for(const id of targets){
      const row={id,levels:[],total:0,verified:0,unrecognized:0,types:{}};
      for(let d=0;d<3;d++){
        let tested=0,verified=0,skipped=0,answerVerified=0,choiceVerified=0;const tpl={};
        for(let i=0;i<650;i++){
          let q;try{q=makeG2Question(id,d);}catch(e){push(id+':'+d,'generation-exception',{text:''},'valid question',String(e));continue;}
          tested++;const type=String(q?.audit?.templateId??'unknown');tpl[type]=(tpl[type]||0)+1;row.types[type]=(row.types[type]||0)+1;
          if(!q||!q.text||!q.audit?.model){push(id+':'+d,'missing-model',q??{text:''},'audit model','missing');continue;}
          const m=q.audit.model,s=evaluate(id,m);
          if(!s){skipped++;continue;}
          const expected=s.value,field=s.field??'result';
          if(!eq(expected,m[field]))push(id+':'+d,'incorrect-'+field,q,expected,m[field]);
          else verified++;
          for(const [name,v] of s.extra??[])if(typeof v==='string'?m[name]!==v:!eq(v,m[name]))push(id+':'+d,'incorrect-'+name,q,v,m[name]);
          const ans=q.answer??q.answerRat??q.ans;
          if(typeof ans==='number'||(typeof ans==='string'&&/^-?\d+(?:[.,]\d+)?$/.test(ans))){
            // For selections checking an intermediate step, only compare canonical numeric answers
            // for result-bearing templates.
            if(!['choose_first','choose_record','choose_action','restore_step','find_error','compare_perimeters','missing_triangle_side','missing_square_side'].includes(type)){
              const got=Number(String(ans).replace(',','.'));
              if(field==='result'&&!eq(got,expected))push(id+':'+d,'incorrect-numeric-answer',q,expected,got);
              answerVerified++;
            }
          }
          if(Array.isArray(q.choices)&&q.choices.length&&ans!=null&&typeof ans!=='object'){
            if(!q.choices.some(c=>String(c.key??c.value??c.label)===String(ans)))push(id+':'+d,'answer-absent-from-choices',q,ans,q.choices.map(c=>c.key??c.value??c.label));
            else choiceVerified++;
          }
        }
        row.levels.push({level:d,tested,verified,skipped,answerVerified,choiceVerified,templates:tpl});
        row.total+=tested;row.verified+=verified;row.unrecognized+=skipped;
      }
      result.cases.push(row);
    }
    const grammar={id:'g1:word_problems',total:0,patterns:0,casesByLevel:[]};
    const badCase=/(?:дали|убрали|добавили|сняли|поставили|взяли|положили)\s+(?:ещё\s+)?(?:1|21|31|41|51|61|71|81|91)\s+книга(?=[\s.,!?;:]|$)/i;
    for(let d=0;d<3;d++){
      let count=0,observed=0;
      for(let i=0;i<1800;i++){
        const q=makeG1Question('g1:word_problems',d);
        count++;const t=String(q?.text??'').replace(/<[^>]+>/g,' ');
        if(badCase.test(t)){observed++;push('g1:word_problems:'+d,'wrong-accusative',q,'1 книгу after an action',t);}
      }
      grammar.total+=count;grammar.patterns+=observed;grammar.casesByLevel.push({level:d,tested:count,wrongCase:observed});
    }
    result.grammar=grammar;
    return result;
  });
  report.checks=audits.cases;report.grammar=audits.grammar;report.defects=audits.flags;
  const total=audits.cases.reduce((s,c)=>s+c.total,0);
  const verified=audits.cases.reduce((s,c)=>s+c.verified,0);
  report.summary={generated:total+audits.grammar.total,mathModelsVerified:verified,mathModelsUnrecognized:audits.cases.reduce((s,c)=>s+c.unrecognized,0),grammarG1Checked:audits.grammar.total,grammarWrong:audits.grammar.patterns,defectSamples:audits.flags.length,browserErrors:errors.length};
  console.log('STAGE16 C SUMMARY',JSON.stringify(report.summary));
  for(const r of report.checks)console.log('MODEL',JSON.stringify(r));
  console.log('G1 GRAMMAR',JSON.stringify(report.grammar));
  for(const x of report.defects.slice(0,18))console.log('SUSPECT',JSON.stringify(x));
  if(report.defects.length||errors.length)process.exitCode=1;
}catch(e){report.defects.push({fatal:String(e),stack:String(e.stack).slice(0,2000)});console.error(e);process.exitCode=1;}
finally{fs.writeFileSync('audits/g1g2_stage16_phaseC_report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
