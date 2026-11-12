'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 assert(sw.includes('"./g5-textbook-v112.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let total=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:800}}),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const result=await page.evaluate(()=>{
    const all=g5AllTopics(),ids=window.mkG5V112Topics,issues=[];
    function numbers(pattern,text){
      const m=String(text).match(pattern);
      if(!m)throw Error('Cannot parse '+text+' with '+pattern);
      return m.slice(1).map(Number);
    }
    function oracle(q){
      const f=q.templateId,text=q.text;
      let xs;
      switch(f){
       case 'cmp_digits':xs=numbers(/больше: (\d+) или (\d+)/,text);return Math.max(...xs);
       case 'cmp_difference':xs=numbers(/На сколько (\d+) больше (\d+)/,text);return xs[0]-xs[1];
       case 'cmp_order':xs=numbers(/Числа (\d+), (\d+) и (\d+)/,text);return xs.sort((a,b)=>a-b)[1];
       case 'cmp_increase':xs=numbers(/Число (\d+) увеличили на (\d+)/,text);return xs[0]+xs[1];
       case 'cmp_after_change':xs=numbers(/Сравни числа (\d+) и (\d+)\. Затем к меньшему прибавь (\d+)/,text);return Math.max(Math.max(xs[0],xs[1]),Math.min(xs[0],xs[1])+xs[2]);
       case 'segment_parts':xs=numbers(/AC = (\d+) см и CB = (\d+)/,text);return xs[0]+xs[1];
       case 'polyline_length':xs=numbers(/звеньев (\d+) см, (\d+) см и (\d+)/,text);return xs.reduce((a,b)=>a+b);
       case 'polygon_perimeter':xs=numbers(/стороны (\d+) см, (\d+) см и (\d+)/,text);return xs.reduce((a,b)=>a+b);
       case 'polygon_five_edges':xs=numbers(/четыре стороны длиной (\d+) см, а пятая (\d+)/,text);return 4*xs[0]+xs[1];
       case 'polyline_inverse':xs=numbers(/длину (\d+) см\. Первые звенья (\d+) см и (\d+)/,text);return xs[0]-xs[1]-xs[2];
       case 'geometry_figures':return 'Отрезок';
       case 'geometry_two_points':return 1;
       case 'geometry_ray':return 'Луч';
       case 'geometry_choose_segments':xs=numbers(/отмечены (\d+) различных точек/,text);return xs[0]*(xs[0]-1)/2;
       case 'geometry_choose_angles':xs=numbers(/выходят (\d+) различных лучей/,text);return xs[0]*(xs[0]-1)/2;
       case 'rectangle_area':xs=numbers(/сторонами (\d+) см и (\d+) см/,text);return xs[0]*xs[1];
       case 'rectangle_side':xs=numbers(/Площадь прямоугольника (\d+) см², ширина (\d+)/,text);return xs[0]/xs[1];
       case 'rectangle_compound':xs=numbers(/(\d+) × (\d+) см приставили второй (\d+) × (\d+) см/,text);return xs[0]*xs[1]+xs[2]*xs[3];
       case 'rectangle_cutout':xs=numbers(/прямоугольника (\d+) × (\d+) см вырезали прямоугольник (\d+) × (\d+)/,text);return xs[0]*xs[1]-xs[2]*xs[3];
       case 'rectangle_area_change':xs=numbers(/прямоугольника (\d+) × (\d+) см увеличили на (\d+) см, а ширину на (\d+)/,text);return (xs[0]+xs[2])*(xs[1]+xs[3])-xs[0]*xs[1];
       case 'cuboid_faces':return '6';
       case 'cuboid_vertices':return '8';
       case 'cuboid_edges':xs=numbers(/измерения: (\d+), (\d+) и (\d+)/,text);return 4*(xs[0]+xs[1]+xs[2]);
       case 'cuboid_cubes':xs=numbers(/размеры (\d+) × (\d+) × (\d+)/,text);return xs[0]*xs[1]*xs[2];
       case 'cuboid_surface':xs=numbers(/размерами (\d+) × (\d+) × (\d+)/,text);return 2*(xs[0]*xs[1]+xs[0]*xs[2]+xs[1]*xs[2]);
       case 'calc_add':xs=numbers(/сумму (\d+) \+ (\d+)/,text);return xs[0]+xs[1];
       case 'calc_subtract':xs=numbers(/показывает (\d+)\. После нажатия «−» и ввода (\d+)/,text);return xs[0]-xs[1];
       case 'calc_multiply':xs=numbers(/Вычисли (\d+) · (\d+) · (\d+)/,text);return xs[0]*xs[1]*xs[2];
       case 'calc_order':xs=numbers(/Вычисли \((\d+) \+ (\d+)\) · (\d+)/,text);return (xs[0]+xs[1])*xs[2];
       case 'calc_error':xs=numbers(/показал (\d+) для произведения (\d+) · (\d+)/,text);return Math.abs(xs[0]-xs[1]*xs[2]);
       case 'angle_acute':return 'Острый';
       case 'angle_square_tool':return 'Прямой';
       case 'angle_obtuse':return 'Тупой';
       case 'angle_to_right':xs=numbers(/Угол (\d+)°/,text);return 90-xs[0];
       case 'angle_supplement':xs=numbers(/Первый угол (\d+)°/,text);return 180-xs[0];
       default:throw Error('Missing independent oracle: '+f);
      }
    }
    if(all.length!==74)issues.push('Catalog not 74 topics: '+all.length);
    for(const id of ids){
     if(all.filter(t=>t.id===id).length!==1)issues.push('Missing/duplicate '+id);
     if(!g5Lesson(id)?.trim())issues.push('Missing lesson '+id);
     for(let stage=0;stage<3;stage++)for(let session=0;session<10;session++){
      const templates=new Set(),signatures=new Set();
      for(let i=0;i<5;i++){
       blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:stage,total:5,done:i,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
       try{
        const q=freshQuiz(qid),expect=oracle(q);
        if(String(q.correctText)!==String(expect))issues.push('Incorrect answer '+id+'/'+q.templateId+': '+q.correctText+' should '+expect);
        if(!q.text||!q.ex)issues.push('Missing explanation '+id);
        const keys=(q.choices||[]).map(x=>String(x.key));
        if(keys.filter(k=>k===String(q.ans)).length!==1)issues.push('Correct option key '+id);
        const labels=(q.choices||[]).map(x=>String(x.label));
        if(new Set(labels).size!==labels.length)issues.push('Duplicate displayed option '+id+'/'+q.templateId);
        templates.add(q.templateId);
        const sig=JSON.stringify([q.text,q.correctText,labels.slice().sort()]);
        if(signatures.has(sig))issues.push('Exact repeated question '+id+'/'+stage+'/'+session);
        signatures.add(sig);
       }catch(e){issues.push('Failed '+id+'/'+stage+'/'+i+': '+String(e))}
      }
      if(templates.size!==5)issues.push('Not 5 families '+id+'/'+stage+'/'+session+': '+[...templates].join(','));
     }
    }
    renderGrade5();
    const cards=[...mainView.querySelectorAll('.g5-card')];
    if(cards.length!==74)issues.push('Visible catalog buttons '+cards.length);
    const heads=[...mainView.querySelectorAll('.g5-group h2')].map(x=>x.textContent);
    for(const name of ['§ 1. Натуральные числа','§ 2. Сложение','§ 3. Умножение','§ 4. Площади','§ 7. Инструменты']){
     if(!heads.some(h=>h.includes(name)))issues.push('Textbook section not shown: '+name);
    }
    const search=mainView.querySelector('#mk-textbook-search-input-5');
    if(!search)issues.push('Search not visible');
    else{
     for(const id of ids){
      const title=all.find(t=>t.id===id).title;
      search.value=title;search.dispatchEvent(new Event('input',{bubbles:true}));
      const visible=cards.filter(x=>!x.hidden);
      if(visible.length!==1||!visible[0].textContent.includes(title))issues.push('Exact title search '+title+': '+visible.length);
     }
     search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
     if(cards.filter(x=>!x.hidden).length!==74)issues.push('Search clear did not restore 74');
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)issues.push('Horizontal overflow width '+window.innerWidth+' / '+document.documentElement.scrollWidth);
    return {topics:all.length,newTopics:ids.length,questions:ids.length*3*10*5,sections:heads,issues:issues.slice(0,35),issueCount:issues.length};
   });
   assert.deepEqual(errors,[],'Browser JS errors');
   assert.equal(result.issueCount,0,JSON.stringify(result.issues));
   total+=result.questions;
   console.log('G5_V112_WIDTH_PASS',width,JSON.stringify({topics:result.topics,questions:result.questions,sections:result.sections.length}));
   await page.close();
  }
  console.log('G5_V112_ORACLES_PASS',JSON.stringify({topics:74,newTopics:7,validatedQuestions:total}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V112_ORACLES_FAIL',e.stack||e);process.exit(1)});
