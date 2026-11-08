'use strict';const {chromium}=require('playwright'),path=require('node:path');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});try{for(const width of [320,390]){
const p=await b.newPage({viewport:{width,height:800},isMobile:true,hasTouch:true});
await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
const report=await p.evaluate(()=>{
const items=SHOP_CATALOG.stickers;const p=ensureProfileIdentity({...EMPTY_STATE,coins:10000,xp:30000,inventory:{...(EMPTY_STATE.inventory||{}),stickers:items.map(x=>x.id)},equipped:{...(EMPTY_STATE.equipped||{}),stickers:['st_star2','st_royal','st_infinity']}});
profiles={'Тест стикеров':p};currentProfile='Тест стикеров';state=p;openLeaderboard();
const table=document.querySelector('.leader-table');
const row=table?.querySelector('tbody tr')||table?.querySelector('tr:last-child');
const cell=row?.querySelector('td:nth-child(2)')||row?.querySelector('td');
const b=x=>{if(!x)return null;const r=x.getBoundingClientRect(),c=getComputedStyle(x);return {tag:x.tagName,cls:String(x.className),text:x.textContent.trim().slice(0,65),x:r.x,y:r.y,w:r.width,h:r.height,display:c.display,position:c.position,whiteSpace:c.whiteSpace,minWidth:c.minWidth,overflow:c.overflow}};
return {table:table?.outerHTML.slice(0,2200),row:row?.outerHTML.slice(0,3600),td:cell?.outerHTML.slice(0,2400),elements:cell?[b(cell),...Array.from(cell.querySelectorAll('*')).filter(x=>x.children.length===0 || x.className).slice(0,24).map(b)]:[],modal:b(document.querySelector('#modal')),bodyWidth:document.documentElement.clientWidth}
});console.log('LEADER_DOM',width,JSON.stringify(report));await p.close();}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
