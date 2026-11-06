import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const p=await browser.newPage();p.on('pageerror',e=>console.log('PAGEERR',String(e)));await p.setViewport({width:390,height:900,isMobile:true,hasTouch:true});
await p.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded'});
const get=async label=>{
const a=await p.evaluate(()=>{
 const main=document.querySelector('#mainView'),hero=main?.querySelector(':scope > .grade-hero'),h=hero?.querySelector('h1');
 return {grade:h?.textContent,regex:h?.textContent.match(/\b([1-8])\s+класса\b/i)?.[1],
 childTags:[...main.children].slice(0,7).map(e=>e.tagName+'.'+e.className),
 count:main?.querySelectorAll('#mk19f-grade-strip').length,
 strip:main?.querySelector('#mk19f-grade-strip')?.outerHTML.slice(0,1200),
 script:document.querySelector('#mk-ui19f-progress-script')?.textContent.slice(-500),
 global:typeof window.mk19fOpenProgress,
 countHome:main?.querySelectorAll('.home-start').length
 };
});
console.log(label,JSON.stringify(a).slice(0,2500));return a;
};
await get('HOME');
await p.evaluate(()=>openGrade(7));await get('IMMEDIATE');
await new Promise(r=>setTimeout(r,300));await get('AFTER300');
await p.evaluate(()=>openGrade(8));await new Promise(r=>setTimeout(r,300));await get('AFTER8');
await browser.close();
