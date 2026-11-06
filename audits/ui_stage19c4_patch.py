#!/usr/bin/env python3
"""UI19C/4: accessible long-grade topic search and narrow-mobile header compression."""
from pathlib import Path
import hashlib,json
idx=Path('index.html');worker=Path('sw.js')
html=idx.read_text('utf-8');sw=worker.read_text('utf-8')
prev='68e3cb74db937df23adbc4850ac3b025ad18480fb5cfed112dc0c85c418cb1ec'
if 'id="mk-ui19c4-navigation"' in html:
    assert 'matkvest-iphone-v62' in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print('UI19C/4 already installed');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==prev,"Refuse non-v61 HTML"
assert prev in sw and 'matkvest-iphone-v61' in sw
assert html.count('</body>')==1 and 'mk-ui19c3b-final-screens' in html
css=r"""
<style id="mk-ui19c4-navigation">
/* A compact, keyboard-usable lesson finder for grades with >=20 lessons. */
#mk19c4-topic-tools{
  margin:0 0 17px;padding:12px 14px;
  display:flex;flex-direction:column;gap:9px;
  border:1px solid #d1e4d9;border-radius:16px;
  background:#fff;box-shadow:0 3px 15px rgba(21,60,47,.045)
}
#mk19c4-topic-tools .mk19c4-search-row{
  display:flex;align-items:center;gap:9px;flex-wrap:wrap
}
#mk19c4-topic-tools .mk19c4-search-wrap{
  position:relative;min-width:150px;flex:1 1 270px
}
#mk19c4-topic-tools .mk19c4-search-input{
  font:inherit;letter-spacing:0;
  display:block;width:100%;box-sizing:border-box;
  height:44px;min-height:44px;
  background:#f8fbf9;border:1px solid #c6dcd0;border-radius:11px;
  padding:8px 12px;color:#183d31;
  outline:none;transition:border-color .15s ease,box-shadow .15s ease
}
#mk19c4-topic-tools .mk19c4-search-input:focus{
  border-color:#278363;box-shadow:0 0 0 3px rgba(39,131,99,.14);
  background:#fff
}
#mk19c4-topic-tools .mk19c4-clear{
  flex:0 0 auto;min-height:44px;padding:8px 13px;border-radius:11px;
  border:1px solid #c9dfd3;background:#edf6f0;color:#265846;
  cursor:pointer;font:inherit;font-weight:750
}
#mk19c4-topic-tools .mk19c4-clear:disabled{opacity:.48;cursor:default}
#mk19c4-topic-tools .mk19c4-clear:not(:disabled):hover{
  background:#dff0e6;border-color:#a8cdb9
}
#mk19c4-topic-tools .mk19c4-count{font-size:12px;color:#58776a;line-height:1.35}
#mk19c4-topic-tools .mk19c4-count strong{color:#21694d}
#mk19c4-topic-tools .mk19c4-course-links{
  display:flex;gap:7px;flex-wrap:wrap
}
#mk19c4-topic-tools .mk19c4-course-link{
  min-height:38px;border:1px solid #d4e5dd;border-radius:10px;
  background:#f7faf8;color:#225947;padding:6px 12px;
  font:inherit;font-size:13px;font-weight:750;cursor:pointer
}
#mk19c4-topic-tools .mk19c4-course-link:hover{
  background:#eaf5ee;border-color:#afcfbd
}
#mk19c4-topic-tools button:focus-visible{
  outline:3px solid rgba(23,107,84,.4);outline-offset:2px
}
#mk19c4-topic-tools .mk19c4-empty{
  display:none;padding:9px 11px;border-radius:10px;
  background:#f7faf8;color:#587369;font-size:13px
}
#mk19c4-topic-tools .mk19c4-empty[data-visible="true"]{display:block}
#mainView .mk19c4-filter-hidden{display:none!important}
@media(max-width:680px){
 #mk19c4-topic-tools{margin:0 0 14px;padding:10px;border-radius:14px}
 #mk19c4-topic-tools .mk19c4-search-row{gap:7px}
 #mk19c4-topic-tools .mk19c4-search-wrap{flex-basis:170px;min-width:0}
 #mk19c4-topic-tools .mk19c4-clear{padding:8px 11px}
 #mk19c4-topic-tools .mk19c4-course-links{
   flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-inline:contain;
   padding-bottom:3px
 }
 #mk19c4-topic-tools .mk19c4-course-link{white-space:nowrap;flex:0 0 auto}
}
/* At 320px the old flex wrapping created 3 lines: profile, then menu, then XP.
 * Two deliberate rows preserve all controls without overlap or horizontal overflow. */
@media(max-width:359px){
 .top{align-items:flex-start!important}
 .top>.stats{
   display:flex!important;flex-wrap:wrap!important;
   align-content:flex-start;align-items:center;
   justify-content:space-between!important;gap:5px 6px!important;
 }
 .top>.stats>.profile-pill{
   order:1!important;flex:0 0 124px!important;
   width:124px!important;max-width:124px!important
 }
 .top>.stats>.pill:not(.grade-back):not(.profile-pill):not(.level-pill){
   order:2!important;flex:0 0 56px!important;
   width:56px!important;max-width:56px!important
 }
 .top>.stats>#mk872TopLevelProgress{
   order:3!important;flex:1 1 calc(100% - 94px)!important;
   width:auto!important;min-width:0!important;max-width:none!important;
   margin:0!important
 }
 .top>.stats>.mk-ui19-nav-toggle{
   order:4!important;flex:0 0 88px!important;width:88px!important;
   min-width:88px!important;min-height:44px
 }
 .top>.stats>.mk-ui19-nav-wrap{order:5}
}
@media(prefers-reduced-motion:reduce){
 #mk19c4-topic-tools .mk19c4-search-input{transition:none!important}
}
</style>
"""
script=r"""
<script id="mk-ui19c4-navigation-script">
/* Re-renders are owned by the app: enhance only new grade DOM, never recreate topics. */
(function(){
 'use strict';
 const root=document.getElementById('mainView');
 if(!root)return;
 const norm=s=>String(s||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const classHidden='mk19c4-filter-hidden';
 function mount(){
   if(root.querySelector('#mk19c4-topic-tools'))return;
   const hero=root.querySelector(':scope > .grade-hero');
   if(!hero)return;
   const topics=[...root.querySelectorAll('.topic')];
   if(topics.length<20)return;
   const controls=document.createElement('section');
   controls.id='mk19c4-topic-tools';
   controls.setAttribute('aria-label','Поиск учебных тем');
   controls.innerHTML='<div class="mk19c4-search-row"><div class="mk19c4-search-wrap"><input class="mk19c4-search-input" type="search" autocomplete="off" spellcheck="false" aria-label="Найти учебную тему" placeholder="Найти тему по названию…"></div><button class="mk19c4-clear" type="button" disabled>Очистить</button></div><div class="mk19c4-course-links"></div><div class="mk19c4-count" role="status" aria-live="polite"></div><div class="mk19c4-empty" data-visible="false">Темы не найдены. Измени запрос или очисти поиск.</div>';
   hero.insertAdjacentElement('afterend',controls);
   const input=controls.querySelector('input');
   const clear=controls.querySelector('.mk19c4-clear');
   const count=controls.querySelector('.mk19c4-count');
   const empty=controls.querySelector('.mk19c4-empty');
   const links=controls.querySelector('.mk19c4-course-links');
   const courses=[...root.querySelectorAll(':scope > .g7-course')];
   const groups=[...root.querySelectorAll('.g6-group,.g7-course')];
   const names=topics.map(t=>{
     const group=t.closest('.g6-group');
     const course=t.closest('.g7-course');
     const parts=[
       t.querySelector('strong')?.textContent||'',
       t.querySelector('small')?.textContent||'',
       group?.querySelector(':scope > .grade-head h2')?.textContent||'',
       course?.querySelector(':scope > .grade-head h2')?.textContent||''
     ];
     return norm(parts.join(' '));
   });
   for(const course of courses){
     const label=course.querySelector(':scope > .grade-head h2')?.textContent?.trim();
     if(!label)continue;
     const button=document.createElement('button');
     button.type='button';button.className='mk19c4-course-link';button.textContent=label;
     button.addEventListener('click',()=>{
       if(input.value){input.value='';filter()}
       course.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
     });
     links.append(button);
   }
   if(!links.children.length)links.remove();
   function filter(){
     const query=norm(input.value);
     let shown=0;
     const words=query.split(' ').filter(Boolean);
     for(let i=0;i<topics.length;i++){
       const hit=!words.length||words.every(w=>names[i].includes(w));
       topics[i].classList.toggle(classHidden,!hit);
       if(hit)shown++;
     }
     for(const section of groups){
       section.classList.toggle(classHidden,shown>0&&!!query?!topics.some(t=>!t.classList.contains(classHidden)&&section.contains(t)):!!query);
     }
     // Empty results should hide all section scaffolding, not leave page-long blank headings.
     if(!shown&&query)for(const section of groups)section.classList.add(classHidden);
     clear.disabled=!query;empty.dataset.visible=String(!!query&&!shown);
     count.textContent=query?'Найдено тем: '+shown+' из '+topics.length:'Всего тем: '+topics.length;
   }
   input.addEventListener('input',filter);
   clear.addEventListener('click',()=>{input.value='';filter();input.focus()});
   filter();
 }
 const observer=new MutationObserver(()=>mount());
 observer.observe(root,{childList:true});
 mount();
})();
</script>
"""
html=html.replace('</body>',css+'\n'+script+'\n</body>',1)
sha=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v61','matkvest-iphone-v62').replace(prev,sha)
assert 'matkvest-iphone-v62' in sw and sha in sw
idx.write_text(html,'utf-8');worker.write_text(sw,'utf-8')
meta={'phase':'19C/4','version':'v62','base_sha256':prev,'sha256':sha,'cache':'matkvest-iphone-v62','scope':['topic search for grades with 20+ topic cards','course navigation links on 7/8','hide nonmatching empty groups','320px two-row header'],'excluded':['questions','generators','answers','XP','coins','shop','backend']}
Path('audits/ui_stage19c4_patch_report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False))
