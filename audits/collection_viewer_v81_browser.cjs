'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:800}});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   for(const kind of ['Питомцы','Аватары']){
    await page.evaluate(kind=>{
     const old=document.getElementById('v81-artwork-fixture');
     old?.remove();
     const section=document.createElement('div');
     section.id='v81-artwork-fixture';section.className='mk872-col-section';
     const label=kind==='Питомцы'?'Проверочный питомец':'Проверочный аватар';
     section.innerHTML='<h3>'+kind+'</h3><div class="mk872-col-card"><strong>'+label+'</strong><div class="mk872-col-art"><div class="shop-icon"><img alt="'+label+'" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'46\' fill=\'%23679cf0\'/%3E%3C/svg%3E"></div></div></div>';
     document.body.append(section);
     section.querySelector('.shop-icon img').click();
    },kind);
    const metrics=await page.evaluate(()=>{
     const viewer=document.querySelector('#mk872AvatarViewer');
     const visual=viewer?.querySelector('.mk30-visual');
     const art=visual?.querySelector('.mk872-col-art');
     const img=visual?.querySelector('img');
     const box=art?.getBoundingClientRect();
     const vb=visual?.getBoundingClientRect();
     const ib=img?.getBoundingClientRect();
     return {open:viewer?.classList.contains('mk872-open'),visual:visual?.className,
      title:viewer?.querySelector('#mk872ViewerTitle')?.textContent,
      artW:box?.width,artH:box?.height,viewerW:vb?.width,imgW:ib?.width,
      imgH:ib?.height,src:img?.getAttribute('src'),images:visual?.querySelectorAll('img').length};
    });
    assert(metrics.open,'Zoom not opened '+kind+' '+width+' '+JSON.stringify(metrics));
    assert(metrics.visual.includes(kind==='Питомцы'?'mk30-pet':'mk30-avatar'),
      'Wrong artwork type '+kind+' '+JSON.stringify(metrics));
    assert(metrics.artW>=150&&metrics.artH>=150,'Thumbnail remained tiny '+JSON.stringify(metrics));
    assert(metrics.artW/metrics.viewerW>.85,'Artwork underfills modal '+JSON.stringify(metrics));
    assert(metrics.imgW/metrics.viewerW>.70,'Image underfills modal '+JSON.stringify(metrics));
    assert.equal(metrics.images,1,'Duplicate rendered image '+JSON.stringify(metrics));
    assert(metrics.src.startsWith('data:image/svg+xml'),'Artwork src was replaced '+JSON.stringify(metrics));
    assert.equal(metrics.title,kind==='Питомцы'?'Проверочный питомец':'Проверочный аватар');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#mk872AvatarViewer').evaluate(el=>el.classList.contains('mk872-open'))),'Escape failed');
    console.log('VIEWER_PASS',width,kind,metrics.artW,metrics.imgW);
   }
   assert.deepEqual(errors,[],'JS errors '+errors.slice(0,3));
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
