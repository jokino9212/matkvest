import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const expressions=[/\bshopStats\b/,/\bchestStats\b/,/\bchestHistory\b/,/\bcoinHistory\b/,/\bcoinLedger\b/,/\b(?:totalEarned|earnedCoins|spentCoins|wealth|riches|netWorth|economyStats)\b/i,/\bstate\.coins\b/,/function (?:award|stats|shopPreview|openShop|openCollection|mk861OpenChestTransaction|mk861Chest|mk872LevelProgressHtml|mk865SellItem)\b/,/return \`.*(?:coins|🪙)/];
const collected=[];let counts={};for(const [j,rx] of expressions.entries()){const hits=[];for(let i=0;i<lines.length;i++){const line=lines[i];if(line.length>12000)continue;if(rx.test(line))hits.push(i)}counts[j]=hits.length;let chosen=hits;if(j===4)chosen=[...hits.slice(0,28),...hits.slice(-65)];for(const i of chosen.slice(0,125))collected.push(i)}
const focus=[...new Set(collected)].sort((a,b)=>a-b);
const excerpts=focus.map(i=>({line:i+1,code:lines.slice(Math.max(0,i-2),Math.min(lines.length,i+3)).map((x,j)=>String(Math.max(0,i-2)+j+1)+': '+x.slice(0,850)).join('\n')}));
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});const pg=await browser.newPage();
await pg.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
const live=await pg.evaluate(()=>{
 const get=s=>{try{return eval(s)}catch(e){return {error:e.message}}};
 const stateObj=get('state'),profiles=get('profiles');
 const stat=(x)=>{if(!x)return null;return Object.fromEntries(Object.entries(x).filter(([k])=>/coin|chest|shop|reward|purchase|sale|inventory|wallet|wealth|achievement|stat|acquisition|owned/i.test(k)).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v).slice(0,1400):v]))};
 const ms=['award','stats','shopTabs','openShop','openCollection','mk861OpenChestTransaction','mk865SellItem','mk872CollectionOwned','mk865Acquisition','mk873ArchiveRows'];
 const fn=Object.fromEntries(ms.map(name=>{const x=get(name);return[name,typeof x==='function'?String(x).slice(0,4000):typeof x]}));
 return {keys:Object.keys(stateObj||{}),state:stat(stateObj),profileCount:Object.keys(profiles||{}).length,profileStats:stat(Object.values(profiles||{})[0]),functions:fn,
  pill:document.querySelector('.shop-pill')?.outerHTML.slice(0,850),statsHtml:document.querySelector('.stats')?.outerHTML.slice(0,2000)};
});
await browser.close();
const out={counts,excerpts,live};
fs.writeFileSync('audits/ui_stage19e_finance_baseline.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({counts,excerpts:excerpts.filter(x=>/shopStats|chestStats|totalEarned|coinHistory|function award|function stats|state\.coins/.test(x.code)).slice(0,55),live},null,2).slice(0,32000));
