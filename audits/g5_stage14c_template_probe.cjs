'use strict';
const path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const targets=new Set(['angle_protractor','shape_radius_difference','power_in_expression','parts_complement','ray_shift_fraction','types_choose_proper','decimal_add_context_three','decimal_sub_context_three','unit_direct']);
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
 const p=await browser.newPage();await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const data=await p.evaluate(()=>{
 const exclude=new Set(['frac_compare_den','frac_compare_num','mixed_compare','mixed_sub']);
 const ts=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].filter(t=>!exclude.has(t.id)),out={},seen={};
 for(const t of ts)for(let stage=0;stage<3;stage++)for(let run=0;run<18;run++){
 blockSession={kind:'g5quiz',key:'g5:'+t.id,stageIndex:stage,total:5,done:0,usedSignatures:[],items:[],finished:false};qid='g5:'+t.id;
 for(let pos=0;pos<5;pos++){blockSession.done=pos;const q=freshQuiz(qid),key=t.id+'::'+(q.templateId||'base');
 seen[key]=(seen[key]||0)+1;
 if(!out[key])out[key]=[];
 if(out[key].length<3){
  const el=document.createElement('div');el.innerHTML=q.text||'';
  out[key].push({text:stripHtmlText(q.text||''),html:(q.text||'').slice(0,1700),answer:String(q.correctText||''),ex:stripHtmlText(q.ex||''),template:q.templateId,stage});
 }}
 }
 return {out,seen};
 });
 fs.mkdirSync('audits/out',{recursive:true});fs.writeFileSync('audits/out/g5_stage14c_unresolved_samples.json',JSON.stringify(data,null,2));
 for(const [key,items] of Object.entries(data.out)){
 if(/^(angles::angle_protractor|frac_shapes::shape_|frac_types::|powers::|frac_parts::parts_complement|frac_ray::ray_shift_fraction|dec_add::decimal_add_context_three|dec_sub::decimal_sub_context_three|units::unit_direct|frac_read::read_from_words)/.test(key))
 console.log('STAGE14C_TEMPLATE',JSON.stringify({key,n:data.seen[key],samples:items.map(q=>({text:q.text.slice(0,190),answer:q.answer,ex:q.ex.slice(0,180),html:q.html.slice(0,300)}))}));
 }
 console.log('STAGE14C_ANGLE_SVG',JSON.stringify((data.out['angles::angle_protractor']||[]).slice(0,2)));
 console.log('STAGE14C_PROBE_PASS',Object.keys(data.out).length);
}finally{await browser.close()}})().catch(e=>{console.error('STAGE14C_PROBE_FAIL',e.stack||e);process.exit(1)});
