#!/usr/bin/env python3
"""UI19I v69: accessible, keyboard-contained native #modal, from exact verified v68."""
from pathlib import Path
import hashlib,json
index=Path('index.html');worker=Path('sw.js')
html=index.read_text(encoding='utf-8');sw=worker.read_text(encoding='utf-8')
BASE='27020e041b8613f34aac5651db02d7d0b330f0b9c61b13d79918ced22ffa8f31'
if 'id="mk-ui19i-dialog-a11y"' in html:
    h=hashlib.sha256(html.encode()).hexdigest()
    assert 'matkvest-iphone-v69' in sw and h in sw
    print('UI19I v69 already applied')
    raise SystemExit(0)
assert hashlib.sha256(html.encode('utf-8')).hexdigest()==BASE,'Only verified v68 is accepted'
assert 'matkvest-iphone-v68' in sw and BASE in sw
assert 'id="mk-ui19h-training-script"' in html
assert html.count('</body>')==1
script=r"""
<style id="mk-ui19i-dialog-focus-style">
#modal .mtop h2:focus{outline:3px solid #539b79;outline-offset:3px;border-radius:4px}
#modal .mtop .x:focus-visible{outline:3px solid #428d69;outline-offset:3px}
@media(prefers-reduced-motion:reduce){#modal .mtop .x{transition:none!important}}
</style>
<script id="mk-ui19i-dialog-a11y">
/* Add semantics and keyboard containment to the app's existing #modal.
   The pre-existing closeModal(), training guard, grading, commerce and state remain authoritative. */
(function(){
  'use strict';
  const modal=document.getElementById('modal');
  if(!modal)return;
  let wasOpen=false,opener=null,scheduled=false;
  function visible(node){return !!node&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden'}
  function nestedDialog(){
    return [...document.querySelectorAll('.mk872-training-dialog,.mk872-help-dialog')]
      .some(visible);
  }
  function heading(){return modal.querySelector('.mtop h2')}
  function tabbables(){
    return [...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(e=>visible(e)&&e.tabIndex>=0&&!e.closest('[inert],[aria-hidden="true"]'));
  }
  function setIfDifferent(node,name,value){
    if(node.getAttribute(name)!==value)node.setAttribute(name,value);
  }
  function synchronize(){
    const open=visible(modal),nested=nestedDialog();
    if(open){
      const title=heading();
      setIfDifferent(modal,'role','dialog');
      setIfDifferent(modal,'aria-modal','true');
      setIfDifferent(modal,'tabindex','-1');
      if(title){
        setIfDifferent(title,'id','mk19i-active-dialog-heading');
        setIfDifferent(title,'tabindex','-1');
        setIfDifferent(modal,'aria-labelledby',title.id);
      }else{
        modal.removeAttribute('aria-labelledby');
        setIfDifferent(modal,'aria-label','Окно МатКвеста');
      }
      const close=modal.querySelector('.mtop button.x');
      if(close){
        setIfDifferent(close,'aria-label','Закрыть окно');
        if(!close.hasAttribute('type'))close.type='button';
      }
      if(!wasOpen){
        opener=document.activeElement;
        wasOpen=true;
        if(!nested)(title||modal).focus({preventScroll:true});
      }else if(!nested&&(document.activeElement===document.body||document.activeElement===document.documentElement)){
        (title||modal).focus({preventScroll:true});
      }
    }else if(wasOpen){
      wasOpen=false;
      modal.removeAttribute('aria-modal');
      if(!nested){
        const target=opener?.isConnected?opener:document.querySelector('.mk872-brand-home');
        if(target?.focus)target.focus({preventScroll:true});
      }
      opener=null;
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;synchronize()});
  }
  const observer=new MutationObserver(schedule);
  observer.observe(modal.parentElement||document.body,{attributes:true,childList:true,subtree:true});
  document.addEventListener('focusin',event=>{
    if(!wasOpen||!visible(modal)||nestedDialog()||modal.contains(event.target))return;
    (heading()||modal).focus({preventScroll:true});
  },true);
  document.addEventListener('keydown',event=>{
    if(!visible(modal)||nestedDialog())return;
    if(event.key==='Escape'){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof closeModal==='function')closeModal();
      schedule();
      return;
    }
    if(event.key!=='Tab')return;
    const items=tabbables(),first=items[0],last=items[items.length-1],active=document.activeElement;
    if(!first){event.preventDefault();modal.focus({preventScroll:true});return}
    const atHeading=active===heading()||active===modal;
    if(event.shiftKey&&(atHeading||active===first||!modal.contains(active))){
      event.preventDefault();last.focus();return;
    }
    if(!event.shiftKey&&(atHeading||active===last||!modal.contains(active))){
      event.preventDefault();first.focus();
    }
  },true);
  synchronize();
})();
</script>
"""
html=html.replace('</body>',script+'\n</body>',1)
newhash=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw=sw.replace('matkvest-iphone-v68','matkvest-iphone-v69').replace(BASE,newhash)
assert newhash in sw and 'matkvest-iphone-v69' in sw
index.write_text(html,encoding='utf-8');worker.write_text(sw,encoding='utf-8')
report={'stage':'19I','phase':'dialog-accessibility','candidate':'v69',
        'base_sha256':BASE,'sha256':newhash,'cache':'matkvest-iphone-v69',
        'scope':['modal accessible name and dialog semantics','focus entry and return',
                 'Tab/Shift+Tab containment','Escape via original closeModal','close button accessible name'],
        'unchanged':['training rules','generators','rewards','coins','inventory','profiles','backend','production']}
Path('audits/ui_stage19i_patch_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
