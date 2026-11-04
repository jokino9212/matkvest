import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v47')||!sw.includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('Stage17D v47 PWA hash mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium not installed');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),jsErrors=[];
page.on('pageerror',e=>jsErrors.push(String(e)));
const report={phase:'17D-quality-batch4',sha256:hash,at:new Date().toISOString(),rows:[],ui:[],errors:[],jsErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const x=await page.evaluate(()=>{
  const ids=['compare_order','mass','money'],N=500,rows=[],failures=[],ui=[];
  const add=(kind,data)=>{if(failures.length<180)failures.push({kind,...data})};
  const clean=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const cmp=(a,b)=>a<b?'<':a>b?'>':'=';
  const moneyValue=(rub,kop)=>rub*100+kop;
  const answer=q=>String(q?.ans??q?.answer??'');
  const num=q=>Number(answer(q));
  const numCheck=(expected,q,context)=>{
   if(!Number.isInteger(expected)||num(q)!==expected)
     add('independent-answer',{...context,expected,actual:answer(q)});
  };
  const choiceCheck=(q,context)=>{
   const ch=q.choices??[];
   if(!ch.length)return;
   const keys=ch.map(v=>String(v.key??v.value??v.label));
   if(keys.filter(x=>x===answer(q)).length!==1||new Set(keys).size!==keys.length)add('choices',{...context,keys,answer:answer(q)});
  };
  for(const id of ids)for(let d=0;d<3;d++){
   const row={id,d,generated:N,verified:0,variants:{},structural:new Set(),prompts:new Set(),mathChecks:0};
   for(let i=0;i<N;i++){
    let q;try{q=makeG3Question('g3:'+id,d)}catch(e){add('generation-exception',{id,d,i,error:String(e)});continue}
    const a=q?.audit??{},v=String(a.variant??(d===0?'convert':'unknown')),prompt=clean(q?.text),exp=clean(q?.ex),ctx={id,d,i,variant:v};
    row.variants[v]=(row.variants[v]??0)+1;
    row.prompts.add(prompt);row.structural.add(prompt.replace(/\d+/g,'#'));
    if(!prompt||!exp||!q?.sig||answer(q)==='')add('incomplete',{...ctx,prompt,exp});
    if(/(?:коп|руб)\.\s*\./u.test(prompt+' '+exp))add('double-unit-period',ctx);
    choiceCheck(q,ctx);
    if(id==='compare_order'){
     if(d===2&&q.audit?.type==='g3Order'){
      const values=a.values??[],sorted=[...values].sort((x,y)=>a.ascending?x-y:y-x);
      if(values.length!==4||new Set(values).size!==4||sorted.some(x=>x<100||x>999)||answer(q)!==sorted.join(', '))
        add('order-four-independent',{...ctx,values,ascending:a.ascending,ans:answer(q)});
      row.variants.order=(row.variants.order||0)+1;
      row.mathChecks++;
     }else{
      const left=a.leftBase,right=a.rightBase,correct=cmp(left,right);
      if(!Number.isInteger(left)||!Number.isInteger(right)||answer(q)!==correct||a.correct!==correct)add('compare-independent',{...ctx,left,right,correct,ans:answer(q)});
      if(d===0&&(v!=='direct'||a.a<10||a.a>99||a.b<10||a.b>99))add('easy-compare-model',{...ctx,a});
      if(d===1){
       if(v==='changeTens'){
        if(a.delta%10||a.delta<10||left!==(a.add?a.a+a.delta:a.a-a.delta)||right!==a.b||!/Сначала/.test(exp))
          add('medium-extra-reasoning',{...ctx,a,prompt,exp});
       }else if(v!=='direct')add('unexpected-medium-compare',{...ctx,a});
      }
      if(d===2){
       if(v!=='expressions'||left!==a.a+a.plus||right!==a.b-a.minus||a.plus%10||a.minus%10)
         add('hard-two-expression-compare',{...ctx,a});
      }
      row.mathChecks++;
     }
    }
    if(id==='mass'){
     if(d===0){
      const m=q.sig.match(/:convert:(\d+):(кг|г):(кг|г)$/);
      if(!m)add('mass-convert-sig',{...ctx,sig:q.sig});
      else{const amount=+m[1],from=m[2],to=m[3];if(from===to||num(q)!==(from==='кг'?amount*1000:amount/1000))add('mass-convert-math',{...ctx,amount,from,to,answer:answer(q)})}
     }
     if(d===1){
      if(v==='compare'){
       const left=a.kg*1000,right=a.g;
       if(answer(q)!==cmp(left,right)||a.leftBase!==left||a.rightBase!==right)add('mass-compare-model',{...ctx,a,answer:answer(q)});
      }else if(v==='mixed'){numCheck(a.kg*1000+a.g,q,ctx)}
      else add('unexpected-medium-mass',{...ctx,a});
     }
     if(d===2){
      if(v==='afterTaking'){
       const expected=a.kg*1000+a.g-a.taken;
       numCheck(expected,q,ctx);
       if(expected<=0||a.starting!==a.kg*1000+a.g||!prompt.includes(String(a.taken)))add('mass-after-taking',{...ctx,a,prompt});
      }else if(v==='twoBags'){
       const first=a.kgA*1000+a.gA,second=a.kgB*1000+a.gB,expected=first-second;
       numCheck(expected,q,ctx);
       if(expected<=0||a.gramsA!==first||a.gramsB!==second||a.kgA<=a.kgB)add('mass-two-bags',{...ctx,a});
      }else add('unexpected-hard-mass',{...ctx,a});
      if(q.answerMode!=='number')add('mass-hard-input-mode',{...ctx,mode:q.answerMode});
     }
     row.mathChecks++;
    }
    if(id==='money'){
     if(d===0){
      const m=q.sig.match(/:convert:(\d+):(руб\.|коп\.):(руб\.|коп\.)$/);
      if(!m)add('money-convert-sig',{...ctx,sig:q.sig});
      else{const amount=+m[1],from=m[2],to=m[3];if(from===to||num(q)!==(from==='руб.'?amount*100:amount/100))add('money-convert-math',{...ctx,amount,from,to,answer:answer(q)})}
     }
     if(d===1){
      if(v==='mixed'){numCheck(moneyValue(a.rub,a.kop),q,ctx)}
      else if(v==='compare'){
       const first=a.rub*100,second=a.kop;
       if(answer(q)!==cmp(first,second)||a.leftBase!==first||a.rightBase!==second)add('money-medium-compare',{...ctx,a,answer:answer(q)});
      }else add('unexpected-money-medium',{...ctx,a});
     }
     if(d===2){
      if(v==='change'){
       const cost=moneyValue(a.costRub,a.costKop),paid=a.paidRub*100;
       numCheck(paid-cost,q,ctx);
       if(a.cost!==cost||a.paid!==paid||paid<=cost)add('money-change-model',{...ctx,a});
      }else if(v==='wallet'){
       const balance=moneyValue(a.balanceRub,a.balanceKop),spent=moneyValue(a.spentRub,a.spentKop);
       numCheck(balance-spent,q,ctx);
       if(a.balance!==balance||a.spent!==spent||balance<=spent)add('money-wallet-model',{...ctx,a});
      }else add('unexpected-money-hard',{...ctx,a});
      if(q.answerMode!=='number')add('money-hard-input-mode',{...ctx,mode:q.answerMode});
     }
     row.mathChecks++;
    }
    row.verified++;
   }
   row.uniquePrompts=row.prompts.size;row.shapes=row.structural.size;
   delete row.prompts;delete row.structural;
   if(row.verified!==N||row.mathChecks!==N)add('coverage',{id,d,verified:row.verified,checked:row.mathChecks,expected:N});
   if(d>0&&Object.keys(row.variants).filter(z=>z!=='order').length<2&&id!=='compare_order')add('no-multiple-models',{id,d,variants:row.variants});
   if(id==='compare_order'&&d===1&&(!row.variants.changeTens||!row.variants.direct))add('missing-medium-compare-variants',{id,d,variants:row.variants});
   if(id==='compare_order'&&d===2&&(!row.variants.order||!row.variants.expressions))add('missing-hard-compare-variants',{id,d,variants:row.variants});
   if(d>0&&id!=='compare_order'&&Object.values(row.variants).some(z=>z<45))add('underrepresented-variant',{id,d,variants:row.variants});
   if(row.uniquePrompts<15)add('too-few-prompts',{id,d,unique:row.uniquePrompts});
   rows.push(row);
  }
  for(const id of ids)for(let d=0;d<3;d++){
   try{
    startG3QuizStage('g3:'+id,d);
    const quiz=!!document.querySelector('#qstage .quizq'),numeric=!!document.querySelector('#quizInput'),
      choices=!!document.querySelector('#qstage .quizchoices,#qstage .quizopts,#qstage button[data-answer]'),
      overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
    ui.push({id,d,quiz,numeric,choices,overflow});
    if(!quiz||overflow>60||(d===2&&id!=='compare_order'&&!numeric))
      add('unavailable-ui',{id,d,quiz,numeric,choices,overflow});
   }catch(e){add('ui-exception',{id,d,error:String(e)})}
  }
  return {rows,failures,ui};
 });
 report.rows=x.rows;report.errors=x.failures;report.ui=x.ui;
 report.summary={generated:x.rows.reduce((s,r)=>s+r.verified,0),independentMath:x.rows.reduce((s,r)=>s+r.mathChecks,0),ui:x.ui.length,uiReady:x.ui.filter(v=>v.quiz&&v.overflow<=60).length,errors:x.failures.length,jsErrors:jsErrors.length};
 console.log('BATCH4',JSON.stringify(report.summary));
 console.log('MODELS',JSON.stringify(report.rows.map(r=>({id:r.id,d:r.d,variants:r.variants,unique:r.uniquePrompts,shapes:r.shapes}))));
 if(x.failures.length)console.log('BATCH4 FAILURES',JSON.stringify(x.failures.slice(0,18)));
 if(report.summary.generated!==4500||report.summary.independentMath!==4500||report.summary.uiReady!==9||report.summary.errors||jsErrors.length)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1500)});console.error('BATCH4 FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch4_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
