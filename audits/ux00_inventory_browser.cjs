'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const OUT=path.resolve('audits/ux00_output');
fs.mkdirSync(OUT,{recursive:true});
function esc(s){return String(s??'').replace(/[\r\n\t]+/g,' ').replace(/"/g,'""')}
function dataFmt(s){const v=String(s||'');if(/<svg\b/i.test(v)||/^data:image\/svg\+xml/i.test(v))return 'inline-svg';if(/\.webp|image\/webp/i.test(v))return 'webp';if(/\.png|image\/png/i.test(v))return 'png';if(/<img\b/i.test(v))return 'img-tag';if(/<|>/i.test(v))return 'html/other';if(/\p{Extended_Pictographic}/u.test(v))return 'emoji-or-text';return v?'text-or-code':'empty'}
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];const pages=[];
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const catalog=await page.evaluate(()=>{
   const safe=(value)=>{if(value===undefined||value===null)return null;return String(value)};
   const result={};
   for(const [category,items] of Object.entries(SHOP_CATALOG)){
    if(!Array.isArray(items))continue;
    result[category]=items.map(x=>({
      id:safe(x.id),name:safe(x.name),rarity:safe(x.rarity),price:Number.isFinite(Number(x.price))?Number(x.price):null,
      icon:safe(x.icon),image:safe(x.image||x.imageUrl||x.img||x.src),raster:Boolean(x.mk868Raster),
      keys:Object.keys(x).sort()
    }));
   }
   return result;
  });
  const rows=[];
  for(const [category,items] of Object.entries(catalog)){
   for(const x of items){
    const source=x.image||x.icon||'';
    rows.push({...x,category,format:dataFmt(source),source_length:source.length,source_sha256:crypto.createHash('sha256').update(source).digest('hex').slice(0,16)});
   }
  }
  const ids=new Map();const issues=[];
  for(const r of rows){
   const k=r.category+':'+r.id;
   if(ids.has(k))issues.push({type:'duplicate-id',key:k});ids.set(k,true);
   if(!r.id)issues.push({type:'empty-id',category:r.category});
   if(!r.name)issues.push({type:'missing-name',id:r.id,category:r.category});
   if(r.price===null||r.price<0)issues.push({type:'invalid-price',id:r.id,category:r.category,price:r.price});
   if(!r.icon&&!r.image)issues.push({type:'missing-media',id:r.id,category:r.category});
  }
  fs.writeFileSync(path.join(OUT,'catalog.json'),JSON.stringify({base:process.env.GITHUB_SHA||'local',categories:Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.length])),items:rows,issues},null,2));
  fs.writeFileSync(path.join(OUT,'asset_register.csv'),'category,id,name,rarity,price,format,source_length,source_sha256\n'+rows.map(x=>[x.category,x.id,x.name,x.rarity,x.price,x.format,x.source_length,x.source_sha256].map(v=>'"'+esc(v)+'"').join(',')).join('\n')+'\n');
  const states=[
   ['home','renderHome()'],['shop_avatars',"openShop('avatars','all')"],
   ['shop_pets',"openShop('pets')"],['shop_badges',"openShop('badges')"],
   ['shop_stickers',"openShop('stickers')"],['collection','openCollection()'],
   ['leaderboard','openLeaderboard()'],['grade6','openGrade(6)'],
   ['grade8','openGrade(8)']
  ];
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:width<=390?700:800});
   for(const [name,expr] of states){
    try{
     await page.evaluate(expr=>{return (0,eval)(expr)},expr);
     await page.waitForTimeout(90);
     const info=await page.evaluate(()=>{
      const root=document.documentElement;const m=document.getElementById('modal');
      const open=document.getElementById('overlay')?.classList.contains('show');
      const el=open?m:document.getElementById('mainView');
      return {bodyWidth:root.scrollWidth,viewportWidth:root.clientWidth,
        visibleImages:[...el.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width>0).length,
        brokenImages:[...el.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width>0&&i.complete&&i.naturalWidth===0).length,
        activeModal:!!open,
        text:(el?.innerText||'').slice(0,80)};
     });
     pages.push({width,name,ok:true,...info});
     await page.screenshot({path:path.join(OUT, 'screen_'+width+'_'+name+'.png'),fullPage:false,animations:'disabled'});
    }catch(err){pages.push({width,name,ok:false,error:String(err).slice(0,300)});}
   }
  }
  const summary={date:'2026-11-08',repo:'jokino9212/matkvest',base:process.env.GITHUB_SHA||'local',counts:Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.length])),formatCounts:{},rarityCounts:{},issues,screens:pages,jsErrors:errors.slice(0,30)};
  for(const r of rows){summary.formatCounts[r.format]=(summary.formatCounts[r.format]||0)+1;const k=r.category+':'+(r.rarity||'unspecified');summary.rarityCounts[k]=(summary.rarityCounts[k]||0)+1}
  fs.writeFileSync(path.join(OUT,'inventory_summary.json'),JSON.stringify(summary,null,2));
  const lines=[
   '# UX-00 — автоматическая инвентаризация каталога и экранов',
   '',
   '**Внимание:** скриншоты собраны автоматически, художественная приёмка человеком ещё не проведена.',
   '',
   '## Категории и количество',
   ...Object.entries(summary.counts).map(([k,v])=>'- '+k+': **'+v+'**'),
   '',
   '## Форматы содержимого в каталоге (эвристика)',
   ...Object.entries(summary.formatCounts).map(([k,v])=>'- '+k+': '+v),
   '',
   '## Проверки',
   '- Предметов: '+rows.length,
   '- Ошибок данных: '+issues.length,
   '- Открыто экранных состояний: '+pages.filter(p=>p.ok).length+' / '+pages.length,
   '- Ошибок JS: '+errors.length,
   '- Скриншоты: GitHub Actions artifact ux00-visual-baseline',
   '',
   '## Найденные ошибки',
   ...issues.slice(0,30).map(x=>'- '+JSON.stringify(x)),
   ...pages.filter(x=>!x.ok||x.brokenImages>0||x.bodyWidth>x.viewportWidth+2).slice(0,30).map(x=>'- '+JSON.stringify(x)),
   '',
   '## Ограничения',
   '- Определение SVG/WebP/emoji из строки — предварительное; сложные HTML/CSS и SVG data URI требуют последующего ручного аудита.',
   '- Включены карточки каталога, но не проведён pixel/alpha bounding box аудит каждого предмета.',
   '- Снимки экранов требуют визуального просмотра и сравнения с Art Bible, которой пока нет.',
   '- Нельзя считать UX-00 завершённым лишь по этому автоматическому отчёту.'
  ];
  fs.writeFileSync(path.join(OUT,'UX_UI_INVENTORY_AUTOMATED.md'),lines.join('\n')+'\n');
  console.log('UX00_COUNTS',JSON.stringify(summary.counts));
  console.log('UX00_FORMATS',JSON.stringify(summary.formatCounts));
  console.log('UX00_SCREEN_SUMMARY',JSON.stringify({pass:pages.filter(p=>p.ok).length,total:pages.length,broken:pages.filter(p=>p.brokenImages).length,jsErrors:errors.length,issues:issues.length}));
  await ctx.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
