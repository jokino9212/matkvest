#!/usr/bin/env python3
"""19F: show XP and actual completed stage counts using existing grade analytics."""
from pathlib import Path
import json,hashlib
source=Path('index.html');swp=Path('sw.js')
html=source.read_text('utf-8');sw=swp.read_text('utf-8')
prior='a18915ed7d83dc02444e2736546fbb08484443e4cf5b7d603bcc02364ef6a6df'
if 'id="mk-ui19f-progress-style"' in html:
 assert 'matkvest-iphone-v66' in sw and hashlib.sha256(html.encode()).hexdigest() in sw
 print('UI19F already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==prior,'Refuse non-v65 source'
assert 'matkvest-iphone-v65' in sw and prior in sw
assert 'mk872GetLevelProgress' in html and 'teacherCourseProgress' in html and 'teacherStageBreakdown' in html
assert html.count('</body>')==1
css=r"""
<style id="mk-ui19f-progress-style">
/* A transparent, compact progress view. Game XP is NOT the same as completed study stages. */
.mk19f-home-open,.mk19f-open-all{appearance:none;background:#eff7f1;border:1px solid #c5e0d0;border-radius:11px;color:#1d6449;font:inherit;font-size:13px;font-weight:800;min-height:42px;padding:8px 13px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.mk19f-home-open:hover,.mk19f-open-all:hover{background:#e5f3ea;border-color:#97c6ae}
.mk19f-home-open:focus-visible,.mk19f-open-all:focus-visible,.mk19f-grade-row button:focus-visible,.top .level-pill.mk19f-level-open:focus-visible{outline:3px solid rgba(28,111,79,.37);outline-offset:3px}
.home-start .mk19f-home-open{margin-top:12px}
.top .level-pill.mk19f-level-open{cursor:pointer}
#mk19f-grade-strip{margin:8px 0 17px;padding:12px 15px;border:1px solid #d5e6dc;border-radius:15px;background:#f8fbf9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#mk19f-grade-strip .mk19f-grade-copy{flex:1 1 270px;min-width:0}
#mk19f-grade-strip .mk19f-grade-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#245a42;font-size:13px;line-height:1.35}
#mk19f-grade-strip .mk19f-grade-title strong{font-size:14px;color:#194f38}
#mk19f-grade-strip .mk19f-grade-note{font-size:12px;color:#567568;line-height:1.45;margin-top:5px}
.mk19f-progress-track{display:block;height:8px;width:100%;border-radius:999px;background:#dbe9df;overflow:hidden;margin:9px 0 0}
.mk19f-progress-fill{display:block;height:100%;background:#338f65;border-radius:999px}
#modal .mk19f-modal{display:flex;flex-direction:column;gap:15px;color:#1e4937}
#modal .mk19f-xp-summary{padding:16px 18px;border:1px solid #cee3d6;border-radius:15px;background:#f6faf7}
#modal .mk19f-xp-summary .mk19f-xp-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#modal .mk19f-xp-summary strong{font-size:20px;color:#1b6546;line-height:1.25}
#modal .mk19f-xp-summary .mk19f-xp-percent{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;color:#287550}
#modal .mk19f-small{font-size:12px;line-height:1.5;color:#577266}
#modal .mk19f-xp-summary .mk19f-xp-bottom{font-size:12px;color:#426b55;margin-top:8px;line-height:1.4}
#modal .mk19f-overall{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;align-items:baseline;padding:11px 13px;border-radius:12px;background:#f7faf8;border:1px solid #deebe3}
#modal .mk19f-overall strong{font-size:16px;color:#1d5c3f}
#modal .mk19f-overall small{font-size:12px;color:#5b7568}
#modal .mk19f-grade-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
#modal .mk19f-grade-row{display:flex;flex-direction:column;gap:6px;min-width:0;border:1px solid #dce8df;border-radius:13px;padding:11px 13px;background:#fff}
#modal .mk19f-grade-row .mk19f-grade-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
#modal .mk19f-grade-row .mk19f-grade-head strong{font-size:14px;color:#214c37}
#modal .mk19f-grade-row .mk19f-grade-head b{font-size:15px;color:#247a53;font-variant-numeric:tabular-nums}
#modal .mk19f-grade-row .mk19f-progress-track{margin:1px 0 1px;height:7px}
#modal .mk19f-grade-row .mk19f-row-detail{font-size:12px;color:#597568;line-height:1.42}
#modal .mk19f-grade-row .mk19f-row-modes{font-size:11px;color:#5d786a;line-height:1.38}
#modal .mk19f-grade-row button{border:1px solid #c4dfd0;border-radius:9px;background:#f0f8f3;min-height:38px;color:#216447;font:inherit;font-size:12px;font-weight:800;padding:7px 11px;cursor:pointer;margin-top:2px}
#modal .mk19f-grade-row button:hover{background:#e3f2e8}
#modal .mk19f-footnote{font-size:12px;color:#607b6b;line-height:1.55}
@media(max-width:680px){
 #mk19f-grade-strip{padding:10px 11px;margin:7px 0 13px;gap:9px;border-radius:13px}
 #mk19f-grade-strip .mk19f-open-all{width:100%;min-height:42px}
 #modal .mk19f-grade-grid{grid-template-columns:1fr;gap:7px}
 #modal .mk19f-xp-summary{padding:13px;border-radius:13px}
 #modal .mk19f-grade-row{padding:10px 12px}
 #modal .mk19f-modal{gap:12px}
}
@media(prefers-reduced-motion:reduce){.mk19f-home-open,.mk19f-open-all,#modal .mk19f-grade-row button{transition:none!important}}
</style>
"""
js=r"""
<script id="mk-ui19f-progress-script">
(function(){
 'use strict';
 const num=n=>Math.max(0,Math.floor(Number(n)||0));
 const fmt=n=>num(n).toLocaleString('ru-RU');
 const pct=(a,b)=>b?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
 function mk19fProgressMetrics(profile=state){
   const level=mk872GetLevelProgress(profile?.xp||0);
   const grades=Array.from({length:8},(_,i)=>{
     const grade=i+1,c=teacherCourseProgress(profile,grade),s=teacherStageBreakdown(profile,grade);
     const total=num(c.total),done=Math.min(total,num(c.done));
     return{grade,done,total,percent:pct(done,total),topics:num(c.availableTopics),
       catalogTopics:num(c.catalogTopics),warmup:num(s.warmup),training:num(s.training),master:num(s.master)};
   });
   const done=grades.reduce((n,g)=>n+g.done,0),total=grades.reduce((n,g)=>n+g.total,0);
   return{level,grades,done,total,percent:pct(done,total)};
 }
 function mk19fTrack(done,total,label){
   const p=pct(done,total);
   return '<span class="mk19f-progress-track" role="progressbar" aria-label="'+esc(label)+'" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+done+'"><span class="mk19f-progress-fill" style="width:'+p+'%"></span></span>';
 }
 function mk19fGradeBody(grade){
   const m=mk19fProgressMetrics(),g=m.grades[grade-1];
   const suffix=grade===7||grade===8?' · вместе по трём курсам':'';
   return '<div class="mk19f-grade-copy"><div class="mk19f-grade-title"><strong>Учебный прогресс</strong><span>'+fmt(g.done)+' из '+fmt(g.total)+' этапов · '+g.percent+'%</span></div>'
    +mk19fTrack(g.done,g.total,'Пройдено этапов в '+grade+' классе: '+g.done+' из '+g.total)
    +'<div class="mk19f-grade-note">Разминка: '+g.warmup+' · Тренировка: '+g.training+' · Мастерство: '+g.master+suffix+'</div></div>';
 }
 function mk19fRefreshGrade(){
   const el=document.getElementById('mk19f-grade-strip');
   if(!el)return;
   const grade=Number(el.dataset.grade);
   if(!(grade>=1&&grade<=8))return;
   const box=el.querySelector('.mk19f-grade-inner');
   if(box){
     const html=mk19fGradeBody(grade);
     if(box.innerHTML!==html)box.innerHTML=html;
   }
 }
 function mk19fGoGrade(grade){
   const g=Number(grade);if(g<1||g>8)return;
   closeModal();openGrade(g);
 }
 function mk19fOpenProgress(){
   const m=mk19fProgressMetrics(),l=m.level;
   const rows=m.grades.map(g=>
     '<article class="mk19f-grade-row"><div class="mk19f-grade-head"><strong>'+g.grade+' класс</strong><b>'+g.percent+'%</b></div>'
      +mk19fTrack(g.done,g.total,'Пройдено '+g.done+' из '+g.total+' этапов '+g.grade+' класса')
      +'<div class="mk19f-row-detail">Пройдено этапов: '+fmt(g.done)+' / '+fmt(g.total)+'</div>'
      +'<div class="mk19f-row-modes">Разминка '+g.warmup+' · Тренировка '+g.training+' · Мастерство '+g.master+'</div>'
      +'<button type="button" onclick="mk19fGoGrade('+g.grade+')">Открыть '+g.grade+' класс</button></article>'
   ).join('');
   const xpDone=num(l.xpIntoLevel),xpTotal=num(l.xpNeededForLevel);
   show('<div class="mtop"><h2>Мой учебный прогресс</h2><button type="button" class="x" onclick="closeModal()" aria-label="Закрыть">×</button></div>'
     +'<div id="mk19fProgress" class="mk19f-modal">'
       +'<section class="mk19f-xp-summary"><div class="mk19f-xp-top"><strong>Игровой уровень '+l.currentLevel+' → '+(l.currentLevel+1)+'</strong>'
         +'<span class="mk19f-xp-percent">'+pct(xpDone,xpTotal)+'%</span></div>'
         +mk19fTrack(xpDone,xpTotal,'До '+(l.currentLevel+1)+' уровня: '+xpDone+' из '+xpTotal+' XP')
         +'<div class="mk19f-xp-bottom">'+fmt(xpDone)+' / '+fmt(xpTotal)+' XP в этом уровне · осталось '+fmt(l.xpRemaining)+' XP</div>'
       +'</section>'
       +'<section class="mk19f-overall"><div><strong>Всего пройдено '+fmt(m.done)+' из '+fmt(m.total)+' учебных этапов</strong><div class="mk19f-small">По доступным темам всех восьми классов</div></div><strong>'+m.percent+'%</strong></section>'
       +'<div class="mk19f-grade-grid">'+rows+'</div>'
       +'<p class="mk19f-footnote">XP повышает игровой уровень. Прохождение учебных этапов — отдельный показатель: оно засчитывается по лучшему результату, согласно правилам каждого этапа. Эти показатели не заменяют оценку учителя.</p>'
     +'</div>');
 }
 function mk19fMount(){
   const main=document.getElementById('mainView');
   if(!main)return;
   const hero=main.querySelector(':scope > .grade-hero');
   if(hero){
     if(!main.querySelector('#mk19f-grade-strip')){
       const match=hero.querySelector('h1')?.textContent.match(/([1-8])\s+класса/i);
       const grade=match?Number(match[1]):null;
       if(grade){
         const section=document.createElement('section');
         section.id='mk19f-grade-strip';section.dataset.grade=String(grade);
         section.setAttribute('aria-label','Учебный прогресс этого класса');
         const content=document.createElement('div');content.className='mk19f-grade-inner';content.style.flex='1 1 290px';content.style.minWidth='0';
         content.innerHTML=mk19fGradeBody(grade);
         const action=document.createElement('button');action.type='button';action.className='mk19f-open-all';
         action.textContent='Весь прогресс';action.addEventListener('click',mk19fOpenProgress);
         section.append(content,action);hero.insertAdjacentElement('afterend',section);
       }
     }else mk19fRefreshGrade();
   }else{
     const intro=main.querySelector(':scope > .home-start');
     if(intro&&!intro.querySelector('.mk19f-home-open')){
       const button=document.createElement('button');button.type='button';button.className='mk19f-home-open';
       button.textContent='Мой прогресс';button.addEventListener('click',mk19fOpenProgress);intro.append(button);
     }
   }
 }
 function mk19fBindLevel(){
   const el=document.querySelector('.top .level-pill');
   if(!el||el.dataset.mk19fBound==='1')return;
   el.dataset.mk19fBound='1';el.classList.add('mk19f-level-open');
   el.setAttribute('role','button');el.setAttribute('tabindex','0');
   el.setAttribute('title','Открыть учебный прогресс');
   el.setAttribute('aria-label','Открыть учебный прогресс и уровни');
   el.addEventListener('click',mk19fOpenProgress);
   el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();mk19fOpenProgress()}});
 }
 window.mk19fProgressMetrics=mk19fProgressMetrics;
 window.mk19fOpenProgress=mk19fOpenProgress;
 window.mk19fGoGrade=mk19fGoGrade;
 const main=document.getElementById('mainView');
 if(main)new MutationObserver(mk19fMount).observe(main,{childList:true});
 const oldStats=stats;
 stats=function(){const result=oldStats.apply(this,arguments);mk19fMount();mk19fRefreshGrade();return result};
 mk19fBindLevel();mk19fMount();
})();
</script>
"""
html=html.replace('</body>',css+'\n'+js+'\n</body>',1)
newhash=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v65','matkvest-iphone-v66').replace(prior,newhash)
assert 'matkvest-iphone-v66' in sw and newhash in sw
source.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
meta={'stage':'19F','version':'v66','base_sha256':prior,'sha256':newhash,'cache':'matkvest-iphone-v66',
 'new':['compact current-grade progress strip','8-grade XP and course-stage overview','accessible level and home shortcuts','native grade navigation from overview'],
 'invariants':['same levelThreshold and mk872GetLevelProgress','teacherCourseProgress and teacherStageBreakdown for study counts','no XP or grading changes','no shop/economy changes','no backend or user-data migration']}
Path('audits/ui_stage19f_patch_report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False))
