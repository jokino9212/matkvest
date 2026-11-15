'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
function milli(value){
 const [whole,decimal='']=value.split(',');
 return BigInt(whole)*1000n+BigInt(decimal.padEnd(3,'0'));
}
function roundTo(value,step){
 const quotient=value/step,remainder=value%step;
 return (remainder*2n<step?quotient:quotient+1n)*step;
}
const stepFor=text=>text.includes('до десятков')?10000n:text.includes('до целых')?1000n:text.includes('до десятых')?100n:10n;
const abs=value=>value<0n?-value:value;
function solve(text){
 const numbers=(text.match(/\d+(?:,\d+)?/g)||[]).map(milli),[a,b,c]=numbers;
 if(text.startsWith('Округли')||text.startsWith('Выбери верное округление'))return roundTo(a,stepFor(text));
 if(text.startsWith('Прикинь сумму'))return roundTo(a,1000n)+roundTo(b,1000n);
 if(text.startsWith('Прикинь разность'))return roundTo(a,100n)-roundTo(b,100n);
 if(text.startsWith('Число ')&&text.includes('сначала округли'))return roundTo(roundTo(a,10n),100n);
 if(text.startsWith('Найди точную сумму'))return roundTo(a+b,10n);
 if(text.includes('округли до десятых напрямую'))return roundTo(roundTo(a,10n),100n)-roundTo(a,100n);
 if(text.startsWith('Найди наибольшее число')){
  const valid=Array.from({length:200},(_,i)=>a-100n+BigInt(i)).filter(value=>roundTo(value,100n)===a);
  return valid.at(-1);
 }
 if(text.startsWith('Прикинь общий вес'))return abs(roundTo(a,1000n)+roundTo(b,1000n)+roundTo(c,1000n)-a-b-c);
 if(text.startsWith('Сколько из записей'))return 1000n*BigInt(numbers.slice(1).filter(value=>roundTo(value,100n)===a).length);
 if(text.startsWith('Найди абсолютную разницу'))return abs(a+b-c-(roundTo(a,100n)+roundTo(b,100n)-roundTo(c,100n)));
 throw Error('Не распознано задание: '+text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111544;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const text=html=>{const node=document.createElement('div');node.innerHTML=html;return node.textContent;};
   const id='dec_round',rows=[],screens=[];
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let n=0;n<40;n++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id);
    rows.push({tier,slot,text:text(q.text),solution:text(q.ex),template:q.templateId,topic:q.sourceTopicId,
     correct:q.ans,choices:q.choices.map(choice=>({key:choice.key,value:text(choice.label)}))});
   }
   for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,topics:g5AllTopics().length};
  });
  assert.equal(data.rows.length,600);assert.equal(data.topics,74);assert.deepEqual(data.screens,[4,4,4]);
  const families=new Map();
  for(const row of data.rows){
   assert.equal(row.topic,'dec_round');
   assert.equal(row.template,'g5v116_dec_round_L'+row.tier+'_F'+row.slot);
   const expected=solve(row.text),values=row.choices.map(choice=>milli(choice.value));
   assert.equal(new Set(values).size,4,row.text);
   assert.equal(values.filter(value=>value===expected).length,1,row.text);
   assert.equal(milli(row.choices.find(choice=>choice.key===row.correct).value),expected,row.text);
   const result=row.solution.match(/Ответ: (\d+(?:,\d+)?)\.$/);
   assert(result,row.solution);assert.equal(milli(result[1]),expected,row.text);
   const approximations=[...row.solution.matchAll(/(\d+(?:,\d+)?) ≈ (\d+(?:,\d+)?)/g)];
   for(const [,source,value] of approximations){
    const places=value.split(',')[1]?.length||0;
    const target=places===2?10n:places===1?100n:row.tier===0&&row.slot===3?10000n:1000n;
    assert.equal(roundTo(milli(source),target),milli(value),row.solution);
   }
   const family=families.get(row.template)||new Set();family.add(row.text);families.set(row.template,family);
  }
  assert.equal(families.size,15);
  const minimum=Math.min(...[...families.values()].map(forms=>forms.size));
  assert(minimum>=15,`Минимум вариантов: ${minimum}`);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_44_PASS '+JSON.stringify({questions:600,families:15,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_44_FAIL',error.stack||error);process.exitCode=1;});
