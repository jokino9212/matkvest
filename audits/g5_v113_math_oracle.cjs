'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
function expected(q){
 const name=String(q.templateId), s=String(q.text), n=(s.match(/\d+/g)||[]).map(Number);
 const sum=xs=>xs.reduce((a,b)=>a+b,0), max=Math.max,min=Math.min, abs=Math.abs;
 switch(name){
  case 'cmp_max':return max(n[0],n[1]);
  case 'cmp_delta':return n[0]-n[1];
  case 'cmp_successor':return n[0]+1;
  case 'cmp_three':return max(n[0],n[1],n[2]);
  case 'cmp_between':return n[1]-n[0]-1;
  case 'cmp_sum_gap':return abs((n[0]+n[1])-(n[2]+n[3]));
  case 'cmp_median':return n.slice(0,3).sort((a,b)=>a-b)[1];
  case 'cmp_adjusted':return max(n[0]-n[1],n[2]+n[3]);
  case 'cmp_lower_bound':return max(n[0],n[1])+1;
  case 'cmp_new_between':return max(0,abs((n[0]-n[1])-(n[2]+n[3]))-1);
  case 'cmp_complex_values':return abs((n[0]+n[1])*n[2]-(n[3]*n[4]+n[5]*n[6]));
  case 'cmp_middle_gap':{const v=n.slice(0,4).sort((a,b)=>a-b);return v[2]-v[1];}
  case 'cmp_transform_difference':return abs((n[0]-n[1]+n[2])-(n[3]-n[4]+n[5]));
  case 'cmp_expression_interval':return max(0,abs(n[0]+n[1]-n[2]-n[3])-1);
  case 'cmp_extremes_shift':return max(n[0],n[1],n[2])-min(n[0],n[1],n[2])+n[3]+n[4];
  case 'cuboid_faces_basic':return '6';
  case 'cuboid_edges_basic':return '12';
  case 'cuboid_base_cubes':return n[0]*n[1];
  case 'cuboid_vertices_basic':return '8';
  case 'cuboid_single_face':return n[0]*n[1];
  case 'cuboid_opposite_faces':return 2*n[0]*n[1];
  case 'cuboid_total_edges':return 4*sum(n.slice(0,3));
  case 'cuboid_missing_height':return n[0]/(n[1]*n[2]);
  case 'cuboid_three_faces':return n[0]*n[1]+n[0]*n[2]+n[1]*n[2];
  case 'cuboid_pair_volume':return 2*n[0]*n[1]*n[2];
  case 'cuboid_lateral_area':return 2*n[2]*(n[0]+n[1]);
  case 'cuboid_inverse_edges':return n[0]/4-n[1]-n[2];
  case 'cuboid_volume_increase':return n[1]*n[2]*n[3];
  case 'cuboid_open_box':return 2*(n[0]*n[1]+n[0]*n[2]+n[1]*n[2])-n[0]*n[1];
  case 'cuboid_three_new_boxes':return 3*(n[0]+n[3])*n[1]*n[2];
  case 'calc_simple_add':return n[0]+n[1];
  case 'calc_simple_sub':return n[0]-n[1];
  case 'calc_simple_mul':return n[0]*n[1];
  case 'calc_simple_div':return n[0]/n[1];
  case 'calc_three_add':return sum(n.slice(0,3));
  case 'calc_parenthesized':return (n[0]+n[1])*n[2];
  case 'calc_screen_chain':return n[0]+n[1]-n[2];
  case 'calc_div_brackets':return (n[0]-n[1])/n[2];
  case 'calc_result_error':return abs(n[0]-n[1]*n[2]);
  case 'calc_story_chain':return (n[0]+n[1])*n[2];
  case 'calc_four_operations':return (n[0]+n[1])*n[2]-n[3]*n[4];
  case 'calc_three_buttons':return (n[0]+n[1])*n[2]-n[3];
  case 'calc_reverse_chain':return n[2]/n[1]-n[0]+n[3];
  case 'calc_compare_formulas':return abs((n[0]+n[1])*n[2]-(n[3]*n[4]+n[5]*n[6]));
  case 'calc_multistep_story':return n[0]*n[1]+n[2]-n[3];
  case 'angle_classify_acute':return 'Острый';
  case 'angle_classify_obtuse':return 'Тупой';
  case 'angle_right_gap':return 90-n[0];
  case 'angle_straight_gap':return 180-n[0];
  case 'angle_square':return 'Прямой';
  case 'angle_sum_parts':return sum(n.slice(0,3));
  case 'angle_missing_right':return 90-n[0]+n[1];
  case 'angle_compare_parts':return abs((n[0]-n[1])-n[1]);
  case 'angle_adjacent':return 180-n[0]+n[1];
  case 'angle_around_point':return 360-sum(n.slice(0,3));
  case 'angle_three_parts':return 180-sum(n.slice(0,2));
  case 'angle_four_parts':return 360-sum(n.slice(0,3));
  case 'angle_supplement_compare':return 180-sum(n.slice(0,3));
  case 'angle_two_subtractions':return n[0]-n[2];
  case 'angle_rebalance':return n[0]+n[1]-n[2];
  default:throw Error('No independent oracle for '+name+': '+s);
 }
}
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),hash=crypto.createHash('sha256').update(html).digest('hex');
 assert(sw.includes('APP_BUILD_HASH = "'+hash+'"'));
 assert(sw.includes('"./g5-pedagogy-v113.js"'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let validated=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:780}}),pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const rows=await page.evaluate(()=>{
    if(g5AllTopics().length!==74)throw Error('Grade 5 catalog drift: '+g5AllTopics().length);
    const ids=window.mkG5V113Tiered,items=[],failures=[];
    if(ids.join('|')!=='natural_compare|cuboid|calculator|angle_types')throw Error('v113 ID drift');
    for(const id of ids)for(let tier=0;tier<3;tier++)for(let session=0;session<12;session++){
     const seen=new Set(),templates=new Set();
     for(let step=0;step<5;step++){
      blockSession={kind:'g5quiz',key:'g5:'+id,stageIndex:tier,total:5,done:step,usedSignatures:[],items:[],finished:false};qid='g5:'+id;
      let q;
      try{q=freshQuiz(qid)}catch(e){failures.push('Generation error '+id+': '+e);continue}
      const key=q.templateId,correct=q.correctText,labels=(q.choices||[]).map(c=>String(c.label));
      if(!q.mk5Pedagogy||q.mk5Pedagogy.stage!==tier||q.mk5Pedagogy.steps<tier+1)failures.push('Missing true stage progression '+id+'/'+tier+'/'+step);
      if(!q.ex?.trim()||!q.text?.trim())failures.push('Missing question or explanation '+id);
      if(new Set(labels).size!==labels.length)failures.push('Duplicate answer choices '+id+'/'+key);
      if(q.choices?.filter(c=>String(c.key)===String(q.ans)).length!==1)failures.push('No unique correct answer '+id+'/'+key);
      if(templates.has(key))failures.push('Repeating family '+id+'/'+tier+'/'+step);
      templates.add(key);
      const sig=JSON.stringify([q.text,correct,labels.slice().sort()]);
      if(seen.has(sig))failures.push('Repeated task '+id+'/'+tier+'/'+step);
      seen.add(sig);
      items.push({id,tier,step,key,correct,text:q.text,steps:q.mk5Pedagogy?.steps});
     }
     if(templates.size!==5)failures.push('Five distinct families missing '+id+'/'+tier+'/'+session);
    }
    renderGrade5();
    const search=mainView.querySelector('#mk-textbook-search-input-5');
    if(!search)failures.push('Textbook search not present');
    else for(const id of ids){
     const title=g5AllTopics().find(t=>t.id===id).title;
     search.value=title;search.dispatchEvent(new Event('input',{bubbles:true}));
     if(mainView.querySelectorAll('.g5-card:not([hidden])').length!==1)failures.push('Topic search regression '+title);
    }
    if(document.documentElement.scrollWidth>window.innerWidth+2)failures.push('Horizontal overflow '+window.innerWidth);
    return {items,failures};
   });
   assert.deepEqual(pageErrors,[],'Browser runtime errors');
   assert.deepEqual(rows.failures,[],'Session / UI defects');
   for(const q of rows.items){
    const exp=expected(q);
    assert.equal(String(q.correct),String(exp),'Wrong mathematical answer in '+q.id+'/'+q.key+'/'+q.tier+' : '+q.text);
   }
   assert.equal(rows.items.length,4*3*12*5);
   validated+=rows.items.length;
   console.log('G5_V113_WIDTH_PASS',width,'questions',rows.items.length);
   await page.close();
  }
  console.log('G5_V113_MATH_AND_PEDAGOGY_PASS',JSON.stringify({validatedQuestions:validated,topics:4,stages:3,variantsPerSession:5,devices:4}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V113_MATH_AND_PEDAGOGY_FAIL',e.stack||e);process.exit(1)});
