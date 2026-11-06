'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('id="mk-mobile-column-division-v72"'), 'mobile patch must be applied');
const style=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const vw of [320,360,375,390,412,520,768,1280]){
   for(const [digits,quot] of [[5,4],[6,5],[8,7]]){
    const slots=digits+quot+1;
    const cells=Array.from({length:digits},(_,i)=>'<div class="div-fixed">'+((i+1)%10)+'</div>').join('');
    const inputs=Array.from({length:digits},(_,i)=>'<input class="div-work-in" aria-label="Цифра '+i+'" inputmode="numeric" maxlength="1">').join('');
    const qs=Array.from({length:quot},(_,i)=>'<input class="qin" aria-label="Частное '+i+'" inputmode="numeric" maxlength="1">').join('');
    const markup='<div class="column-modal"><div class="card"><div class="div-layout" style="--mk-cols:'+digits+';--mk-qcols:'+quot+';--mk-slots:'+slots+'"><div class="div-rows"><div class="drow div-top-row" style="--dcols:'+digits+'"><div class="div-op"></div>'+cells+'</div><div class="drow div-input-row" style="--dcols:'+digits+'"><div class="div-op">−</div>'+inputs+'</div></div><div class="div-side"><div class="divisor-box">3</div><div class="quotient-inputs">'+qs+'</div></div></div></div></div>';
    const page=await browser.newPage({viewport:{width:vw,height:800},deviceScaleFactor:1});
    await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style>'+markup);
    const values=await page.evaluate(()=>{
      const card=document.querySelector('.card').getBoundingClientRect(),layout=document.querySelector('.div-layout').getBoundingClientRect();
      const nodes=[...document.querySelectorAll('.div-layout input,.div-layout .div-fixed,.div-layout .divisor-box')];
      const r=nodes.map(n=>n.getBoundingClientRect());
      return {cardLeft:card.left,cardRight:card.right,layoutLeft:layout.left,layoutRight:layout.right,
       minLeft:Math.min(...r.map(x=>x.left)),maxRight:Math.max(...r.map(x=>x.right)),
       cell:document.querySelector('.div-work-in').getBoundingClientRect().width,
       screen:window.innerWidth};
    });
    assert(values.minLeft>=values.cardLeft-2,JSON.stringify({vw,digits,quot,problem:'left clip',values}));
    assert(values.maxRight<=values.cardRight+2,JSON.stringify({vw,digits,quot,problem:'right clip',values}));
    assert(values.maxRight<=vw+1,JSON.stringify({vw,digits,quot,problem:'viewport clip',values}));
    assert(values.cell>=11,JSON.stringify({vw,digits,quot,problem:'cell too small',values}));
    await page.locator('.qin').first().fill('4');
    assert.equal(await page.locator('.qin').first().inputValue(),'4');
    await page.close();
   }
  }
 }finally{await browser.close()}
 console.log('PASS: 24 viewport/digit/quotient responsive cases; all inputs visible, usable');
}
main().catch(err=>{console.error(err);process.exitCode=1});
