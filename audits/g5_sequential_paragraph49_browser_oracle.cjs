'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
function solve(text,keys){
 const values=(text.match(/\d+/g)||[]).map(Number),[a,b,c,d,e,f,g]=values;
 if(keys.length){
  let current=values[0]??0;
  for(let i=0;i<keys.length;i++){
   const key=keys[i];
   if(/^\d+$/.test(key)){current=Number(key);continue;}
   if(key==='AC'){current=0;continue;}
   if(key==='=')continue;
   const next=Number(keys[++i]);
   current=key==='+'?current+next:key==='−'?current-next:key==='×'?current*next:current/next;
  }
  return current;
 }
 if(text.startsWith('Сначала посчитай'))return (a+b)*c;
 if(text.startsWith('На калькуляторе набрали'))return a+b-c-d;
 if(text.startsWith('Вычисли на калькуляторе ('))return (a-b)/c;
 if(text.startsWith('Калькулятор запомнил'))return 2*a+b;
 if(text.startsWith('На калькуляторе последовательно'))return (a+b)*c-d;
 if(text.startsWith('Вычисли на калькуляторе'))return a*b+c*d-e;
 if(text.startsWith('Начальное число'))return c/b-a;
 if(text.startsWith('На калькуляторе вычисли два'))return a*b+c-(d*e+f-g);
 throw Error('Не распознано задание: '+text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111549;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const plain=html=>{const node=document.createElement('div');node.innerHTML=html;return node.textContent;};
   const id='calculator',rows=[],screens=[];
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let n=0;n<40;n++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id);
    rows.push({tier,slot,text:plain(q.text.replace(/<div class="g5-calculator-keys"[\s\S]*?<\/div>/g,'')),solution:plain(q.ex),template:q.templateId,source:q.sourceTopicId,keys:[...new DOMParser().parseFromString(q.text,'text/html').querySelectorAll('kbd')].map(node=>node.textContent),
     correct:q.ans,choices:q.choices.map(choice=>({key:choice.key,label:plain(choice.label)}))});
   }
   for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,topics:g5AllTopics().length};
  });
  assert.equal(data.rows.length,600);assert.equal(data.topics,74);assert.deepEqual(data.screens,[4,4,4]);
  const families=new Map();let keySequences=0;
  for(const row of data.rows){
   if(row.keys.length)keySequences++;
   assert.equal(row.source,'calculator');
   assert.equal(row.template,'calc_L'+row.tier+'_F'+row.slot);
   const expected=solve(row.text,row.keys),values=row.choices.map(choice=>Number(choice.label));
   assert.equal(new Set(values).size,4,row.text);
   assert.equal(values.filter(value=>value===expected).length,1,row.text);
   assert.equal(Number(row.choices.find(choice=>choice.key===row.correct).label),expected,row.text);
   const result=row.solution.match(/Ответ: (\d+(?:,\d+)?)\.$/);
   assert(result,row.solution);assert.equal(Number(result[1]),expected,row.text);
   const equations=[...row.solution.matchAll(/(\d+(?:,\d+)?) ([:·+−]) (\d+(?:,\d+)?) = (\d+(?:,\d+)?)/g)];
   assert(equations.length>=row.tier+1,row.solution);
   for(const [,x,operation,y,z] of equations){
    const a=Number(x),b=Number(y),c=Number(z);
    assert.equal(operation===':'?a/b:operation==='·'?a*b:operation==='+'?a+b:a-b,c,row.solution);
   }
   const family=families.get(row.template)||new Set();family.add(row.text+JSON.stringify(row.keys));families.set(row.template,family);
  }
  assert.equal(families.size,15);assert.equal(keySequences,280);
  const minimum=Math.min(...[...families.values()].map(forms=>forms.size));
  assert(minimum>=15,`Минимум вариантов: ${minimum}`);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_49_PASS '+JSON.stringify({questions:600,families:15,keySequences,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_49_FAIL',error.stack||error);process.exitCode=1;});
