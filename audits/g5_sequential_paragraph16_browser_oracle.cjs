'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
function calculate(task){
 const expression=(task.match(/Вычисли:\s*(.+?)\.\s*$/)||[])[1];assert(expression,'No arithmetic '+task);
 const raw=expression.replace(/\s/g,'').replace(/−/g,'-'),t=raw.match(/\d+|[()+\-·:]/g)||[];assert.equal(t.join(''),raw);
 let i=0;
 function atom(){if(t[i]==='('){i++;const v=sum();assert.equal(t[i++],')');return v;}const x=t[i++];assert(/^\d+$/.test(x||''));return BigInt(x);}
 function product(){let a=atom();while(t[i]==='·'||t[i]===':'){const op=t[i++],b=atom();if(op===':'){assert(b>0n&&a%b===0n,'Inexact division '+task);a/=b;}else a*=b;}return a;}
 function sum(){let a=product();while(t[i]==='+'||t[i]==='-'){const op=t[i++],b=product();a=op==='+'?a+b:a-b;}return a;}
 const v=sum();assert.equal(i,t.length);assert(v>=0n&&v<=BigInt(Number.MAX_SAFE_INTEGER));return Number(v);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>{
   let seed=2026111416;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const rows=[];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<40;trial++){
    qid='g5:order';blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question('order'),div=document.createElement('div');div.innerHTML=String(q.text);
    rows.push({level,family,trial,text:div.textContent,meta:q.mk126,answer:q.correctLabel,source:q.sourceTopicId,ex:q.ex,choices:q.choices.map(x=>x.label)});
   }
   return {rows,count:g5AllTopics().length,lesson:String(g5Lesson('order'))};
  });
  assert.equal(out.count,74);assert.equal(out.rows.length,600);assert(out.lesson.includes('слева направо'));
  const diversity=new Map(),steps=[[],[],[]];
  for(const row of out.rows){
   const ctx=row.level+'/'+row.family+'/'+row.trial,v=calculate(row.text),m=row.meta;
   assert(m&&m.id==='order'&&m.t===row.level&&m.p===row.family,'Not live topic '+ctx);
   assert.equal(row.source,'order');assert.equal(m.expected,v,'Wrong planned answer '+ctx);assert.equal(Number(row.answer),v,'Wrong visible answer '+ctx);
   assert.equal(new Set(row.choices.map(String)).size,row.choices.length,'Repeated answer options '+ctx);
   assert(row.ex.includes('Ответ: '+v+'.'),'Wrong final explanation '+ctx);
   assert(!/NaN|undefined|Infinity/.test(row.ex));
   steps[row.level].push(m.steps);
   const key=row.level+'/'+row.family;if(!diversity.has(key))diversity.set(key,new Set());diversity.get(key).add(row.text);
  }
  assert.equal(diversity.size,15);
  for(const [k,v]of diversity)assert(v.size>=10,'Insufficient variation '+k+' '+v.size);
  const mean=steps.map(x=>x.reduce((a,b)=>a+b,0)/x.length);assert(mean[0]<mean[1]&&mean[1]<mean[2],'No difficulty growth '+mean);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_16_PASS '+JSON.stringify({questions:out.rows.length,families:15,meanSteps:mean}));
 }finally{await browser.close();}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_16_FAIL',e.stack||e);process.exit(1)});
