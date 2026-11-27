'use strict';
// Exact pinned public runtime only. Export no student/session data.
// Preserve the original prompt, SVG, tables, fractions and choice markup as inert structured nodes.
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
  const selected=G5_FRACTIONS.map(t=>t.id).filter(id=>!['frac_to_mixed','mixed_to_frac','frac_common_lcm'].includes(id)).concat(['dec_place']);
  const old=blockSession,oldQid=qid;
  const fraction=G5_FRACTIONS.map(t=>t.id),decimal=G5_DECIMALS.map(t=>t.id),mandatory=g5AllTopics().map(t=>t.id);
  const title=new Map([...G5_FRACTIONS,...G5_DECIMALS].map(t=>[t.id,t.title]));
  const banks={},rejected={},diagnostics={};
  const tags=new Set('div span b strong i em small br p sup sub table caption thead tbody tr th td ul ol li svg g rect circle ellipse line polyline polygon path text tspan title desc defs marker lineargradient radialgradient stop clippath pattern use'.split(' '));
  const attr=new Set('class style role aria-label aria-hidden aria-labelledby aria-describedby id title scope colspan rowspan width height viewbox xmlns preserveaspectratio x y x1 y1 x2 y2 cx cy r rx ry d points fill fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity opacity transform font-size font-weight font-family text-anchor dominant-baseline alignment-baseline dx dy marker-start marker-end marker-mid markerwidth markerheight markerunits refx refy orient offset stop-color stop-opacity gradientunits gradienttransform xlink:href href clip-path clip-rule fill-rule patternunits patterntransform'.split(' '));
  const styles=new Set('width max-width min-width height max-height min-height overflow overflow-x overflow-y margin margin-top margin-bottom margin-left margin-right padding padding-top padding-bottom padding-left padding-right display text-align vertical-align border border-width border-style border-color border-radius border-collapse border-spacing background background-color color font-size font-weight font-family line-height letter-spacing white-space gap row-gap column-gap align-items justify-content grid-template-columns grid-template-rows flex flex-wrap flex-direction flex-shrink box-sizing opacity'.split(' '));
  function nodes(markup){
   const t=document.createElement('template');t.innerHTML=String(markup??'');
   const visit=n=>{
    if(n.nodeType===3)return n.data;
    if(n.nodeType!==1)throw Error('NODE_'+n.nodeType);
    const tag=n.localName.toLowerCase();if(!tags.has(tag))throw Error('TAG_'+tag);
    const a={};
    for(const x of n.attributes){
     const key=x.name.toLowerCase(),v=x.value;if(!attr.has(key))throw Error('ATTR_'+key);
     if(key==='style'){
      const st={};for(const p of n.style){if(p==='-webkit-border-horizontal-spacing'||p==='-webkit-border-vertical-spacing'){if(!/^\d+(?:\.\d+)?px$/.test(n.style.getPropertyValue(p)))throw Error('INVALID_BORDER_SPACING');st['border-spacing']=n.style.getPropertyValue('-webkit-border-horizontal-spacing')+' '+n.style.getPropertyValue('-webkit-border-vertical-spacing');continue;}const value=n.style.getPropertyValue(p);if(!styles.has(p)||/[{}<>;]|url\s*\(|expression|@import/i.test(value))throw Error('STYLE_'+p);st[p]=value;}a.style=st;
     }else{
      if((key==='href'||key==='xlink:href')&&!/^#[\w.-]+$/.test(v))throw Error('HREF');
      if(/url\s*\(/i.test(v)&&!/^url\(#[\w.-]+\)$/.test(v))throw Error('URL');
      if(/[<>]/.test(v)&&!key.startsWith('aria-'))throw Error('ATTR_VALUE_'+key);
      a[x.name]=v;
     }
    }
    return {tag:n.localName,attrs:a,children:[...n.childNodes].filter(x=>x.nodeType!==8).map(visit)};
   };
   return [...t.content.childNodes].filter(x=>x.nodeType!==8).map(visit);
  }
  const rejectedReasons={};
  try{
   for(const id of selected){
    const stages=[];let failure=null;
    for(let stage=0;stage<3&&!failure;stage++){
     const families=[];
     for(let family=0;family<5;family++){
      blockSession={key:'g5:'+id,kind:'course',stageIndex:stage,done:family,total:[5,7,10][stage]};qid='g5:'+id;
      const found=new Map();let skipped=0;
      for(let attempt=0;attempt<120&&found.size<12;attempt++){
       const q=makeG5Question(id);let prompt,solution,labelsTree;try{prompt=nodes(q.text);solution=nodes(q.ex);labelsTree=q.choices?.map(c=>nodes(c.label));}catch(e){rejectedReasons[id]??={};rejectedReasons[id][e.message]=(rejectedReasons[id][e.message]||0)+1;skipped++;continue;}
       const expression=academicHtmlPlain(q.text),explanation=academicHtmlPlain(q.ex);
       if(!expression||expression.length>4000||!explanation||explanation.length>8000){skipped++;continue}
       const common={expression,steps:[explanation],prompt,solution,source_template:String(q.templateId||'base')};
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
        if(!evaluation?.valid||!evaluation.ok){diagnostics[id]??={};diagnostics[id].evaluation??={raw,evaluation};skipped++;continue}
        const expected={...raw};delete expected.stage18Fraction;
        row={...common,rational:{n,d,kind,reduced:!!q.requireReduced,...(kind==='exact'?{exact_n:form.n,exact_d:form.d}:{}),expected}};
       }else if(!q.answerMode||q.answerMode==='choice'){
        const labels=q.choices?.map(choicePlain),answer=q.choices?.findIndex(c=>String(c.key)===String(q.ans));
        if(!labels||labels.length<2||labels.length>4||labels.some(x=>x.length>1000)||new Set(labelsTree.map(x=>JSON.stringify(x))).size!==labels.length||answer<0){skipped++;continue}
        row={...common,answer,choices:labels.map((_,i)=>i),choice_labels:labels,choice_nodes:labelsTree};
       }else {skipped++;continue}
       const signature=JSON.stringify([expression,prompt,row.choice_nodes?row.choice_nodes.map(x=>JSON.stringify(x)).sort():row.rational]);
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
  return {build,fraction,decimal,mandatory,banks,rejected,diagnostics,rejectedReasons};
 },build);
 console.log('V307_RATIONAL_DIAGNOSTICS',JSON.stringify({accepted:Object.keys(out.banks),rejected:out.rejected,diagnostics:out.diagnostics,rejectedReasons:out.rejectedReasons}));assert.equal(out.build,build);assert.equal(new Set(out.fraction).size,out.fraction.length);assert.equal(new Set(out.decimal).size,out.decimal.length);assert.equal(Object.keys(out.banks).length,24);assert.deepEqual(out.rejected,{});
 const target=resolve(__dirname,'../v307-learning-fixtures');mkdirSync(target,{recursive:true});writeFileSync(resolve(target,'v306-visual-question-bank.json'),JSON.stringify(out,null,2)+'\n');
 console.log('V307_RATIONAL_CURRICULUM',JSON.stringify({fraction:out.fraction,decimal:out.decimal,mandatory:out.mandatory.length,accepted:Object.keys(out.banks),rejected:out.rejected}));
 await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
