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
  const selected=['frac_add','frac_sub','mixed_add','mixed_sub','frac_equal','frac_reduce','frac_common_lcm','frac_add_diff','frac_sub_diff','frac_mul_common','frac_div_common','frac_part_number','frac_restore','dec_place','dec_compare','dec_add','dec_sub','dec_round','dec_mul10','dec_div10','dec_mul_nat','dec_div_nat','dec_mul_dec','dec_div_dec','dec_to_common','percent','percent_whole','average'];
  const old=blockSession;
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
      blockSession={key:'g5:'+id,kind:'course',stageIndex:stage,done:family,total:[5,7,10][stage]};
      const found=new Map();let skipped=0;
      for(let attempt=0;attempt<120&&found.size<12;attempt++){
       const q=makeG5Question(id);if(visual(q.text)||q.choices?.some(c=>visual(c.label))){skipped++;continue}
       const expression=academicHtmlPlain(q.text),labels=q.choices?.map(choicePlain),answer=q.choices?.findIndex(c=>String(c.key)===String(q.ans));
       const explanation=academicHtmlPlain(q.ex);
       if(!expression||expression.length>500||!explanation||explanation.length>2500||!labels||labels.length<2||labels.length>4||labels.some(x=>!x||x.length>160)||new Set(labels).size!==labels.length||answer<0){skipped++;continue}
       const signature=JSON.stringify([expression,[...labels].sort()]);
       if(!found.has(signature))found.set(signature,{expression,answer,choices:labels.map((_,i)=>i),choice_labels:labels,steps:[explanation],source_template:String(q.templateId||'base')});
      }
      if(found.size<3){failure={stage,family,unique:found.size,skipped};break}
      families.push([...found.values()]);
     }
     if(!failure)stages.push(families);
    }
    if(failure)rejected[id]=failure;else banks['g5:'+id]={title:title.get(id),stages};
   }
  }finally{blockSession=old;}
  return {build,fraction,decimal,mandatory,banks,rejected};
 },build);
 assert.equal(out.build,build);assert.equal(new Set(out.fraction).size,out.fraction.length);assert.equal(new Set(out.decimal).size,out.decimal.length);assert(Object.keys(out.banks).length>=8);
 const target=resolve(__dirname,'../v307-learning-fixtures');mkdirSync(target,{recursive:true});writeFileSync(resolve(target,'v306-text-question-bank.json'),JSON.stringify(out,null,2)+'\n');
 console.log('V307_CURRICULUM',JSON.stringify({fraction:out.fraction,decimal:out.decimal,mandatory:out.mandatory.length,accepted:Object.keys(out.banks),rejected:out.rejected}));
 await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
