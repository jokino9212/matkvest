'use strict';
// Exact pinned public runtime only. Export no student/session data.
// Text-only tasks: keep original mathematics and explanations; diagram-bearing prompts are excluded.
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path'),{mkdirSync,writeFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const root=resolve(__dirname,'../v306-fixture'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const build='7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318';
(async()=>{
 assert.equal(createHash('sha256').update(await readFile(resolve(root,'index.html'))).digest('hex'),build);
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
 await page.goto(origin+'/index.html');await page.waitForFunction(()=>typeof makeG5Question==='function'&&typeof mk305FlushWrites==='function');
 const out=await page.evaluate(build=>{
  const selected=G5_FRACTIONS.map(t=>t.id).filter(id=>!['frac_to_mixed','mixed_to_frac','frac_common_lcm','frac_shapes','frac_ray'].includes(id)).concat(['dec_place']);
  const old=blockSession,oldQid=qid;
  const fraction=G5_FRACTIONS.map(t=>t.id),decimal=G5_DECIMALS.map(t=>t.id),mandatory=g5AllTopics().map(t=>t.id);
  const title=new Map([...G5_FRACTIONS,...G5_DECIMALS].map(t=>[t.id,t.title]));
  const banks={},rejected={};
  const visual=s=>/<(?:svg|img|canvas|math|table|video|iframe)\b/i.test(String(s));
  try{
   for(const id of selected){
    const stages=[];let failure=null;
    for(let stage=0;stage<3&&!failure;stage++){
     const families=[];
     for(let family=0;family<5;family++){
      blockSession={key:'g5:'+id,kind:'course',stageIndex:stage,done:family,total:[5,7,10][stage]};qid='g5:'+id;
      const found=new Map();let skipped=0;
      for(let attempt=0;attempt<120&&found.size<12;attempt++){
       const q=makeG5Question(id);if(visual(q.text)||q.choices?.some(c=>visual(c.label))){skipped++;continue}
       const expression=academicHtmlPlain(q.text),explanation=academicHtmlPlain(q.ex);
       if(!expression||expression.length>500||!explanation||explanation.length>2500){skipped++;continue}
       const common={expression,steps:[explanation],source_template:String(q.templateId||'base')};
       let row;
       if(q.answerMode==='fraction'){
        const {n,d}=q.answerRat||{},form=q.stage18AnswerForm||{kind:'any'},kind=form.kind;
        if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||n<0||d<1||n>999999||d>999999||!['any','exact','mixed','improper'].includes(kind)){skipped++;continue}
        let whole='',numerator='',denominator='';
        if(kind==='exact'){if(!Number.isSafeInteger(form.n)||!Number.isSafeInteger(form.d)||form.n<0||form.d<1||form.n>999999||form.d>999999){skipped++;continue}numerator=String(form.n);denominator=String(form.d);}
        else if(kind==='improper'){numerator=String(n);denominator=String(d);}
        else if(d===1){whole=String(n);}
        else if(kind==='mixed'||q.preferMixed&&n>d){whole=String(Math.floor(n/d));numerator=String(n%d);denominator=String(d);}
        else {numerator=String(n);denominator=String(d);}
        const raw={stage18Fraction:true,whole,numerator,denominator},evaluation=quizInputEvaluation(q,raw);
        if(!evaluation?.valid||!evaluation.ok){skipped++;continue}
        const expected={...raw};delete expected.stage18Fraction;
        row={...common,rational:{n,d,kind,reduced:!!q.requireReduced,...(kind==='exact'?{exact_n:form.n,exact_d:form.d}:{}),expected}};
       }else if(!q.answerMode||q.answerMode==='choice'){
        const labels=q.choices?.map(choicePlain),answer=q.choices?.findIndex(c=>String(c.key)===String(q.ans));
        if(!labels||labels.length<2||labels.length>4||labels.some(x=>!x||x.length>160)||new Set(labels).size!==labels.length||answer<0){skipped++;continue}
        row={...common,answer,choices:labels.map((_,i)=>i),choice_labels:labels};
       }else {skipped++;continue}
       const signature=JSON.stringify([expression,row.choice_labels?[...row.choice_labels].sort():row.rational]);
       if(!found.has(signature))found.set(signature,row);
      }
      if(found.size<3){failure={stage,family,unique:found.size,skipped};break}
      families.push([...found.values()]);
     }
     if(!failure)stages.push(families);
    }
    if(failure)rejected[id]=failure;else banks['g5:'+id]={title:title.get(id),stages};
   }
  }finally{blockSession=old;qid=oldQid;}
  return {build,fraction,decimal,mandatory,banks,rejected};
 },build);
 assert.equal(out.build,build);assert.equal(new Set(out.fraction).size,out.fraction.length);assert.equal(new Set(out.decimal).size,out.decimal.length);assert(Object.keys(out.banks).length>=5);
 const target=resolve(__dirname,'../v307-learning-fixtures');mkdirSync(target,{recursive:true});writeFileSync(resolve(target,'v306-rational-question-bank.json'),JSON.stringify(out,null,2)+'\n');
 console.log('V307_RATIONAL_CURRICULUM',JSON.stringify({fraction:out.fraction,decimal:out.decimal,mandatory:out.mandatory.length,accepted:Object.keys(out.banks),rejected:out.rejected}));
 await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
