'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert(sw.includes('APP_BUILD_HASH = "'+crypto.createHash('sha256').update(html).digest('hex')+'"'));
 assert(sw.includes('"./g5-fractions-v114.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});let checks=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:790}}),jsErrors=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    const ids=window.mkG5V114Fractions,errors=[],counts={},families={},states={};
    const fractionNames=['frac_shapes','frac_parts','frac_read','frac_ray','frac_compare_den','frac_compare_num','frac_types','frac_add','frac_sub','frac_division','frac_to_mixed','mixed_to_frac','mixed_compare','mixed_add','mixed_sub','frac_equal','frac_reduce','frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff','frac_mul_common','frac_part_number','frac_div_common','frac_restore','frac_word'];
    if(ids.join(',')!=='frac_parts,frac_read,frac_ray,frac_types')errors.push('Wrong target IDs');
    if(G5_FRACTIONS.map(x=>x.id).join('|')!==fractionNames.join('|'))errors.push('Incorrect fraction paragraph order');
    if(g5AllTopics().length!==74)errors.push('Catalog count not 74: '+g5AllTopics().length);
    const numberWords=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
    const endings={2:['вторая','вторых'],3:['третья','третьих'],4:['четвёртая','четвёртых'],5:['пятая','пятых'],6:['шестая','шестых'],7:['седьмая','седьмых'],8:['восьмая','восьмых'],9:['девятая','девятых'],10:['десятая','десятых'],11:['одиннадцатая','одиннадцатых']};
    function form(n,d){return numberWords[n]+' '+endings[d][n===1?0:1]}
    const allEndings=Object.entries(endings).flatMap(([d,arr])=>arr.map(word=>({d:Number(d),word}))).sort((a,b)=>b.word.length-a.word.length);
    function wordPairs(text){
      const reg=/(одна|две|три|четыре|пять|шесть|семь|восемь|девять)\s+([а-яё]+)/gu;
      const arr=[];for(const m of text.matchAll(reg)){const e=allEndings.find(e=>e.word===m[2]);if(e)arr.push({n:numberWords.indexOf(m[1]),d:e.d,tail:m[2]})}
      return arr;
    }
    function parse(q){
      const box=document.createElement('div');box.innerHTML=q.text;
      const fr=[...box.querySelectorAll('.frac')].map(el=>({n:Number(el.querySelector('.num')?.textContent),d:Number(el.querySelector('.den')?.textContent)}));
      for(const el of [...box.querySelectorAll('.frac')])el.replaceWith(document.createTextNode(' F '));
      const svg=box.querySelector('svg'),marks=[];
      let unit=0,shaded=0;
      if(svg){
       const tick=[...svg.querySelectorAll('line')].filter(el=>el.getAttribute('x1')===el.getAttribute('x2'));
       if(tick.length>1)unit=(tick.length-1)/2;
       for(const circle of svg.querySelectorAll('circle'))marks.push(Math.round((Number(circle.getAttribute('cx'))-38)*2*unit/540));
       shaded=[...svg.querySelectorAll('rect')].filter(x=>x.getAttribute('fill')==='#5d9cdc').length;
       svg.remove();
      }
      const text=box.textContent.replace(/\s+/g,' ').trim(),nums=(text.match(/\d+/g)||[]).map(Number);
      return {text,nums,fr,words:wordPairs(text),marks,unit,shaded};
    }
    function answer(id,t,p,q){
      const v=parse(q),n=v.nums,f=v.fr,w=v.words,m=v.marks,d=v.unit;
      const N=x=>({kind:'numeric',value:x}),F=(x,y)=>({kind:'fraction',value:x+'/'+y}),S=x=>({kind:'choice',value:x});
      if(id==='frac_parts'){
       if(t===0)return [()=>(N(f[0]?.n)),()=>(N(f[0]?.d)),()=>(N(n[0])),()=>(N(v.shaded)),()=>(N(f[0]?.d-f[0]?.n))][p]();
       if(t===1)return [()=>(N(n[0]+v.shaded)),()=>(N(n[0]-n[1])),()=>(N(f[0].n+f[1].n)),()=>(N(f[1].n-f[0].n)),()=>(F(n[1]+n[2],n[0]))][p]();
       return [()=>(N(n[1]+n[2]-n[3])),()=>(N(n[1]-n[2]+n[3])),()=>(F(n[2],n[0])),()=>(N(f[0].n-f[1].n-f[2].n)),()=>(N(n[0]*n[1]-n[2]-n[3]))][p]();
      }
      if(id==='frac_read'){
       if(t===0)return [()=>(F(w[0]?.n,w[0]?.d)),()=>(S(form(f[0]?.n,f[0]?.d))),()=>(N(w[0]?.n)),()=>(N(w[0]?.d)),()=>(S(w[0]?.tail))][p]();
       if(t===1)return [()=>(F(n[1],n[0])),()=>(S(form(f[0]?.n,f[0]?.d))),()=>(N(w[0]?.n+w[1]?.n)),()=>(F(w[0]?.n-w[1]?.n,w[0]?.d)),()=>(N(w[0]?.n+n[0]))][p]();
       return [()=>(F(n[1]+n[2]-1,n[0])),()=>(N(w[0]?.n+f[0]?.n-w[1]?.n)),()=>(S(form(w[0]?.n+f[0]?.n-f[1]?.n,w[0]?.d))),()=>(F((n[1]+n[2])/2,n[0])),()=>(F(n[1]+1-n[0],n[2]))][p]();
      }
      if(id==='frac_ray'){
       if(t===0)return [()=>(F(m[0],d)),()=>(N(m[0])),()=>(N(m[0])),()=>(N(d)),()=>(N(d-m[0]))][p]();
       if(t===1)return [()=>(N(m[1]-m[0])),()=>(N(m[0]+n[0])),()=>(F(m[0],d)),()=>(N(m[0])),()=>(N(d-m[1]))][p]();
       return [()=>(F(m[0]+n[0]-n[1],d)),()=>(F(m[1]+n[0],d)),()=>(F(m[1]-m[0],d)),()=>(N(m[1]-n[0])),()=>(N(m[1]+n[0]))][p]();
      }
      if(id==='frac_types'){
       if(t===0)return [()=>(S('Правильная')),()=>(S('Неправильная')),()=>(S('Меньше 1')),()=>(N(n[0])),()=>(N(n[1]-n[0]))][p]();
       if(t===1)return [()=>(S('Неправильная')),()=>(S('Правильная')),()=>(F(f[0]?.n,f[0]?.d)),()=>(N(Math.floor(f[0]?.n/f[0]?.d))),()=>(N(f[0]?.d-f[0]?.n))][p]();
       return [()=>(N(n[1]-n[0]+1)),()=>(N(f[0]?.d-f[0]?.n)),()=>(S('Неправильная')),()=>(N(f[0]?.n-f[0]?.d)),()=>(N(n[1]+1-n[0]))][p]();
      }
      throw Error('Unknown oracle topic '+id);
    }
    function normalizedLabel(html){
      const el=document.createElement('div');el.innerHTML=String(html??'');
      const fs=[...el.querySelectorAll('.frac')];for(const f of fs)f.replaceWith(document.createTextNode(Number(f.querySelector('.num')?.textContent)+'/'+Number(f.querySelector('.den')?.textContent)));
      return el.textContent.replace(/\s+/g,' ').trim();
    }
    for(const id of ids){
      families[id]=[new Set(),new Set(),new Set()];
      if(!g5Lesson(id)?.trim())errors.push('Missing lesson '+id);
      for(let t=0;t<3;t++)for(let batch=0;batch<10;batch++){
       const inSession=new Set(),sig=new Set();
       for(let p=0;p<5;p++){
        blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,total:5,done:p,usedSignatures:[],items:[],finished:false};
        qid='g5:'+id;
        try{
         const q=g5DonorQuestion(id),o=answer(id,t,p,q);
         if(q.templateId!=='v114_'+id+'_L'+t+'_F'+p)errors.push('Wrong template '+id+'/'+t+'/'+p);
         if(o.kind==='numeric'&&String(q.correct)!==String(o.value))errors.push('Numeric arithmetic mismatch '+id+'/'+t+'/'+p+' '+q.correct+' vs '+o.value);
         if(o.kind==='fraction'&&String(q.correct)!==String(o.value))errors.push('Fraction arithmetic mismatch '+id+'/'+t+'/'+p+' '+q.correct+' vs '+o.value);
         if(o.kind==='choice'&&normalizedLabel(q.correctLabel)!==o.value)errors.push('Classification or word mismatch '+id+'/'+t+'/'+p+' '+normalizedLabel(q.correctLabel)+' vs '+o.value);
         if(!q.choices?.some(c=>String(c.key)===String(q.correct)))errors.push('Correct choice missing '+id);
         if(new Set(q.choices.map(c=>normalizedLabel(c.label))).size!==q.choices.length)errors.push('Duplicated displayed choices '+id+'/'+t+'/'+p);
         if(!q.explain?.trim())errors.push('Missing solution '+id+'/'+t+'/'+p);
         if(inSession.has(q.templateId))errors.push('Repeated question family '+id+'/'+t+'/'+p);
         inSession.add(q.templateId);families[id][t].add(q.templateId);
         const signature=q.text+'|'+q.correct;
         if(sig.has(signature))errors.push('Repeated exact question '+id+'/'+t+'/'+p);
         sig.add(signature);
         counts[id]=(counts[id]||0)+1;
        }catch(e){errors.push('Exception '+id+'/'+t+'/'+p+': '+e)}
       }
       if(inSession.size!==5)errors.push('Not five families '+id+'/'+t+'/'+batch);
      }
      for(let t=0;t<3;t++)if(families[id][t].size!==5)errors.push('Tier families missing '+id+'/'+t);
      if(families[id][0].size+families[id][1].size+families[id][2].size!==15)errors.push('Stage variety missing '+id);
    }
    for(const id of ids)for(let t=0;t<3;t++){
      blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:t,total:5,done:0,usedSignatures:[],items:[],finished:false};
      qid='g5:'+id;
      try{
       const q=makeG5Question(id);
       if(!q.text||!q.ex||!q.choices||q.choices.length<2||!q.correctText)errors.push('UI normalizer failure '+id+'/'+t);
      }catch(e){errors.push('UI conversion threw '+id+'/'+t+': '+e)}
    }
    renderGrade5();
    const search=mainView.querySelector('#mk-textbook-search-input-5'),cards=[...mainView.querySelectorAll('.g5-card')];
    if(cards.length!==74)errors.push('Expected 74 cards, got '+cards.length);
    if(!search)errors.push('Missing search');
    else{
      for(const id of ids){
        search.value=G5_FRACTIONS.find(x=>x.id===id).title;search.dispatchEvent(new Event('input',{bubbles:true}));
        const shown=cards.filter(x=>!x.hidden);
        if(shown.length!==1||!shown[0].textContent.includes(search.value))errors.push('Search failed '+id+' '+shown.length);
      }
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
      if(cards.filter(c=>!c.hidden).length!==74)errors.push('Search reset failed');
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)errors.push('Horizontal overflow '+window.innerWidth);
    return {counts,errors:errors.slice(0,30),issueCount:errors.length};
   });
   assert.deepEqual(jsErrors,[]);
   assert.equal(report.issueCount,0,JSON.stringify(report.errors));
   checks+=Object.values(report.counts).reduce((x,y)=>x+y,0);
   console.log('G5_V114_FRACTION_WIDTH_PASS',JSON.stringify({width,topics:4,questions:Object.values(report.counts).reduce((x,y)=>x+y,0)}));
   await page.close();
  }
  console.log('G5_V114_FRACTION_ORACLE_PASS',JSON.stringify({checks,topics:4,stages:3,questionFamilies:60,widths:4}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V114_FRACTION_ORACLE_FAIL',e.stack||e);process.exit(1)});
