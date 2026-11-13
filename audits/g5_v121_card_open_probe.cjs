'use strict';
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1000,height:850}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});const x=await p.evaluate(()=>{
 renderGrade5();
 const nav=document.querySelector('#mk-g5-textbook-nav'),card=[...document.querySelectorAll('.g5-card')].find(c=>c.textContent.includes('Деление с остатком'));
 const before={qid:typeof qid==='undefined'?null:qid,blockSession:typeof blockSession==='undefined'?null:blockSession&&blockSession.kind,head:mainView.textContent.slice(0,200),viewCards:mainView.querySelectorAll('.g5-card').length};
 const cardInfo={html:card?.outerHTML.slice(0,3000),tag:card?.tagName,onclick:typeof card?.onclick,props:card?Object.keys(card).slice(0,40):[],child:card?[...card.querySelectorAll('button,a')].slice(0,4).map(x=>({tag:x.tagName,html:x.outerHTML.slice(0,500)})):[]};
 card?.click();
 const after={qid:typeof qid==='undefined'?null:qid,blockSession:typeof blockSession==='undefined'?null:blockSession&&blockSession.kind,head:mainView.textContent.slice(0,280),viewCards:mainView.querySelectorAll('.g5-card').length,quizCandidates:mainView.querySelectorAll('.quiz-card,.question-box,[class*="question"],[class*="training"]').length,location:location.hash};
 return {before,cardInfo,after,errors};
});console.log('G5_CARD_DIRECT_NAV_PROBE '+JSON.stringify(x));}finally{await b.close()}})().catch(e=>{console.error(e.stack||e);process.exit(1)});
