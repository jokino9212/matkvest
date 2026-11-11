'use strict';
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const frac=s=>{const m=String(s||'').replace(/,/g,'.').match(/^(-?\d+)\/(\d+)$/);return m?Number(m[1])/Number(m[2]):Number(String(s||'').replace(',','.'))};
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7;
const W={'одна':1,'одну':1,'две':2,'два':2,'три':3,'четыре':4,'пять':5,'шесть':6,'семь':7,'восемь':8,'девять':9,'десять':10};
const D={'вторая':2,'вторых':2,'треть':3,'третья':3,'третьих':3,'четвёртая':4,'четвёртых':4,'четвертых':4,'пятая':5,'пятых':5,'шестая':6,'шестых':6,'седьмая':7,'восьмая':8,'девятая':9,'десятая':10,'седьмых':7,'восьмых':8,'девятых':9,'десятых':10};
function independent(q){
 const t=q.text,k=q.template,nums=(t.match(/\d+(?:,\d+)?/g)||[]).map(x=>Number(x.replace(',','.'))),
 f=t.match(/\d+\/\d+/g)||[], ans=q.answer;
 const numeric=x=>({value:x}),word=x=>({word:x});
 if(k==='angle_protractor'){
  const temp=document.createElement('div');temp.innerHTML=q.html;
  const svg=temp.querySelector('svg.g5-protractor'),ray=svg?.querySelector('line.g5-protractor-ray'),center=svg?.querySelector('.g5-protractor-center');
  if(!svg||!ray||!center)return {failure:'missing SVG ray/center'};
  const x0=Number(ray.getAttribute('x1')),y0=Number(ray.getAttribute('y1')),x=Number(ray.getAttribute('x2')),y=Number(ray.getAttribute('y2'));
  const cx=Number(center.getAttribute('cx')),cy=Number(center.getAttribute('cy'));
  if(!close(x0,cx)||!close(y0,cy)||y>cy||x<45||x>315)return {failure:'ray origin or bounds differ'};
  const deg=Math.atan2(cy-y,x-cx)*180/Math.PI;
  return numeric(Math.round(deg));
 }
 if(k==='shape_radius_difference')return numeric(nums[0]/2);
 if(k==='parts_complement')return numeric((nums[0]-nums[1])/nums[0]);
 if(k==='ray_shift_fraction'){const m=t.match(/(\d+)\/(\d+).*ещё (\d+) делений по (\d+)\/(\d+)/);if(m)return numeric(Number(m[1])/Number(m[2])+Number(m[3])*Number(m[4])/Number(m[5]))}
 if(k==='dec_add_context_three'||k==='dec_sub_context_three'){const v=(t.match(/\d+(?:,\d+)?/g)||[]).map(x=>Number(x.replace(',','.')));if(v.length===3)return numeric(k.startsWith('dec_add')?v[0]+v[1]+v[2]:v[0]-v[1]-v[2])}
 if(k==='power_in_expression'){let m=t.match(/(\d+)²\s*([+−-])\s*(\d+)/);if(m)return numeric(Number(m[1])**2+(m[2]==='+'?1:-1)*Number(m[3]))}
 if(k==='unit_direct'){const m=t.match(/(\d+)\s*(км|м|см|мм|т|кг|г|ч|мин|с)\s*=\s*\?\s*(км|м|см|мм|т|кг|г|ч|мин|с)/);
   const factor={км:1000000,м:1000,см:10,мм:1,т:1000000,кг:1000,г:1,ч:3600,мин:60,с:1},family={км:1,м:1,см:1,мм:1,т:2,кг:2,г:2,ч:3,мин:3,с:3};if(m&&family[m[2]]===family[m[3]])return numeric(Number(m[1])*factor[m[2]]/factor[m[3]])}
 if(k.startsWith('s18b_power')||k==='power_square'||k==='power_cube'){
  let m=t.match(/Квадрат какого натурального числа равен (\d+)/);if(m)return numeric(Math.sqrt(Number(m[1])));
  m=t.match(/Куб какого натурального числа равен (\d+)/);if(m)return numeric(Math.round(Math.cbrt(Number(m[1]))));
  m=t.match(/(?:Найди квадрат числа|Сторона квадрата|со стороной|В квадрате)\s*(\d+)/);if(m)return numeric(Number(m[1])**2);
  m=t.match(/(?:Найди куб числа|Ребро куба)\s*(\d+)/);if(m)return numeric(Number(m[1])**3);
  m=t.match(/В одном ряду (\d+) кубик/);if(m)return numeric(Number(m[1])**3);
  m=t.match(/Куб сложили из (\d+) слоёв по (\d+)/);if(m)return numeric(Number(m[1])*Number(m[2]));
  m=t.match(/(\d+)\s*·\s*(\d+)\s*·\s*(\d+)/);if(m)return numeric(Number(m[1])*Number(m[2])*Number(m[3]));
  m=t.match(/(\d+)\s*·\s*(\d+)/);if(m)return numeric(Number(m[1])*Number(m[2]));
 }
 if(k.startsWith('shape_concept_')||k==='shape_cylinder'){
  const concepts={
  'shape_concept_0':'Круг содержит внутреннюю область, а окружность — его граница',
  'shape_concept_1':'Окружность','shape_concept_2':'Круг','shape_concept_3':'Радиус',
  'shape_concept_4':'Диаметр','shape_concept_5':'Шар','shape_concept_6':'Круг',
  'shape_concept_7':'Два равных круга','shape_cylinder':'Цилиндр'};
  if(concepts[k])return word(concepts[k]);
 }
 if(k==='types_choose_proper'||k.startsWith('s18c_types_')||k==='types_classify'){
  const options=(q.choices||[]).map(o=>({...o,value:o.label.match(/^(\d+)\/(\d+)$/)}));
  if(k==='types_classify'&&f.length){const [a,b]=f[0].split('/').map(Number);return word(a<b?'правильная':'неправильная')}
  if(k==='s18c_types_3'){const m=t.match(/знаменателе (\d+)/);if(m)return numeric(Number(m[1])-1)}
  if(k==='s18c_types_4'&&f.length){const [a,b]=f[0].split('/').map(Number);return numeric(b-a)}
  if(k==='s18c_types_5'){const m=t.match(/числитель (\d+)/);if(m)return numeric(Number(m[1]))}
  const test=k==='s18c_types_1'?v=>v[1]>v[2]:
   k==='s18c_types_2'?v=>v[1]===v[2]:
   k==='s18c_types_0'||k==='types_choose_proper'?v=>v[1]<v[2]:null;
  if(test&&options.length){
   const satisfying=options.filter(v=>v.value&&test(v.value));
   if(satisfying.length!==1)return {failure:'non-unique correct fraction option: '+satisfying.length};
   return word(satisfying[0].label);
  }
 }
 if(k.startsWith('read_from_words_')){
  const m=t.match(/«([^»]+)»/);if(m){const p=m[1].split(/\s+/);if(W[p[0]]&&D[p[1]])return numeric(W[p[0]]/D[p[1]])}
 }
 return null;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const rows=await page.evaluate(()=>{
  const omit=new Set(['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub']);
  const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].filter(t=>!omit.has(t.id));
  const results=[];
  for(const topic of topics)for(let stage=0;stage<3;stage++)for(let run=0;run<36;run++){
   blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic.id;
   for(let pos=0;pos<5;pos++){
    blockSession.done=pos;
    const q=freshQuiz(qid);
    results.push({topic:topic.id,stage,template:String(q.templateId||'base'),text:stripHtmlText(q.text||''),html:String(q.text||''),answer:String(q.correctText||''),
    choices:(q.choices||[]).map(c=>({key:String(c.key),label:stripHtmlText(c.label)}))});
   }
  }
  return results;
 });
 const tracked=new Set(['angles::angle_protractor','frac_shapes::shape_radius_difference',
 'powers::power_in_expression','frac_parts::parts_complement','frac_ray::ray_shift_fraction',
 'frac_types::types_choose_proper','dec_add::decimal_add_context_three','dec_sub::decimal_sub_context_three','units::unit_direct']);
 let checked=0;const matched=new Map(),skipped=new Map(),faults=[],unhandled=new Map(),realMissingExamples=new Map();
 for(const q of rows){
  const key=q.topic+'::'+q.template;
  if(!/^(angles::angle_protractor|frac_shapes::shape_|frac_types::|powers::|frac_parts::parts_complement|frac_ray::ray_shift_fraction|dec_add::decimal_add_context_three|dec_sub::decimal_sub_context_three|units::unit_direct|frac_read::read_from_words)/.test(key))continue;
  let exp;
  if(key==='angles::angle_protractor'){
   const match=q.html.match(/<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"\s+class="g5-protractor-ray"/);
   const center=q.html.match(/<circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="([^"]+)"\s+class="g5-protractor-center"/);
   if(!match||!center){faults.push({key,reason:'missing ray geometry',answer:q.answer});continue}
   const dx=Number(match[3])-Number(match[1]),dy=Number(match[2])-Number(match[4]);
   exp={value:Math.round(Math.atan2(dy,dx)*180/Math.PI)};
   if(Number(match[1])!==Number(center[1])||Number(match[2])!==Number(center[2]))faults.push({key,reason:'ray origin disagrees with center',answer:q.answer});
  }else{
   const t=q.text,k=q.template,nums=(t.match(/\d+(?:,\d+)?/g)||[]).map(x=>Number(x.replace(',','.'))),f=t.match(/\d+\/\d+/g)||[];
   const numeric=value=>({value}),word=value=>({word:value});
   if(k==='shape_radius_difference')exp=numeric(nums[0]/2);
   else if(k==='parts_complement')exp=numeric((nums[0]-nums[1])/nums[0]);
   else if(k==='shape_diameter')exp=numeric(nums[0]*2);
   else if(k==='types_boundary')exp=numeric(Number(t.match(/знаменателе (\d+)/)?.[1]));
   else if(k==='ray_shift_fraction'){const m=t.match(/(\d+)\/(\d+).*ещё (\d+) делений по (\d+)\/(\d+)/);if(m)exp=numeric(Number(m[1])/Number(m[2])+Number(m[3])*Number(m[4])/Number(m[5]))}
   else if(k==='decimal_add_context_three'||k==='decimal_sub_context_three'){const v=nums; if(v.length===3)exp=numeric(k.startsWith('decimal_add')?v[0]+v[1]+v[2]:v[0]-v[1]-v[2])}
   else if(k==='power_in_expression'){const m=t.match(/(\d+)²\s*([+−-])\s*(\d+)/);if(m)exp=numeric(Number(m[1])**2+(m[2]==='+'?1:-1)*Number(m[3]))}
   else if(k==='unit_direct'){const m=t.match(/(\d+)\s*(км|м|дм|см|мм|т|ц|кг|г|сут|ч|мин|с)\s*=\s*\?\s*(км|м|дм|см|мм|т|ц|кг|г|сут|ч|мин|с)\s*$/);
    const factor={км:1000000,м:1000,дм:100,см:10,мм:1,т:1000000,ц:100000,кг:1000,г:1,сут:86400,ч:3600,мин:60,с:1},family={км:1,м:1,дм:1,см:1,мм:1,т:2,ц:2,кг:2,г:2,сут:3,ч:3,мин:3,с:3};if(m&&family[m[2]]===family[m[3]])exp=numeric(Number(m[1])*factor[m[2]]/factor[m[3]])}
   else if(k.startsWith('s18b_power')||k==='power_square'||k==='power_cube'){
    let m=t.match(/Квадрат какого натурального числа равен (\d+)/);if(m)exp=numeric(Math.sqrt(Number(m[1])));
    else if((m=t.match(/Куб какого натурального числа равен (\d+)/)))exp=numeric(Math.round(Math.cbrt(Number(m[1]))));
    else if((m=t.match(/(?:Найди квадрат числа|Сторона квадрата|со стороной|В квадрате)\s*(\d+)/)))exp=numeric(Number(m[1])**2);
    else if((m=t.match(/(?:Найди куб числа|Ребро куба)\s*(\d+)/)))exp=numeric(Number(m[1])**3);
    else if((m=t.match(/В одном ряду (\d+) кубик/)))exp=numeric(Number(m[1])**3);
    else if((m=t.match(/Куб сложили из (\d+) слоёв по (\d+)/)))exp=numeric(Number(m[1])*Number(m[2]));
    else if((m=t.match(/(\d+)\s*·\s*(\d+)\s*·\s*(\d+)/)))exp=numeric(Number(m[1])*Number(m[2])*Number(m[3]));
    else if((m=t.match(/(\d+)\s*·\s*(\d+)/)))exp=numeric(Number(m[1])*Number(m[2]));
   }
   else if(k.startsWith('shape_concept_')||k==='shape_cylinder'){
    const dict=['Круг содержит внутреннюю область, а окружность — его граница','Окружность','Круг','Радиус','Диаметр','Шар','Круг','Два равных круга'];
    exp=word(k==='shape_cylinder'?'Цилиндр':dict[Number(k.replace('shape_concept_',''))]);
   }
   else if(k==='types_choose_proper'||k.startsWith('s18c_types_')||k==='types_classify'){
    const options=q.choices.map(o=>({...o,m:o.label.match(/^(\d+)\/(\d+)$/)}));
    if(k==='types_classify'&&f.length){const [a,b]=f[0].split('/').map(Number);exp=word(a<b?'правильная':'неправильная')}
    else if(k==='s18c_types_3'){const m=t.match(/(?:знаменателе|знаменатель дроби равен) (\d+)/);if(m)exp=numeric(Number(m[1])-1)}
    else if(k==='s18c_types_4'&&/увеличить/.test(t)&&f.length){const [a,b]=f[0].split('/').map(Number);exp=numeric(b-a)}
    else if(k==='s18c_types_4'&&/В какой паре/.test(t)){
      const candidates=options.map(o=>({label:o.label,fs:o.label.match(/(\d+)\/(\d+)/g)||[]}));
      const valid=candidates.filter(o=>o.fs.length===2&&o.fs.every(v=>{const [a,b]=v.split('/').map(Number);return a>=b}));
      if(valid.length!==1)faults.push({key,reason:'nonunique improper fraction pair',choices:candidates,correct:valid.map(x=>x.label)});
      else exp=word(valid[0].label);
    }
    else if(k==='s18c_types_5'){const m=t.match(/числитель (\d+)/);if(m)exp=numeric(Number(m[1]))}
    else if(k==='s18c_types_2'&&/увеличивают|увеличить/.test(t)&&f.length){const [a,b]=f[0].split('/').map(Number);exp=numeric(b-a)}
    else if((k==='s18c_types_0'||k==='s18c_types_1')&&/Сколько (?:неправильных|правильных) дробей/.test(t)){
      const values=f.map(v=>v.split('/').map(Number));
      exp=numeric(values.filter(v=>k==='s18c_types_0'?v[0]<v[1]:v[0]>=v[1]).length);
    }else if(k==='s18c_types_3'&&/сколько существует правильных/.test(t)){const m=t.match(/знаменатель дроби равен (\d+)/);if(m)exp=numeric(Number(m[1])-1)}
    else{
     const test=k==='s18c_types_1'?v=>Number(v.m[1])>Number(v.m[2]):
      k==='s18c_types_2'?v=>Number(v.m[1])===Number(v.m[2]):
      k==='s18c_types_0'||k==='types_choose_proper'?v=>Number(v.m[1])<Number(v.m[2]):null;
     if(test&&options.length){
      const qualifying=options.filter(o=>o.m&&test(o));
      if(qualifying.length!==1)faults.push({key,reason:'non-unique correct option',found:qualifying.map(o=>o.label),text:t});
      else exp=word(qualifying[0].label);
     }
    }
   }
   else if(k.startsWith('read_from_words_')){
    const m=t.match(/«([^»]+)»/);if(m){const a=m[1].split(/\s+/);if(W[a[0]]&&D[a[1]])exp=numeric(W[a[0]]/D[a[1]])}
   }
  }
  if(!exp){unhandled.set(key,(unhandled.get(key)||0)+1);if(!realMissingExamples.has(key))realMissingExamples.set(key,{key,text:q.text,answer:q.answer,choices:q.choices});continue}
  matched.set(key,(matched.get(key)||0)+1);checked++;
  const ok=exp.word!==undefined?q.answer===exp.word:close(frac(q.answer),exp.value);
  if(!ok)faults.push({key,text:q.text,answer:q.answer,expected:exp,choices:q.choices});
 }
 const report={questions:rows.length,independentCount:checked,distinctCheckedTemplates:matched.size,
 errorGroups:Object.entries(faults.reduce((a,x)=>(a[x.key]=(a[x.key]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]),
 missingSamples:[...new Map(rows.filter(x=>unhandled.has(x.topic+'::'+x.template)).map(x=>[x.topic+'::'+x.template,{key:x.topic+'::'+x.template,text:x.text,answer:x.answer}])).values()],
 matched:Object.fromEntries(matched),remaining:Object.fromEntries(unhandled),failures:faults.slice(0,40),failureCount:faults.length,
 missingReal:[...realMissingExamples.values()],pageErrors:errs};
 fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage14c_semantic_visual_report.json',JSON.stringify(report,null,2));
 console.log('STAGE14C_UNCHECKED_ACTUAL',JSON.stringify(report.missingReal));
 console.log('STAGE14C_MATCHED_KEYS',JSON.stringify(report.matched));
 console.log('STAGE14C_VALIDATION',JSON.stringify({questions:report.questions,checked:checked,templates:matched.size,remaining:report.remaining,errors:faults.length,errorSamples:faults.slice(0,12)}));
 assert.equal(rows.length,49*3*36*5);
 assert.deepEqual(errs,[]);
 assert.equal(faults.length,0,'math or semantic errors in uncovered templates');
 console.log('STAGE14C_SEMANTIC_VISUAL_PASS',JSON.stringify({checked,templates:matched.size}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14C_SEMANTIC_VISUAL_FAIL',e.stack||e);process.exit(1)});
