'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const abs=x=>x<0n?-x:x;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t}return a||1n};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d===0n)throw Error('division by zero');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]};
const plus=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const minus=(a,b)=>rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const times=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
const divide=(a,b)=>rat(a[0]*b[1],a[1]*b[0]);
const eq=(a,b)=>a&&b&&a[0]*b[1]===b[0]*a[1];
const parse=v=>{
 v=String(v).trim();let m=v.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
 if(m)return rat(BigInt(m[1])*BigInt(m[3])+BigInt(m[2]),m[3]);
 m=v.match(/^(-?\d+)\/(\d+)$/);if(m)return rat(m[1],m[2]);
 m=v.match(/^(-?\d+)(?:[,.](\d+))?$/);
 if(m){const s=m[2]||'',d=10n**BigInt(s.length),sign=m[1].startsWith('-')?-1n:1n;
  return rat(BigInt(m[1])*d+sign*BigInt(s||0),d)}
 return null;
};
const nums=t=>(String(t).match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+[,.]\d+|\d+/g)||[]).map(parse);
const expr=e=>{
 e=String(e).trim().replace(/[.?]$/,'').replace(/(\d+)\s+(\d+)\/(\d+)/g,'($1+$2/$3)');
 e=e.replace(/(\d+)\/(\d+)/g,'($1/$2)').replace(/(\d+),(\d+)/g,'$1.$2')
 .replace(/[·×]/g,'*').replace(/[:÷]/g,'/').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3');
 const t=e.match(/\d+(?:\.\d+)?|[()+\-*/^]/g)||[];
 if(t.join('')!==e.replace(/\s+/g,''))throw Error('unsupported arithmetic expression '+e);
 let p=0;
 const atom=()=>{
  if(t[p]==='+'){p++;return atom()}if(t[p]==='-'){p++;return times(rat(-1),atom())}
  if(t[p]==='('){p++;const v=sum();if(t[p++]!==')')throw Error('missing closing bracket');return v}
  const x=t[p++];if(!x||!/^\d/.test(x))throw Error('invalid token '+x);return parse(x)
 };
 const power=()=>{let v=atom();if(t[p]==='^'){p++;const k=atom();if(k[1]!==1n||k[0]>4n)throw Error('bad exponent');const a=v;for(let i=1n;i<k[0];i++)v=times(v,a)}return v};
 const product=()=>{let v=power();while(t[p]==='*'||t[p]==='/'){const op=t[p++],b=power();v=op==='*'?times(v,b):divide(v,b)}return v};
 const sum=()=>{let v=product();while(t[p]==='+'||t[p]==='-'){const op=t[p++],b=product();v=op==='+'?plus(v,b):minus(v,b)}return v};
 const v=sum();if(p!==t.length)throw Error('unparsed expression');return v
};
const rawExpr=t=>{
 const m=t.match(/^(?:Вычисли|Найди значение)\s*:?\s*([\d\s.,()+−·×:^²³+-]+)(?:\s*=\s*\?|[.]|$)/);
 if(m)return m[1];
 const n=t.match(/^([\d\s.,()+−·×:^+-]+)\s*=\s*\?/);
 return n?n[1]:null;
};
const numWord=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
const denomOne={2:'вторая',3:'третья',4:'четвёртая',5:'пятая',6:'шестая',7:'седьмая',8:'восьмая',9:'девятая',10:'десятая'};
const denomMany={2:'вторых',3:'третьих',4:'четвёртых',5:'пятых',6:'шестых',7:'седьмых',8:'восьмых',9:'девятых',10:'десятых'};
const fracWords=(n,d)=>numWord[n]+' '+(n===1?denomOne[d]:denomMany[d]);
const oracle=q=>{
 const topic=q.topic,k=q.template,text=q.text,ns=nums(text),v=parse(q.answer);
 const n=i=>ns[i],asNumber=i=>Number(n(i)?.[0]),fractions=text.match(/\d+\/\d+/g)||[];
 let expected=null,label=null;
 if(topic==='natural'){
  if(k==='natural_compare'&&ns.length>=2)expected=ns[0][0]>ns[1][0]?n(0):n(1);
  if(k==='natural_max_three'&&ns.length>=3)expected=ns.reduce((a,b)=>a[0]>b[0]?a:b);
  if(k==='natural_digit'){
   const m=text.match(/разряде (десятков тысяч|тысяч|сотен|десятков) числа (\d+)/);
   const unit={'десятков':10n,'сотен':100n,'тысяч':1000n,'десятков тысяч':10000n};
   if(m)expected=rat((BigInt(m[2])/unit[m[1]])%10n);
  }
  if(k==='natural_round'){
   const m=text.match(/Округли (\d+) до (десятков|сотен|тысяч)/);
   const unit={'десятков':10n,'сотен':100n,'тысяч':1000n};
   if(m){const a=BigInt(m[1]),b=unit[m[2]];expected=rat((a+b/2n)/b*b)}
  }
 }
 if(topic==='coordinate'){
  if(k==='coord_midpoint'&&ns.length>=2)expected=divide(plus(n(0),n(1)),rat(2));
  if(k==='coord_distance'&&ns.length>=2)expected=rat(abs(n(0)[0]-n(1)[0]));
  if(k==='coord_twosteps'&&ns.length>=3){
   const direction=text.match(/на \d+ (вправо|влево), затем ещё на \d+ (вправо|влево)/);
   if(direction)expected=plus(plus(n(0),times(n(1),rat(direction[1]==='вправо'?1:-1))),times(n(2),rat(direction[2]==='вправо'?1:-1)));
  }
 }
 if(topic==='operations'||topic==='order'){
  const e=rawExpr(text);if(e)expected=expr(e)
 }
 if(topic==='powers'){
  if(k==='power_square'&&ns.length)expected=times(n(0),n(0));
  if(k==='power_cube'&&ns.length)expected=times(times(n(0),n(0)),n(0));
  if(k==='power_in_expression'){const e=rawExpr(text);if(e)expected=expr(e)}
 }
 if(topic==='powers'&&expected===null){
  if(/^Сколько будет/.test(text)&&ns.length>=2)expected=times(n(0),n(1));
  else if(/Найди квадрат числа/.test(text)&&ns.length)expected=times(n(0),n(0));
  else if(/Сторона квадрата/.test(text)&&ns.length)expected=times(n(0),n(0));
  else if(/единичных квадратов поместится/.test(text)&&ns.length)expected=times(n(0),n(0));
  else if(/В квадрате .* рядов по/.test(text)&&ns.length>=2)expected=times(n(0),n(1));
  else if(/Куб сложили из/.test(text)&&ns.length>=2)expected=times(n(0),n(1));
  else if(/Найди произведение/.test(text)&&ns.length>=3)expected=times(times(n(0),n(1)),n(2));
  else if(/Найди куб числа/.test(text)&&ns.length)expected=times(times(n(0),n(0)),n(0));
  else if(/В одном ряду .* рядов .* слоёв/.test(text)&&ns.length>=3)expected=times(times(n(0),n(1)),n(2));
  else if(/Ребро куба/.test(text)&&ns.length)expected=times(times(n(0),n(0)),n(0));
  else if(/Квадрат какого натурального числа равен/.test(text)&&ns.length){
   for(let i=1n;i<=500n;i++)if(i*i===n(0)[0]){expected=rat(i);break}
  }
  else if(/Куб какого натурального числа равен/.test(text)&&ns.length){
   for(let i=1n;i<=500n;i++)if(i*i*i===n(0)[0]){expected=rat(i);break}
  }
 }
 if(topic==='equations'){
  const m=text.match(/уравнение:\s*(.*?)\s*=\s*([\d,]+)/);
  if(m){
   const lhs=m[1],rhs=parse(m[2]),zero=expr(lhs.replace(/\bx\b/g,'0')),one=expr(lhs.replace(/\bx\b/g,'1'));
   expected=divide(minus(rhs,zero),minus(one,zero));
  }
 }
 if(topic==='geometry'){
  if(k==='geom_rectangle_area'&&ns.length>=2)expected=times(n(0),n(1));
  if(k==='geom_inverse_perimeter'&&ns.length>=2)expected=minus(divide(n(0),rat(2)),n(1));
  if(k==='geom_composite_area'&&ns.length>=4)expected=minus(times(n(0),n(1)),times(n(2),n(3)));
 }
 if(topic==='volume'){
  if(k==='volume_box'&&ns.length>=3)expected=times(times(n(0),n(1)),n(2));
  if(k==='volume_unit_cubes'&&ns.length>=3)expected=times(times(n(0),n(1)),n(2));
  if(k==='volume_missing_edge'&&ns.length>=3)expected=divide(n(0),times(n(1),n(2)));
 }
 if(topic==='angles'){
  if(k==='angle_complement'&&ns.length)expected=minus(rat(90),n(0));
  if(k==='angle_classify'&&ns.length){const d=asNumber(0);
   label=d<90?'острый':d===90?'прямой':d<180?'тупой':d===180?'развёрнутый':null}
 }
 if(topic==='charts'){
  if(k==='chart_angle_fraction'&&ns.length)expected=divide(n(0),rat(360));
  if(k==='chart_one_sector'&&ns.length)expected=divide(rat(360),n(0));
  if(k==='chart_fraction_to_angle'&&ns.length)expected=times(n(0),rat(360));
 }
 if(topic==='units'){
  if(k==='unit_mixed_length'&&ns.length>=2)expected=plus(times(n(0),rat(100)),n(1));
  if(k==='unit_mixed_time'&&ns.length>=2)expected=plus(times(n(0),rat(60)),n(1));
  if(k==='unit_direct'){
   const m=text.match(/^(\d+)\s*(км|мин|см|мм|кг|ч|т|ц|г|м|с)\s*=\s*\?\s*(км|мин|см|мм|кг|ч|т|ц|г|м|с)(?=\s|$)/);
   const factors={'км':1000000n,'м':1000n,'см':10n,'мм':1n,'т':1000000n,'ц':100000n,'кг':1000n,'г':1n,'ч':3600n,'мин':60n,'с':1n};
   if(m)expected=rat(BigInt(m[1])*factors[m[2]],factors[m[3]]);
  }
 }
 if(topic==='word'){
  if(k==='word_price'&&ns.length>=2)expected=times(n(0),n(1));
  if(k==='word_distance'&&ns.length>=2)expected=times(n(0),n(1));
  if(k==='word_three_steps'&&ns.length>=5)
   expected=minus(n(4),plus(times(n(0),n(1)),times(n(2),n(3))));
 }
 if(topic==='frac_shapes'){
  if(k==='shape_diameter'&&ns.length)expected=times(n(0),rat(2));
  if(k==='shape_radius_difference'&&ns.length)expected=divide(n(0),rat(2));
  const c={
   shape_concept_0:'Круг содержит внутреннюю область, а окружность — его граница',
   shape_concept_1:'Окружность',
   shape_concept_2:'Круг',
   shape_concept_3:'Радиус',
   shape_concept_4:'Диаметр',
   shape_concept_5:'Шар',
   shape_concept_6:'Круг',
   shape_concept_7:'Два равных круга',
   shape_cylinder:'Цилиндр'
  };
  if(k in c)label=c[k];
 }
 if(topic==='frac_read'){
  if(k==='read_to_words'&&fractions.length){
   const parts=fractions[0].split('/').map(Number);
   label=fracWords(parts[0],parts[1]);
  }else if(k.startsWith('read_from_words')){
   const quoted=text.match(/«([^»]+)»/);
   if(quoted)for(let n=1;n<=9;n++)for(let d=2;d<=10;d++){
    if(fracWords(n,d)===quoted[1])label=n+'/'+d;
   }
  }
 }
 if(topic==='frac_types'){
  const isProper=f=>{const [n,d]=f.split('/').map(BigInt);return n<d};
  if(/^Сколько правильных дробей среди/.test(text))expected=rat(fractions.filter(isProper).length);
  else if(/^Сколько неправильных дробей среди/.test(text))expected=rat(fractions.filter(f=>!isProper(f)).length);
  else if(/Из дробей со знаменателем (\d+) выбери правильную/.test(text)){
   const m=text.match(/знаменателем (\d+)/),ans=q.answer.match(/^(\d+)\/(\d+)$/);
   return {check:true,ok:!!ans&&BigInt(ans[2])===BigInt(m[1])&&BigInt(ans[1])<BigInt(ans[2]),expected:'proper fraction with denominator '+m[1]};
  }
  else if(/Из дробей со знаменателем (\d+) найди ту, которая больше единицы/.test(text)){
   const m=text.match(/знаменателем (\d+)/),ans=q.answer.match(/^(\d+)\/(\d+)$/);
   return {check:true,ok:!!ans&&BigInt(ans[2])===BigInt(m[1])&&BigInt(ans[1])>BigInt(ans[2]),expected:'improper fraction greater than 1 with denominator '+m[1]};
  }
  else if(/Числитель дроби .*увеличивают на натуральное число/.test(text)||/Дробь .* правильная.*На сколько минимум/.test(text)){
   if(fractions.length){const [u,d]=fractions[0].split('/').map(BigInt);expected=rat(d-u)}
  }
  else if(/^Если знаменатель дроби равен/.test(text)&&ns.length)expected=minus(n(0),rat(1));
  else if(/^У неправильной дроби числитель/.test(text)&&ns.length)expected=n(0);
  else if(/Из дробей со знаменателем (\d+) выбери ту, которая равна единице/.test(text)){
   const m=text.match(/знаменателем (\d+)/);label=m[1]+'/'+m[1];
  }
  else if(/При знаменателе (\d+) найди наибольший натуральный числитель правильной дроби/.test(text)){
   const m=text.match(/знаменателе (\d+)/);expected=rat(BigInt(m[1])-1n);
  }
  else if(/^В какой паре обе дроби неправильные/.test(text)){
   const choices=q.choices||[],valid=choices.filter(o=>{
    const fs=o.label.match(/\d+\/\d+/g)||[];
    return fs.length===2&&fs.every(f=>!isProper(f));
   });
   if(valid.length!==1)return {check:true,ok:false,expected:'exactly one pair of improper fractions'};
   label=valid[0].label;
  }
  else if(/^Какая из перечисленных дробей правильная/.test(text)){
   const a=q.answer.match(/^(\d+)\/(\d+)$/);return {check:true,ok:!!a&&BigInt(a[1])<BigInt(a[2]),expected:'proper fraction'};
  }
  else if(/наименьшее натуральное число в числителе сделает дробь неправильной/.test(text)&&ns.length)expected=n(0);
  else if(/Определи вид дроби/.test(text)&&fractions.length){
   label=isProper(fractions[0])?'правильная':'неправильная';
  }
 }
 if(topic==='frac_word'){
  if(k==='frac_word_reverse'&&ns.length>=2)expected=minus(divide(n(0),n(1)),n(0));
  if(k==='frac_word_remainder'&&ns.length>=2)expected=minus(n(0),times(n(0),n(1)));
  if(k==='frac_word_two_steps'&&ns.length>=3)expected=minus(minus(n(0),times(n(0),n(1))),n(2));
 }
 if(expected===null&&label===null)return {check:false,reason:'unsupported-template'};
 const ok=label!==null?q.answer.trim()===label:eq(expected,v);
 return {check:true,ok,expected:label??expected.join('/')};
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const samples=await page.evaluate(()=>{
   const ids=['natural','coordinate','operations','order','powers','equations','geometry','volume','angles','charts','units','word','frac_shapes','frac_read','frac_types','frac_word'];
   const items=[],problems=[];
   for(const topic of ids)for(let stage=0;stage<3;stage++)for(let session=0;session<40;session++){
    blockSession={kind:'g5quiz',key:'g5:'+topic,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+topic;
    for(let pos=0;pos<5;pos++){blockSession.done=pos;try{
     const q=freshQuiz(qid);items.push({topic,stage,template:q.templateId||'base',text:stripHtmlText(String(q.text||'')),answer:String(q.correctText||''),choices:(q.choices||[]).map(c=>({key:c.key,label:stripHtmlText(String(c.label))}))});
    }catch(e){problems.push({topic,stage,session,pos,error:String(e)})}}
   }
   return {topics:ids.length,items,problems};
  });
  const issues=[],unsupported={},unsupportedExamples={},verified={};
  for(const q of samples.items){
   try{
    const x=oracle(q);
    if(!x.check){const key=q.topic+'/'+q.template;unsupported[key]=(unsupported[key]||0)+1;if(!unsupportedExamples[key])unsupportedExamples[key]={question:q.text,answer:q.answer}}
    else{verified[q.topic]=(verified[q.topic]||0)+1;if(!x.ok)issues.push({topic:q.topic,stage:q.stage,template:q.template,question:q.text,actual:q.answer,expected:x.expected})}
   }catch(e){issues.push({topic:q.topic,stage:q.stage,template:q.template,question:q.text,error:String(e)})}
  }
  issues.push(...samples.problems,...errors.map(e=>({topic:'browser',error:e})));
  const grouped={};for(const x of issues){const id=x.topic+'/'+x.template;const a=grouped[id]||(grouped[id]={count:0,examples:[]});a.count++;if(a.examples.length<2)a.examples.push(x)}
  const report={topics:samples.topics,sampled:samples.items.length,verified:Object.values(verified).reduce((a,b)=>a+b,0),verifiedByTopic:verified,unsupported,unsupportedExamples,problemCount:issues.length,grouped,problems:issues.slice(0,40)};
  fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage14b_core_oracle.json',JSON.stringify(report,null,2));
  console.log('STAGE14B_CORE_AUDIT',JSON.stringify({...report,unsupported:Object.entries(unsupported).slice(0,30),unsupportedExamples:Object.entries(unsupportedExamples).slice(0,50),problems:report.problems.slice(0,8)}));
  assert.equal(report.sampled,16*3*40*5);assert.equal(report.problemCount,0,'Independent natural and geometry math mismatch');
  assert(report.verified>8500,'Independent natural/math coverage too small');
  console.log('STAGE14B_CORE_ORACLE_PASS',JSON.stringify({topics:report.topics,sampled:report.sampled,verified:report.verified,problems:report.problemCount}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE14B_CORE_ORACLE_FAIL',e.stack||e);process.exit(1)});
