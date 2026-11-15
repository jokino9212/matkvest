'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const topic = 'g6:divisors_multiples';
const rules = [
  [/^Является ли (\d+) делителем числа (\d+)\?$/, (a,b) => b%a===0?'ДА':'НЕТ'],
  [/^Является ли (\d+) кратным числу (\d+)\?$/, (a,b) => a%b===0?'ДА':'НЕТ'],
  [/^Какое из предложенных чисел делит (\d+) без остатка\?$/, (n,choices) => {
    const valid=choices.filter(x=>n%Number(x)===0);
    assert.equal(valid.length,1);
    return valid[0];
  }],
  [/^Найди (второе|третье|четвёртое) положительное кратное числа (\d+)\.$/,
    (place,n)=>(['второе','третье','четвёртое'].indexOf(place)+2)*n],
  [/^Заполни пропуск: (\d+) · □ = (\d+)\.$/, (a,b)=>b/a],
  [/^Выбери полный список натуральных делителей числа (\d+)\.$/, n=>integers(1,n).filter(x=>n%x===0).join(', ')],
  [/^На (\d+) полках поровну разместили (\d+) книг\./, (a,b)=>b/a],
  [/^Найди наименьшее кратное числа (\d+), строго большее (\d+)\.$/,
    (a,b)=>integers(b+1,b+a).find(x=>x%a===0)],
  [/^Найди наибольшее кратное числа (\d+), не превосходящее (\d+)\.$/,
    (a,b)=>integers(1,b).filter(x=>x%a===0).at(-1)],
  [/^Сколько делителей числа (\d+) лежит от (\d+) до (\d+) включительно\?$/,
    (n,a,b)=>integers(a,b).filter(x=>n%x===0).length],
  [/^Число (\d+) можно разложить поровну и по (\d+) штук, и по (\d+) штук\./,(n,a,b)=>n/a-n/b],
  [/^Один из делителей числа (\d+) равен (\d+)\./,(n,a)=>n/a],
  [/^Сколько кратных числа (\d+) лежит от (\d+) до (\d+) включительно\?$/,
    (n,a,b)=>integers(a,b).filter(x=>x%n===0).length],
  [/^Найди сумму всех натуральных чисел, которые одновременно делят (\d+) и кратны (\d+)\.$/,
    (n,a)=>sum(integers(1,n).filter(x=>n%x===0&&x%a===0))],
  [/^Сколько разных натуральных делителей у числа (\d+)\?$/,n=>integers(1,n).filter(x=>n%x===0).length],
  [/^Из (\d+) деталей забрали (\d+)\. Остальные нужно разложить по (\d+) штук/,
    (n,a,b)=>integers(0,b-1).find(x=>(n-a+x)%b===0)],
  [/^Найди наибольшее нечётное кратное числа (\d+), не превосходящее (\d+)\.$/,
    (a,b)=>integers(1,b).filter(x=>x%a===0&&x%2===1).at(-1)],
  [/^Площадь прямоугольника равна (\d+) см²\. Длины сторон — натуральные числа, короткая сторона равна (\d+) см\./,
    (n,a)=>n/a-a],
  [/^Сколько положительных кратных числа (\d+) строго между (\d+) и (\d+)\?$/,
    (n,a,b)=>integers(a+1,b-1).filter(x=>x%n===0).length],
  [/^Есть (\d+) жетонов\. В набор входит (\d+) жетонов, в коробку помещается ровно (\d+) наборов\./,
    (n,a,b)=>n-integers(0,n).filter(x=>x%(a*b)===0).at(-1)],
  [/^Сколько натуральных делителей числа (\d+) строго между его делителями (\d+) и (\d+)\?$/,
    (n,a,b)=>integers(a+1,b-1).filter(x=>n%x===0).length],
  [/^Найди сумму кратных числа (\d+), которые строго больше (\d+) и строго меньше (\d+)\.$/,
    (n,a,b)=>sum(integers(a+1,b-1).filter(x=>x%n===0))],
];
const integers = (a,b) => Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const sum = values => values.reduce((a,b)=>a+b,0);

function inspect(row){
  const matches=rules.flatMap(([regexp,solve],i)=>{
    const match=regexp.exec(row.text);
    return match?[{family:i,answer:solve(...match.slice(1).map(x=>/^\d+$/.test(x)?Number(x):x),row.choices)}]:[];
  });
  assert.equal(matches.length,1,row.text);
  const {family,answer}=matches[0];
  assert.equal(String(answer),row.answer,row.text);
  if(row.choices.length){
    assert.equal(new Set(row.choices).size,row.choices.length,row.text);
    assert.equal(row.choices.filter(x=>x===String(answer)).length,1,row.text);
  }
  assert(row.explanation && !/undefined|NaN|Infinity/.test(row.explanation),row.text);
  return family;
}

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'load'});
    const blocks=await page.evaluate(id=>{
      let seed=191;
      Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
      const read=html=>{
        const node=document.createElement('div');
        node.innerHTML=html;
        return node.textContent.trim().replace(/\s+/g,' ');
      };
      const blocks=[];
      for(let level=0;level<3;level++)for(let run=0;run<32;run++){
        startG6QuizStage(id,level);
        const rows=[];
        const total=blockSession.total;
        for(let position=0;position<total;position++){
          const prompt=document.querySelector('#qstage .quizq');
          if(!prompt?.textContent.trim())throw Error('Missing rendered question');
          rows.push({text:read(prompt.innerHTML),answer:String(q.ans),choices:q.choices.map(c=>read(c.label)),explanation:read(q.ex)});
          if(!skipNormalQuiz()||blockSession.done!==position+1)throw Error('Progress did not advance');
          if(!blockSession.finished)nextQ();
        }
        if(!blockSession.finished)throw Error('Unfinished training');
        blocks.push({level,rows});
      }
      return blocks;
    },topic);
    const expected=[5,7,10],endpoints=[0,5,12,22],variants=new Map();
    for(const {level,rows} of blocks){
      assert.equal(rows.length,expected[level]);
      const unique=new Set();
      for(const row of rows){
        const family=inspect(row);
        assert(family>=endpoints[level]&&family<endpoints[level+1],row.text);
        unique.add(family);
        if(!variants.has(family))variants.set(family,new Set());
        variants.get(family).add(row.text);
      }
      assert.equal(unique.size,expected[level]);
    }
    assert.equal(variants.size,22);
    for(const [family,texts] of variants)assert(texts.size>=7,'Insufficient variety in family '+family);
    for(const width of [390,1280]){
      await page.setViewportSize({width,height:844});
      const before=await page.evaluate(id=>{
        startG6QuizStage(id,0);
        const choice=q.choices.findIndex(option=>option.key===q.ans);
        pick(choice);
        if(blockSession.correct!==1)throw Error('Choice answer was rejected');
        nextQ();
        for(let i=0;i<2;i++){
          if(!skipNormalQuiz())throw Error('Could not advance to numeric exercise');
          nextQ();
        }
        document.getElementById('quizInput').value=q.ans;
        checkQuizInput();
        if(blockSession.correct!==2)throw Error('Numeric answer was rejected');
        nextQ();
        if(!mk872PersistDraft())throw Error('Draft not saved');
        return {attemptId:blockSession.attemptId,text:q.text,done:blockSession.done};
      },topic);
      await page.reload({waitUntil:'load'});
      const after=await page.evaluate(()=>{
        const draft=mk872ReadDraft();
        if(!draft)throw Error('Draft not found');
        mk872RestoreDraft(draft);
        return {attemptId:blockSession.attemptId,text:q.text,done:blockSession.done};
      });
      assert.deepEqual(after,before);
    }
    assert.deepEqual(errors,[]);
    console.log('G6_DIVISORS_MULTIPLES_PASS',JSON.stringify({trainings:blocks.length,questions:blocks.flatMap(b=>b.rows).length,families:expected,draftWidths:[390,1280]}));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
