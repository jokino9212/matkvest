'use strict';
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {existsSync,readFileSync}=require('node:fs');
const {extname}=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const digest=body=>createHash('sha256').update(body).digest('hex');
const worker=readFileSync('sw.js','utf8');
const html=readFileSync('index.html','utf8');
const hashes=JSON.parse(worker.match(/const SCRIPT_HASHES = (\{[^\n]+\});/)[1]);
const latest=Number(worker.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/)[1]);
const first=latest-1;
const marker='g5-decimals-v116.js';

function release(version){
 const script=new Map(Object.keys(hashes).map(name=>[name,readFileSync(name,'utf8')]));
 script.set(marker,script.get(marker)+'\nwindow.testBuild='+version+';\n');
 const all=Object.fromEntries([...script].map(([name,body])=>[name,digest(body)]));
 const document=html.replace(/\?v=\d+(?="><\/script>)/g,'?v='+version)
  .replace(/(const knowledgeMapUrl = "\.\/assets\/ui\/knowledge-map\.js\?v=)\d+/,'$1'+version);
 const sw=worker.replace(/const CACHE_NAME = "[^"]+"/,'const CACHE_NAME = "matkvest-iphone-v'+version+'"')
  .replace(/const APP_BUILD_HASH = "[^"]+"/,'const APP_BUILD_HASH = "'+digest(document)+'"')
  .replace(/const SCRIPT_HASHES = \{[^\n]*\};/,'const SCRIPT_HASHES = '+JSON.stringify(all)+';');
 return {document,sw,script};
}

const old=release(first),fresh=release(latest);
let active=old,stale='none',retries=new Set();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=url.pathname.slice('/matkvest/'.length);
 const isHTML=!file||file==='index.html';
 const versioned=url.searchParams.has('mk-build');
 if(versioned)retries.add(file);
 const responseRelease=stale==='all'||stale==='unversioned'&&!versioned?old:active;
 let body,type;
 if(file==='sw.js'){body=active.sw;type='application/javascript';}
 else if(isHTML){body=responseRelease.document;type='text/html; charset=utf-8';}
 else if(responseRelease.script.has(file)){body=responseRelease.script.get(file);type='application/javascript; charset=utf-8';}
 else if(file==='manifest.webmanifest'){body=readFileSync(file);type='application/manifest+json';}
 else if(/^assets\/[\w/-]+\.(?:webp|png|svg)$/.test(file)&&existsSync(file)){
  body=readFileSync(file);
  type=extname(file)==='.svg'?'image/svg+xml':'image/'+extname(file).slice(1);
 }
 else{res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
 res.end(body);
});

async function check(page,version,{enterGrade=false}={}){
 await page.waitForFunction(v=>window.testBuild===v&&
  document.querySelector('#appVersionBadge')?.textContent==='Сборка v'+v,version);
 if(enterGrade)await page.locator('.grade-card').getByRole('button',{name:'Открыть 5 класс',exact:true}).click();
 await page.locator('#mainView .g5-card').first().waitFor();
 await page.locator('#mk-g5-textbook-nav .mk-g5-toc-list li').first().waitFor({state:'attached'});
 const result=await page.evaluate(()=>{
  return {grade:currentGrade,topics:g5AllTopics().length,
   cards:document.querySelectorAll('#mainView .g5-card').length,
   paragraphs:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-list li').length,
   builds:[...document.querySelectorAll('script[src^="g5-"]')].map(s=>new URL(s.src).searchParams.get('v')),
   saved:localStorage.getItem('verifiedRefreshProbe')};
 });
 assert.equal(result.grade,5);assert.equal(result.topics,74);
 assert.equal(result.cards,74,'Reloaded Grade 5 must render the full catalog');
 assert.equal(result.paragraphs,51,'Reloaded Grade 5 must render the textbook navigation');
 assert.deepEqual(result.builds,Array(19).fill(String(version)));
 return result.saved;
}
async function idle(page){
 await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active&&!r.installing&&!r.waiting;});
}
async function checkHome(page,expected){
 const card=page.locator('#mainView .grade-card').filter({
  has:page.getByRole('button',{name:'Открыть 5 класс',exact:true})
 });
 assert.equal(await card.locator('.grade-summary').textContent(),expected);
}
async function checkAppHeader(page){
 const header=page.locator('#appHeader[data-v-app]').getByRole('banner');
 const brand=header.getByRole('button',{name:'МатКвест — на главную',exact:true});
 const profile=header.locator('.profile-pill');
 const toggle=header.locator('.mk-ui19-nav-toggle');
 const nav=header.locator('#mk-ui19-navigation');
 const home=page.locator('#homeDashboard[data-v-app]');
 const course=page.locator('#grade5Vue[data-v-app]');
 const dialog=page.locator('#overlay.show #modal');
 const close=dialog.getByRole('button',{name:'Закрыть окно',exact:true});
 await brand.waitFor();
 await brand.press('Enter');
 await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
 await home.getByRole('button',{name:'Открыть 5 класс',exact:true}).click();
 await course.getByRole('heading',{name:'Математика 5 класса',exact:true}).waitFor();
 await profile.press('Space');
 await dialog.getByRole('heading',{name:/Профили учеников/}).waitFor();
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'hidden'});
 await course.getByRole('heading',{name:'Математика 5 класса',exact:true}).waitFor();
 assert(await profile.evaluate(button=>button===document.activeElement));
 await brand.click();
 const gradeTitle=home.getByRole('heading',{name:'Выбери класс',exact:true});
 await gradeTitle.waitFor();
 const compact=page.viewportSize().width<=1120;
 assert.equal(await toggle.isVisible(),compact);
 if(compact){
  assert(await nav.isHidden());
  assert.equal(await toggle.getAttribute('aria-controls'),'mk-ui19-navigation');
  await toggle.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  const shop=nav.getByRole('button',{name:'Магазин',exact:true});
  await page.keyboard.press('Tab');
  assert(await shop.evaluate(button=>button===document.activeElement));
  await page.keyboard.press('Escape');
  assert(await nav.isHidden());
  assert(await toggle.evaluate(button=>button===document.activeElement));
  await toggle.press('Space');
  await nav.waitFor();
  assert(await nav.evaluate(element=>{
   const box=element.getBoundingClientRect();
   return box.left>=0&&box.right<=document.documentElement.clientWidth+1;
  }));
  const outsideY=Math.round((await nav.boundingBox()).y+12);
  assert(await page.evaluate(y=>!document.elementFromPoint(1,y)?.closest('.top'),outsideY));
  await page.mouse.click(1,outsideY);
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();
  await toggle.click();
  assert(await nav.isHidden());
 }else await nav.waitFor();

 const destinations=[
  ['Магазин',/Магазин/],['Данные',/Данные и резервные копии/],
  ['Журнал',/Журнал попыток/],['Лидеры',/Таблица лидеров/]
 ];
 for(const [label,title] of destinations){
  if(compact)await toggle.click();
  const item=nav.getByRole('button',{name:label,exact:true});
  await item.press('Space');
  await dialog.getByRole('heading',{name:title,level:2}).first().waitFor();
  if(compact)assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await close.click();
  await dialog.waitFor({state:'hidden'});
  const focused=compact?toggle:item;
  assert(await focused.evaluate(button=>button===document.activeElement),label);
 }
 await header.getByRole('button',{name:'Открыть кошелёк и посмотреть монеты',exact:true}).press('Enter');
 await dialog.getByRole('heading',{name:/Кошелёк/,level:2}).first().waitFor();
 await close.click();
 await dialog.waitFor({state:'hidden'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 console.log('PASS_APP_HEADER_OFFLINE',page.viewportSize().width);
}
async function checkOfflineQuiz(page){
 await page.evaluate(()=>startG5QuizStage('frac_to_mixed',0));
 const exercise=page.locator('#qstage[data-v-app]');
 const whole=exercise.locator('#quizFracWhole');
 const numerator=exercise.locator('#quizFracNum');
 const denominator=exercise.locator('#quizFracDen');
 await whole.waitFor();
 const given=exercise.locator('.quizq .frac').first();
 const n=Number(await given.locator('.num').textContent());
 const d=Number(await given.locator('.den').textContent());
 assert(n>d&&n%d>0);
 assert.equal(await denominator.inputValue(),String(d));
 assert.equal(await denominator.getAttribute('aria-readonly'),'true');
 const correctWhole=Math.floor(n/d);
 await whole.fill(String(correctWhole+1));
 await numerator.fill(String(n%d));
 await exercise.getByRole('button',{name:'Проверить',exact:true}).click();
 assert.match(await whole.getAttribute('class'),/\bbad\b/);
 await page.reload();
 await page.getByRole('button',{name:'Продолжить',exact:true}).click();
 assert.equal(await whole.inputValue(),String(correctWhole+1));
 assert.equal(await numerator.inputValue(),String(n%d));
 assert.match(await whole.getAttribute('class'),/\bbad\b/);
 assert.equal(await denominator.inputValue(),String(d));
 assert.equal(await denominator.getAttribute('aria-readonly'),'true');
 await whole.fill(String(correctWhole));
 await numerator.press('Enter');
 await exercise.getByText(/Исправлено!/).waitFor();
 const next=exercise.getByRole('button',{name:/Следующий пример|Посмотреть результат/});
 await next.click();
 for(let i=0;i<4;i++){
  await exercise.getByRole('button',{name:/Пропустить задание/}).click();
  await page.getByRole('button',{name:'Да, пропустить задание',exact:true}).click();
  await next.click();
 }
 const result=page.locator('.vue-report[data-v-app] .block-result');
 await result.getByText(/Исправлено:.*1.*Пропущено:.*4/).waitFor();
 await result.getByRole('button',{name:'К темам',exact:true}).click();
}
async function checkSharedRewardsAndFooter(page,vue=true){
 const mounted=vue?'[data-v-app]':':not([data-v-app])';
 const footer=page.locator('#appFooter'+mounted);
 const badge=footer.getByRole('button',{name:'Сборка v'+latest,exact:true});
 await badge.waitFor();
 assert.equal(await page.getByRole('contentinfo').locator('#appVersionBadge').count(),1);
 assert(await badge.evaluate(node=>{
  const badge=node.getBoundingClientRect(),footer=node.closest('footer'),main=document.getElementById('mainView');
  return getComputedStyle(footer).position==='static'&&badge.top>=main.getBoundingClientRect().bottom
   &&badge.left>=0&&badge.right<=document.documentElement.clientWidth;
 }));
 await badge.scrollIntoViewIfNeeded();
 for(let tap=0;tap<7;tap++){
  if(page.viewportSize().width<500)await badge.tap();
  else await badge.press('Enter');
 }
 const devAccess=page.getByRole('dialog',{name:'Код разработчика'});
 await devAccess.waitFor();
 await devAccess.getByRole('button',{name:'Отмена',exact:true}).click();
 assert(await badge.evaluate(node=>node===document.activeElement));
 const notice=page.locator('#rewardNotice'+mounted).getByRole('status');
 await notice.waitFor();
 assert.equal(await notice.getAttribute('aria-atomic'),'true');
 const before=await page.evaluate(()=>[state.xp,state.coins]);
 await page.evaluate(()=>rewardPop('+3 XP • +1 🪙'));
 await notice.locator('span[aria-hidden="false"]').getByText('+3 XP • +1',{exact:true}).waitFor();
 await notice.locator('img[alt="🪙"]').waitFor();
 await page.evaluate(()=>rewardPop('🏆 Новое достижение: проверка уведомления'));
 await notice.locator('span[aria-hidden="false"]').getByText('Новое достижение: проверка уведомления',{exact:true}).waitFor();
 await notice.locator('img[alt="🏆"]').waitFor();
 assert.equal(await notice.getByText('+3 XP • +1',{exact:true}).count(),0);
 assert(await notice.evaluate(node=>{
  const rect=node.getBoundingClientRect();
  return rect.left>=0&&rect.right<=document.documentElement.clientWidth;
 }));
 await page.waitForFunction(()=>{
  const toast=document.getElementById('rewardPop');
  return !toast.classList.contains('show')&&getComputedStyle(toast).opacity==='0';
 });
 assert.equal(await notice.locator('span').getAttribute('aria-hidden'),'true');
 assert.deepEqual(await page.evaluate(()=>[state.xp,state.coins]),before);
 await page.evaluate(()=>rewardPop('Временное уведомление'));
 await notice.locator('span[aria-hidden="false"]').getByText('Временное уведомление',{exact:true}).waitFor();
 await page.reload();
 await badge.waitFor();
 assert.equal(await notice.getByText('Временное уведомление',{exact:true}).count(),0);
 assert.deepEqual(await page.evaluate(()=>[state.xp,state.coins]),before);
 console.log(vue?'PASS_REWARD_NOTICE_AND_FOOTER_OFFLINE':'PASS_REWARD_NOTICE_AND_FOOTER_FALLBACK',page.viewportSize().width);
}
async function checkDeveloperTools(browser,address,viewport,vue=true){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500,
  serviceWorkers:vue?'allow':'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>{errors.push('Unexpected native dialog: '+dialog.type());return dialog.dismiss()});
 if(!vue)await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 const mounted=vue?'[data-v-app]':':not([data-v-app])';
 const footer=page.locator('#appFooter'+mounted).getByRole('button',{name:'Сборка v'+latest,exact:true});
 const access=page.locator('#devAccessDialog'+mounted);
 const code=access.getByLabel('Код разработчика',{exact:true});
 const dev=page.locator('#mk870DevButton');
 const panel=page.getByRole('dialog',{name:'Панель разработчика',exact:true}).locator('#mk870PanelBody'+mounted);
 const close=panel.getByRole('button',{name:'Закрыть',exact:true});
 const button=name=>panel.getByRole('button',{name,exact:true});
 const profile=panel.getByLabel('Профиль:',{exact:true});
 const read=()=>page.evaluate(()=>({id:state.profileId,coins:state.coins,xp:state.xp,test:!!state.developerTestProfile}));
 const focus=locator=>locator.evaluate(node=>document.activeElement===node);
 const open=async()=>{
  await footer.waitFor();
  for(let i=0;i<7;i++)await footer.press('Enter');
  await code.waitFor();
  assert(await focus(code));
 };
 try{
  await page.goto(address);
  if(vue){
   await idle(page);await page.reload();
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   await context.setOffline(true);await page.reload();
  }
  const original=await read(),name=await page.evaluate(()=>currentProfile);
  await open();
  await page.keyboard.press('Shift+Tab');
  assert(await focus(access.getByRole('button',{name:'Войти',exact:true})));
  await page.keyboard.press('Tab');
  assert(await focus(code));
  await access.getByRole('button',{name:'Отмена',exact:true}).click();
  await access.waitFor({state:'hidden'});
  assert(await focus(footer));
  await open();
  await code.fill('wrong');await code.press('Enter');
  await access.getByRole('alert').getByText('Неверный код',{exact:true}).waitFor();
  assert.equal(await code.inputValue(),'');
  await page.keyboard.press('Escape');
  await access.waitFor({state:'hidden'});
  assert(await focus(footer));

  await open();
  await code.fill(await page.evaluate(()=>DEV_ACCESS_CODE));await code.press('Enter');
  await close.waitFor();
  assert(await focus(close));
  assert.equal(await profile.inputValue(),name);
  assert.equal(await button('Установить монеты').count(),0);
  await page.evaluate(()=>mk870Coins(100));
  await panel.getByRole('status').getByText(/Сначала выберите тестовый профиль/).waitFor();
  assert.deepEqual(await read(),original);
  await page.keyboard.press('Escape');
  await panel.waitFor({state:'hidden'});
  assert(await focus(footer));
  await dev.press('Enter');
  await close.waitFor();
  await close.click();
  assert(await focus(dev));

  await dev.press('Enter');
  await button('Создать тестового ученика').click();
  const first=await read();
  assert.equal(first.test,true);
  assert.notEqual(first.id,original.id);
  await button('+100').click();
  await panel.getByRole('spinbutton',{name:'Точный XP'}).fill('250');
  await button('Установить XP').click();
  const trained={...first,coins:first.coins+100,xp:250};
  assert.deepEqual(await read(),trained);
  await panel.getByRole('spinbutton',{name:'Точное количество'}).fill('-8');
  await button('Установить монеты').click();
  await panel.getByRole('status').getByText(/Введите целое число/).waitFor();
  assert.deepEqual(await read(),trained);

  await button('Открыть всех героев').click();
  const grants=await page.evaluate(()=>state.developerGrantedItems.length);
  assert(grants>0);
  await button('Сохранить тестовый снимок').click();
  await panel.getByRole('status').getByText('Тестовый снимок сохранён',{exact:true}).waitFor();
  await button('Убрать developer-предметы').click();
  assert.equal(await page.evaluate(()=>state.developerGrantedItems.length),0);
  await button('Восстановить тестовый снимок').click();
  assert.equal(await page.evaluate(()=>state.developerGrantedItems.length),grants);
  assert.deepEqual(await read(),trained);
  await page.reload();
  await dev.press('Enter');
  await close.waitFor();
  assert.deepEqual(await read(),trained);

  const reset=button('Сбросить тестового ученика');
  await reset.click();
  await panel.getByRole('heading',{name:'Сбросить тестового ученика?'}).waitFor();
  const cancel=button('Отмена');
  assert(await focus(cancel));
  await page.keyboard.press('Escape');
  await reset.waitFor();
  assert(await focus(reset));
  assert.deepEqual(await read(),trained);
  await reset.click();
  await button('Сбросить профиль').click();
  await reset.waitFor();
  assert.deepEqual(await read(),first);

  await button('Создать тестового ученика').click();
  assert.notEqual((await read()).id,first.id);
  const remove=button('Удалить все тестовые профили');
  await remove.click();
  await button('Отмена').click();
  assert(await focus(remove));
  assert.equal(await page.evaluate(()=>Object.values(profiles).filter(p=>p.developerTestProfile).length),2);
  await remove.click();
  await button('Удалить тестовые профили').click();
  await profile.waitFor();
  assert.deepEqual(await read(),original);
  assert.equal(await page.evaluate(()=>Object.values(profiles).filter(p=>p.developerTestProfile).length),0);

  await button('Открыть архив').click();
  await panel.waitFor({state:'hidden'});
  await page.locator('#mk872CollectionContent').getByRole('heading',{name:/Архивные предметы/}).waitFor();
  await page.locator('#modal').getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await page.locator('#overlay').waitFor({state:'hidden'});
  await dev.press('Enter');
  await button('Выключить режим разработчика').click();
  await dev.waitFor({state:'hidden'});
  assert.deepEqual(await read(),original);
  assert.deepEqual(errors,[]);
  console.log(vue?'PASS_DEVELOPER_TOOLS_OFFLINE':'PASS_DEVELOPER_TOOLS_FALLBACK',viewport.width);
 }finally{await context.close()}
}
async function checkOfflineGrade4Block(page){
 await page.evaluate(()=>{openGrade(4);startQuizStage('moro_missing_sub',0);});
 const frame=page.locator('#schoolAttemptFrame[data-v-app]');
 const bar=frame.getByRole('progressbar');
 await frame.getByRole('heading',{name:/Неизвестное уменьшаемое и вычитаемое/}).waitFor();
 await frame.locator('.lesson').waitFor();
 assert.equal(await bar.getAttribute('aria-valuenow'),'0');
 const quiz=page.locator('#qstage[data-v-app]');
 const field=quiz.locator('#quizInput');
 const learning=page.locator('.mk872-training-dialog[data-v-app]');
 const exit=learning.getByRole('alertdialog',{name:'Выйти из тренировки?',exact:true});
 const stay=exit.getByRole('button',{name:'Остаться в тренировке',exact:true});
 const leave=exit.getByRole('button',{name:'Выйти и удалить попытку',exact:true});
 const current=()=>page.evaluate(()=>({attempt:blockSession.attemptId,item:blockSession.currentItem.itemId}));
 async function answer(){
  const prompt=await quiz.locator('.quizq').innerText();
  const equation=/x − (\d+) = (\d+)/.exec(prompt);
  assert(equation,prompt);
  return String(Number(equation[1])+Number(equation[2]));
 }
 const notice=page.locator('#rewardNotice[data-v-app] #rewardPop.show');
 const firstAnswer=await answer();
 await field.fill(firstAnswer);
 const original=await current(),prompt=await quiz.locator('.quizq').innerText();
 await page.keyboard.press('Escape');
 await exit.waitFor();
 assert(await stay.evaluate(button=>button===document.activeElement));
 await page.keyboard.press('Shift+Tab');
 assert(await leave.evaluate(button=>button===document.activeElement));
 await page.keyboard.press('Tab');
 assert(await stay.evaluate(button=>button===document.activeElement));
 await page.keyboard.press('Escape');
 await exit.waitFor({state:'detached'});
 assert(await field.evaluate(input=>input===document.activeElement));
 await frame.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 await stay.click();
 await exit.waitFor({state:'detached'});
 assert.deepEqual(await current(),original);
 assert.equal(await field.inputValue(),firstAnswer);
 const originalDraft=await page.evaluate(()=>mk872ReadDraft());
 assert.equal(originalDraft.attemptId,original.attempt);
 assert.equal(originalDraft.schema,2);
 assert.equal(Object.hasOwn(originalDraft,'html'),false);
 assert.equal(originalDraft.view.fields.find(field=>field.key==='quizInput').value,firstAnswer);
 await page.keyboard.press('F5');
 await resume(page);
 assert.equal(await bar.getAttribute('aria-valuemax'),'5');
 assert.deepEqual(await current(),original);
 assert.equal(await quiz.locator('.quizq').innerText(),prompt);
 assert.equal(await field.inputValue(),firstAnswer);
 for(let i=0;i<5;i++){
  await field.fill(await answer());
  if(i===1)await quiz.locator('#quizCheck').click();
  else await field.press('Enter');
  await quiz.getByText(/✅ Верно!/).waitFor();
  if(i===0){
   await notice.getByText(/\+10 XP +\+\d+/).waitFor();
   const beforeRetry=await page.evaluate(()=>[state.xp,state.coins]);
   assert.deepEqual(await page.evaluate(()=>award(true,'normal')),{xp:0,coins:0,bonus:'',duplicate:true});
   assert.deepEqual(await page.evaluate(()=>[state.xp,state.coins]),beforeRetry);
   const feedback=await quiz.locator('#qfb').innerText();
   await resume(page);
   assert.equal(await bar.getAttribute('aria-valuenow'),'1');
   assert.equal(await quiz.locator('#qfb').innerText(),feedback);
   assert.equal(await field.isDisabled(),true);
   assert.deepEqual(await page.evaluate(()=>[state.xp,state.coins]),beforeRetry);
  }
  const next=quiz.getByRole('button',{name:/Следующий пример|Посмотреть результат/});
  if(i===0)await next.press('Enter');
  else await next.click();
 }
 const result=page.locator('.vue-report[data-v-app] .block-result');
 await result.getByText('Верно с первой: 5 из 5',{exact:true}).waitFor();
 await result.getByText(/Бонус за первое прохождение/).waitFor();
 const wallet=page.getByRole('button',{name:'Открыть кошелёк и посмотреть монеты',exact:true});
 const earned=await wallet.innerText();
 await result.getByRole('button',{name:/Разбор попытки/}).click();
 await page.getByRole('button',{name:/К итогам/}).click();
 await result.getByText('Верно с первой: 5 из 5',{exact:true}).waitFor();
 assert.equal(await wallet.innerText(),earned);
 assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
 // An obsolete draft can still exist if a browser closed before pruning storage.
 await page.evaluate(draft=>localStorage.setItem(mk872DraftKey(),JSON.stringify(draft)),originalDraft);
 await page.reload();
 await page.waitForFunction(()=>mk872ReadDraft()===null);
 assert.equal(await page.getByRole('alertdialog',{name:/незавершённая тренировка/}).count(),0);
 assert.equal(await page.evaluate(id=>state.attemptHistory.filter(record=>record.id===id&&record.status==='finished').length,original.attempt),1);
 assert.equal(await wallet.innerText(),earned);
 assert.equal(await page.evaluate(()=>progressFor('moro_missing_sub').best[0]),5);
}
async function checkOfflineMixRestart(page){
 await page.evaluate(()=>openGrade(5));
 const previousDraftId=await page.evaluate(()=>mk872ReadDraft()?.attemptId);
 const play=page.locator('#mainView .g5-mix').getByRole('button',{name:'Играть',exact:true});
 const intro=page.locator('#modal > .vue-report[data-v-app]');
 const start=intro.getByRole('button',{name:'Начать микс',exact:true});
 await play.click();
 await intro.getByRole('heading',{name:/Микс по дробям/}).waitFor();
 await intro.getByText(/Вопросы внутри попытки не повторяются/).waitFor();
 await intro.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 await intro.waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>mk872ReadDraft()?.attemptId),previousDraftId);
 await play.click();
 await start.click();
 const exercise=page.locator('#qstage[data-v-app]');
 const frame=page.locator('#schoolAttemptFrame[data-v-app]');
 const bar=frame.getByRole('progressbar');
 await frame.getByText(/9 из 12/).waitFor();
 const learning=page.locator('.mk872-training-dialog[data-v-app]');
 const askRestart=learning.getByRole('button',{name:'Начать заново',exact:true});
 const confirmRestart=learning.getByRole('alertdialog',{name:'Начать тренировку заново?',exact:true});
 const attemptId=await page.evaluate(()=>blockSession.attemptId);
 await confirmSkip(page,exercise);
 await exercise.getByText(/Задание пропущено/).waitFor();
 assert.equal(await bar.getAttribute('aria-valuenow'),'1');
 const question=await exercise.locator('.quizq').innerText();
 await resume(page);
 assert.equal(await bar.getAttribute('aria-valuenow'),'1');
 assert.equal(await exercise.locator('.quizq').innerText(),question);
 assert.equal(await page.evaluate(()=>blockSession.attemptId),attemptId);
 await page.reload();
 await askRestart.click();
 await confirmRestart.getByRole('button',{name:'Отмена — сохранить попытку',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>{const draft=mk872ReadDraft();return [draft.attemptId,draft.values.block.done]}),[attemptId,1]);
 await page.reload();
 await askRestart.click();
 await confirmRestart.getByRole('button',{name:'Да, начать заново',exact:true}).click();
 assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
 await start.click();
 assert.equal(await bar.getAttribute('aria-valuenow'),'0');
 assert.equal(await bar.getAttribute('aria-valuemax'),'12');
 assert.notEqual(await page.evaluate(()=>blockSession.attemptId),attemptId);
 await page.keyboard.press('Escape');
 await learning.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
 await learning.waitFor({state:'detached'});
 assert.deepEqual(await page.evaluate(()=>[mk872ReadDraft(),state.activeAttempt]),[null,null]);
 console.log('PASS_LEARNING_DIALOGS_OFFLINE',page.viewportSize().width);
}
async function confirmSkip(page,exercise){
 await exercise.getByRole('button',{name:/Пропустить задание/}).click();
 await page.locator('.mk872-training-dialog[data-v-app]').getByRole('button',{name:'Да, пропустить задание',exact:true}).click();
}
async function resume(page){
 await page.reload();
 await page.locator('.mk872-training-dialog[data-v-app]').getByRole('alertdialog',{name:/незавершённая тренировка/})
  .getByRole('button',{name:'Продолжить',exact:true}).click();
}
async function checkQuizChoiceEvents(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
 try{
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
  await context.setOffline(true);
  const quiz=page.locator('#qstage[data-v-app]');
  const buttons=quiz.locator('.answers > button');
  const skip=quiz.locator('#quizSkip'),next=quiz.locator('#quizNext');
  const dialog=page.locator('.mk872-training-dialog[data-v-app]');
  const read=()=>page.evaluate(()=>{
   const item=blockSession.currentItem??blockSession.items.at(-1);
   return {attempt:blockSession.attemptId,item:item.itemId,prompt:q.text,done:blockSession.done,
    checks:item.checks.map(check=>check.correct),xp:state.xp,coins:state.coins};
  });
  for(const kind of ['quiz','controlreview','errorwork']){
   await page.evaluate(kind=>{
    openGrade(4);
    if(kind==='quiz'){startQuizStage('numbers',0);return}
    const target={...analyticsTopicMeta('g4:numbers'),stageIndex:0};
    if(kind==='controlreview'){startControlReviewBlock([target,target,target],4);return}
    const now=Date.now();
    state.attemptHistory.unshift({id:'choice-event-source',key:target.key,topicId:target.topicId,grade:4,
     stageIndex:0,kind:'quiz',status:'finished',endedAt:now,total:3,done:3,correct:0,
     items:Array.from({length:3},(_,i)=>({itemId:'choice-event-source-'+i,kind:'quiz',topicId:target.topicId,
      grade:4,prompt:'Задание для работы над ошибками '+i,finalCorrect:false,firstTry:false,skipped:false,endedAt:now-i}))});
    startErrorWorkBlock(3,null,4);
   },kind);
   await buttons.first().waitFor();
   assert(await quiz.evaluate(host=>host.onkeydown===null&&!host.querySelector('button[onclick]')));
   const [correct,wrong]=await page.evaluate(()=>{
    const ok=choice=>String(choice.key)===String(q.ans);
    return [q.choices.findIndex(ok),q.choices.findIndex(choice=>!ok(choice))];
   });
   assert(correct>=0&&wrong>=0);
   await buttons.nth(wrong).press('Enter');
   await quiz.getByText(/Пока неверно/).waitFor();
   const attempted=await read();
   assert.deepEqual(attempted.checks,[false],kind);
   await page.keyboard.press('F5');
   await resume(page);
   await buttons.nth(wrong).waitFor();
   assert.deepEqual(await read(),attempted);
   assert.match(await buttons.nth(wrong).getAttribute('class'),/\bbad\b/);
   await buttons.nth(correct).press('Space');
   await next.waitFor();
   const answered=await read();
   assert.equal(answered.done,1);
   assert.deepEqual(answered.checks,[false,true]);
   await resume(page);
   await next.waitFor();
   assert.deepEqual(await read(),answered);
   await next.press('Enter');
   await skip.waitFor();
   const pending=await read();
   assert.equal(pending.done,1);
   assert.notEqual(pending.item,answered.item);
   await skip.press('Space');
   await dialog.getByRole('button',{name:'Вернуться к заданию',exact:true}).press('Enter');
   assert(await skip.evaluate(button=>button===document.activeElement));
   assert.deepEqual(await read(),pending);
   await skip.press('Enter');
   await dialog.getByRole('button',{name:'Да, пропустить задание',exact:true}).press('Enter');
   assert.deepEqual(await page.evaluate(id=>blockSession.items.filter(item=>item.itemId===id).map(item=>item.skipped),pending.item),[true]);
   assert.equal((await read()).done,2);
   await page.keyboard.press('Escape');
   await dialog.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_QUIZ_VUE_EVENTS_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function checkTableVueEvents(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
  await context.setOffline(true);
  const table=page.locator('#tstage[data-v-app]');
  const input=table.getByRole('textbox',{name:'Ответ'});
  const primary=table.locator('#tablePrimary');
  const skip=table.locator('#tableSkip');
  const dialog=page.locator('.mk872-training-dialog[data-v-app]');
  const read=()=>page.evaluate(()=>{
   const item=blockSession.currentItem??blockSession.items.at(-1);
   return {attempt:blockSession.attemptId,item:item.itemId,example:[ta,tb],done:blockSession.done,
    checks:item.checks.map(check=>check.correct),xp:state.xp,coins:state.coins,
    achievements:Object.keys(achievementUnlockView(state)).sort()};
  });
  for(const kind of ['table','controlreview','errorwork']){
   await page.evaluate(kind=>{
    openGrade(4);
    if(kind==='table'){startTableStage(0);return}
    const target={...analyticsTopicMeta('g4:table'),stageIndex:0};
    if(kind==='controlreview'){startControlReviewBlock([target,target,target],4);return}
    const now=Date.now();
    state.attemptHistory.unshift({id:'table-event-source',key:target.key,topicId:target.topicId,grade:4,
     stageIndex:0,kind:'table',status:'finished',endedAt:now,total:3,done:3,correct:0,
     items:Array.from({length:3},(_,i)=>({itemId:'table-event-source-'+i,kind:'table',topicId:target.topicId,
      grade:4,prompt:`2 × ${i+2} = ?`,finalCorrect:false,firstTry:false,skipped:false,endedAt:now-i}))});
    startErrorWorkBlock(3,null,4);
   },kind);
   await input.waitFor();
   assert(await table.evaluate(host=>!host.onclick&&!host.onkeydown&&!host.querySelector('[onclick],[onkeydown]')));
   const original=await read();
   await input.press('Enter');
   await table.getByText(/Сначала введи ответ/).waitFor();
   assert.deepEqual(await read(),original);
   const answer=String(original.example[0]*original.example[1]);
   await input.fill(answer);
   if(kind==='controlreview')await primary.press('Space');
   else await input.press('Enter');
   await table.getByText(/✅ Верно!/).waitFor();
   assert(await skip.isHidden());
   assert(await primary.evaluate(button=>button===document.activeElement));
   const scored=await read(),rewards=kind==='table'?[10,3]:[5,1];
   assert.deepEqual(await page.evaluate(()=>[blockSession.lastAnswerReward.xp,blockSession.lastAnswerReward.coins]),rewards,kind);
   const earned=await page.evaluate(ids=>ids.map(id=>achievementById(id)?.reward??{}),
    scored.achievements.filter(id=>!original.achievements.includes(id)));
   assert.deepEqual([scored.xp-original.xp,scored.coins-original.coins],
    rewards.map((amount,i)=>amount+earned.reduce((total,reward)=>total+(reward[i===0?'xp':'coins']??0),0)),kind);
   assert.deepEqual(scored.checks,[true]);
   await page.keyboard.press('F5');
   await resume(page);
   await table.getByText(/✅ Верно!/).waitFor();
   assert.deepEqual(await read(),scored);
   assert.equal(await input.inputValue(),answer);
   assert.equal(await input.getAttribute('readonly'),'');
   assert(await primary.evaluate(button=>button===document.activeElement));
   await page.keyboard.down('Enter');
   await page.keyboard.down('Enter');
   await page.keyboard.up('Enter');
   await input.waitFor();
   const pending=await read();
   assert.equal(pending.done,1);
   assert.notEqual(pending.item,original.item);
   assert.deepEqual(pending.checks,[]);
   await input.fill('0');
   await primary.press('Enter');
   await table.getByText(/Пока неверно/).waitFor();
   const attempted=await read();
   assert.deepEqual(attempted.checks,[false]);
   await resume(page);
   await table.getByText(/Пока неверно/).waitFor();
   assert.deepEqual(await read(),attempted);
   assert.equal(await input.inputValue(),'0');
   await skip.press('Space');
   await dialog.getByRole('button',{name:'Вернуться к заданию',exact:true}).press('Enter');
   assert(await skip.evaluate(button=>button===document.activeElement));
   assert.deepEqual(await read(),attempted);
   await skip.press('Enter');
   await dialog.getByRole('button',{name:'Да, пропустить задание',exact:true}).press('Space');
   assert.deepEqual(await page.evaluate(id=>blockSession.items.filter(item=>item.itemId===id).map(item=>item.skipped),pending.item),[true]);
   const afterSkip=await read();
   assert.equal(afterSkip.done,2);
   assert.deepEqual([afterSkip.xp,afterSkip.coins],[attempted.xp,attempted.coins]);
   await page.keyboard.press('Escape');
   await dialog.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_TABLE_VUE_EVENTS_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function fillColumnCells(column){
 const required=column.locator('input[data-exp]:not(.mark-in)');
 const expected=await required.evaluateAll(inputs=>inputs.map(input=>input.dataset.exp));
 for(const [i,digit] of expected.entries())await required.nth(i).fill(digit);
}
async function checkColumnVueEvents(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
  await context.setOffline(true);
  const column=page.locator('#stage[data-v-app]');
  const primary=column.locator('#columnPrimary'),skip=column.locator('#columnSkip');
  const required=column.locator('input[data-exp]:not(.mark-in)');
  const dialog=page.locator('.mk872-training-dialog[data-v-app]');
  const feedback=column.locator('#fb');
  const values=()=>column.locator('input').evaluateAll(inputs=>inputs.map(input=>input.value));
  const read=()=>page.evaluate(()=>{
   const item=blockSession.currentItem??blockSession.items.at(-1);
   return {attempt:blockSession.attemptId,item:item.itemId,example:[task.a,task.b],operation:mode,done:blockSession.done,
    checks:item.checks.map(check=>check.correct),xp:state.xp,coins:state.coins,
    achievements:Object.keys(achievementUnlockView(state)).sort()};
  });
  const scenarios=[['column','add'],['column','sub'],['column','mul'],['column','div'],
   ['controlreview','mul'],['controlreview','div'],['errorwork','mul'],['errorwork','div']];
  for(const [kind,operation] of scenarios){
   await page.evaluate(({kind,operation})=>{
    openGrade(4);
    state.streak=0;
    if(kind==='column'){startColumnStage(operation,operation==='sub'?1:0);return}
    const target={...analyticsTopicMeta('g4:column:'+operation),stageIndex:0};
    if(kind==='controlreview'){startControlReviewBlock([target,target,target],4);return}
    const now=Date.now(),id='column-event-source-'+operation;
    state.attemptHistory.unshift({id,key:target.key,topicId:target.topicId,grade:4,
     stageIndex:0,kind:'column',status:'finished',endedAt:now,total:3,done:3,correct:0,
     items:Array.from({length:3},(_,i)=>({itemId:id+'-'+i,kind:'column',topicId:target.topicId,taskMode:operation,
      grade:4,prompt:operation==='div'?`${(21+i)*3} : 3`:`${21+i} × 34`,
      finalCorrect:false,firstTry:false,skipped:false,endedAt:now-i}))});
    startErrorWorkBlock(3,errorGroupKey(target),4);
   },{kind,operation});
   await required.first().waitFor();
   assert.equal(await primary.innerText(),operation==='div'?'Проверить все шаги':'Проверить всю запись');
   assert(await column.evaluate(host=>!host.onclick&&!host.oninput&&!host.onkeydown&&!host.querySelector('[onclick],[oninput],[onkeydown]')));
   const original=await read();
   assert.equal(original.operation,operation);
   await page.waitForFunction(()=>document.activeElement?.matches('#stage input[data-row][data-col]'));
   await required.first().press('Enter');
   await feedback.filter({hasText:/Заполни обязательные клетки/}).waitFor();
   assert.deepEqual(await read(),original);
   assert(await required.first().evaluate(input=>input===document.activeElement));
   if(kind==='column'&&operation==='sub'){
    const dot=column.locator('input.dot-in[data-exp="•"]').first();
    await dot.click();
    assert.equal(await dot.inputValue(),'•');
    await dot.click();
    assert.equal(await dot.inputValue(),'');
    await dot.fill('.');
    assert.equal(await dot.inputValue(),'•');
   }
   const row=column.locator(operation==='div'?'input[data-row="quot"]':'input[data-row="final"]');
   const right=operation==='div';
   await row.nth(right?0:1).press(right?'ArrowRight':'ArrowLeft');
   assert(await row.nth(right?1:0).evaluate(input=>input===document.activeElement));
   await row.nth(right?0:1).press('7');
   assert(await row.nth(right?1:0).evaluate(input=>input===document.activeElement));
   await fillColumnCells(column);
   const submitted=await values();
   if(kind==='controlreview')await primary.press('Space');
   else await required.last().press('Enter');
   await feedback.filter({hasText:/✅ Отлично!/}).waitFor();
   assert(await skip.isHidden());
   assert(await primary.evaluate(button=>button===document.activeElement));
   assert.equal(await column.locator('input:not([readonly])').count(),0);
   const scored=await read(),rewards=kind==='column'?[15,5]:[5,1];
   assert.deepEqual(await page.evaluate(()=>[blockSession.lastAnswerReward.xp,blockSession.lastAnswerReward.coins]),rewards,[kind,operation]);
   const earned=await page.evaluate(ids=>ids.map(id=>achievementById(id)?.reward??{}),
    scored.achievements.filter(id=>!original.achievements.includes(id)));
   assert.deepEqual([scored.xp-original.xp,scored.coins-original.coins],
    rewards.map((amount,i)=>amount+earned.reduce((total,reward)=>total+(reward[i===0?'xp':'coins']??0),0)));
   assert.deepEqual(scored.checks,[true]);
   await page.keyboard.press('F5');
   await resume(page);
   await feedback.filter({hasText:/✅ Отлично!/}).waitFor();
   assert.deepEqual(await read(),scored);
   assert.deepEqual(await values(),submitted);
   assert(await primary.evaluate(button=>button===document.activeElement));
   await page.keyboard.down('Enter');
   await page.keyboard.down('Enter');
   await page.keyboard.up('Enter');
   await required.first().waitFor();
   const pending=await read();
   assert.equal(pending.done,1);
   assert.notEqual(pending.item,scored.item);
   assert.deepEqual(pending.checks,[]);
   await fillColumnCells(column);
   const wrong=column.locator(operation==='div'?'input[data-row="prod0"]':'input[data-row="final"]').first();
   const incorrect=String((Number(await wrong.getAttribute('data-exp'))+1)%10);
   await wrong.fill(incorrect);
   await primary.press('Enter');
   await feedback.filter({hasText:/Пока неверно/}).waitFor();
   assert(await wrong.evaluate(input=>input.classList.contains('bad')&&input===document.activeElement));
   if(operation==='div')assert.equal(await column.locator('input.qin.bad').count(),0);
   const attempted=await read(),wrongValues=await values();
   assert.deepEqual(attempted.checks,[false]);
   await resume(page);
   await feedback.filter({hasText:/Пока неверно/}).waitFor();
   assert.deepEqual(await read(),attempted);
   assert.deepEqual(await values(),wrongValues);
   assert(await wrong.evaluate(input=>input.classList.contains('bad')));
   await skip.press('Space');
   await dialog.getByRole('button',{name:'Вернуться к заданию',exact:true}).press('Enter');
   assert(await skip.evaluate(button=>button===document.activeElement));
   assert.deepEqual(await read(),attempted);
   await skip.press('Enter');
   await dialog.getByRole('button',{name:'Да, пропустить задание',exact:true}).press('Space');
   assert.deepEqual(await page.evaluate(id=>blockSession.items.filter(item=>item.itemId===id).map(item=>item.skipped),pending.item),[true]);
   const afterSkip=await read();
   assert.equal(afterSkip.done,2);
   assert.deepEqual([afterSkip.xp,afterSkip.coins],[attempted.xp,attempted.coins]);
   await page.keyboard.press('Escape');
   await dialog.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
   console.log('PASS_COLUMN_SCENARIO_OFFLINE',viewport.width,kind,operation);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_COLUMN_VUE_EVENTS_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function checkReviewExercises(page){
 const keys=['g4:moro_missing_sub','g4:table','g4:column:add'];
 const quiz=page.locator('#qstage[data-v-app]'),table=page.locator('#tstage[data-v-app]');
 const column=page.locator('#stage[data-v-app]');
 const frame=page.locator('#schoolAttemptFrame[data-v-app]');
 const bar=frame.getByRole('progressbar');
 const report=page.locator('.vue-report[data-v-app]');
 const wallet=page.getByRole('button',{name:'Открыть кошелёк и посмотреть монеты',exact:true});
 const lessons={
  errorwork:/верно с первой попытки/,
  weaktopic:/не открывает ступени/,
  controlreview:/3 заданий/,
 };
 for(const kind of Object.keys(lessons)){
  const attempt=await page.evaluate(({kind,keys})=>{
   const targets=keys.map(key=>({...analyticsTopicMeta(key),stageIndex:0}));
   if(kind==='errorwork'){
    const now=Date.now();
    state.attemptHistory.push(...targets.map((target,i)=>({
     id:'vue-review-source-'+i,key:target.key,topicId:target.topicId,grade:4,stageIndex:0,
     kind:target.kind,status:'finished',endedAt:now-i,total:1,done:1,correct:0,
     items:[{itemId:'vue-review-item-'+i,kind:target.kind,topicId:target.topicId,grade:4,taskMode:target.taskMode,
      prompt:'Исходное задание',finalCorrect:false,firstTry:false,skipped:false,endedAt:now-i}]
    })));
    startErrorWorkBlock(3,null,4);
   }else if(kind==='weaktopic')startWeakPracticeBlock(targets,'mixed');
   else startControlReviewBlock(targets,4);
   return blockSession.attemptId;
  },{kind,keys});
  await frame.locator('.lesson').filter({hasText:lessons[kind]}).waitFor({state:'attached'});
  const input=quiz.locator('#quizInput');
  await input.fill('19');
  if(kind==='errorwork'){
   const before=await page.evaluate(()=>({source:blockSession.errorCurrentSource,item:blockSession.currentItem.itemId,prompt:q.text}));
   await resume(page);
   assert.equal(await bar.getAttribute('aria-valuenow'),'0');
   assert.equal(await input.inputValue(),'19');
   assert.equal(await page.evaluate(()=>blockSession.attemptId),attempt);
   assert.deepEqual(await page.evaluate(()=>({source:blockSession.errorCurrentSource,item:blockSession.currentItem.itemId,prompt:q.text})),before);
  }
  await input.fill('0');
  await input.press('Enter');
  await quiz.getByText(/Пока неверно/).waitFor();
  assert.equal(await page.evaluate(()=>blockSession.currentItem.checks.length),1);
  await confirmSkip(page,quiz);
  assert.equal(await bar.getAttribute('aria-valuenow'),'1');
  const factors=(await table.locator('.flash').innerText()).match(/(\d+) × (\d+)/);
  assert(factors);
  await table.getByRole('textbox',{name:'Ответ'}).fill(String(Number(factors[1])*Number(factors[2])));
  await table.getByRole('textbox',{name:'Ответ'}).press('Enter');
  await table.getByText(/✅ Верно!/).waitFor();
  if(kind==='controlreview'){
   const earned=await wallet.innerText();
   const last=await page.evaluate(()=>blockSession.items.at(-1));
   await resume(page);
   assert.equal(await bar.getAttribute('aria-valuenow'),'2');
   await table.getByText(/✅ Верно!/).waitFor();
   assert.equal(await wallet.innerText(),earned);
   assert.deepEqual(await page.evaluate(()=>blockSession.items.at(-1)),last);
  }
  await table.getByRole('button',{name:/Следующий пример/}).click();
  const digits=column.locator('input[data-row="final"]');
  await digits.first().waitFor();
  assert.equal(await page.locator('#tstage[data-v-app]').count(),0);
  assert.equal(await bar.getAttribute('aria-valuenow'),'2');
  if(kind==='weaktopic'){
   const operands=(await column.locator('.cgrid .cell').allTextContents()).map(value=>value.trim()).join('').split('+');
   assert.equal(operands.length,2);
   const answer=String(Number(operands[0])+Number(operands[1]));
   assert.equal(await digits.count(),answer.length);
   for(const [index,value] of [...answer].entries())await digits.nth(index).fill(value);
   await digits.last().press('Enter');
   await column.getByText(/✅ Отлично!/).waitFor();
   await column.getByRole('button',{name:/Посмотреть результат|Итоги блока/}).click();
  }else await confirmSkip(page,column);
  await report.getByRole('button',{name:/Разбор попытки/}).waitFor();
  const saved=await page.evaluate(id=>state.attemptHistory.find(attempt=>attempt.id===id).items.map(item=>[item.kind,!!item.finalCorrect,!!item.skipped]),attempt);
  assert.deepEqual(saved,[['quiz',false,true],['table',true,false],['column',kind==='weaktopic',kind!=='weaktopic']],kind);
  await report.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 }
}
async function checkQuickExercises(page){
 const home=page.locator('#homeDashboard[data-v-app]');
 const frame=page.locator('#quickTrainerFrame[data-v-app]');
 await page.evaluate(()=>mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME()));
 for(const trainer of ['multiplication','addition','squares','cubes']){
  await home.locator('.quick-home button[data-home-action="quick-'+trainer+'"]').click();
  const stage=page.locator('#quickStage[data-v-app]');
  await frame.locator('.quick-hero h1').waitFor();
  assert.equal(await frame.getByRole('button',{name:/Вернуться к плану/}).count(),0);
  await stage.getByRole('heading',{name:'Что потренируем?'}).waitFor();
  assert(await frame.locator('#quickTopline').isHidden());
  if(trainer==='multiplication'){
   const table=stage.locator('button[data-quick-setup="choice:3"]');
   const selected=await table.getAttribute('aria-pressed');
   await table.click();
   assert.equal(await table.getAttribute('aria-pressed'),String(selected!=='true'));
  }
  await stage.getByRole('button',{name:'Начать тренировку',exact:true}).press('Enter');
  await frame.locator('#quickTopline').waitFor();
  const options=stage.locator('.quick-answer');
  await options.first().waitFor();
  assert(await stage.evaluate(host=>!host.onclick&&!host.onkeydown&&!host.querySelector('button[onclick]')));
  assert(await options.first().evaluate(button=>button===document.activeElement));
  const expected=await page.evaluate(()=>String(quickQuestion.correct));
  const answer=stage.getByRole('button',{name:expected,exact:true});
  const next=stage.locator('#quickNextBtn');
  const attempt=await page.evaluate(()=>quickSession.recordId);
  const question=()=>page.evaluate(()=>[quickQuestion.instanceId,quickQuestion.checks,state.xp,state.coins,quickSession.answered]);
  if(trainer==='multiplication'){
   const wrong=options.filter({hasNotText:new RegExp('^'+expected+'$')}).first();
   await wrong.press('Space');
   const attempted=await question();
   assert.equal(attempted[1].length,1);
   await resume(page);
   assert.equal(await options.and(stage.locator('button.bad:disabled')).count(),1);
   await stage.getByText(/Пока нет/).waitFor();
   assert.deepEqual(await question(),attempted);
  }
  if(trainer==='addition'){
   const [example]=await question();
   await answer.focus();
   await page.keyboard.down('Enter');
   await page.keyboard.down('Enter');
   await page.keyboard.up('Enter');
   assert.equal((await question())[0],example);
  }else if(trainer==='cubes')await answer.click();
  else await answer.press('Enter');
  await stage.getByText(/✅ Верно!/).waitFor();
  assert(await next.evaluate(button=>button===document.activeElement));
  const scored=await question();
  assert.equal(scored[4],1);
  const rewards=await page.evaluate(()=>quickSessionRecord().items.map(item=>[item.rewardXP,item.rewardCoins]));
  assert.deepEqual(rewards,trainer==='multiplication'?[[2,0]]:[[3,1]]);
  const balances=await page.evaluate(()=>[String(state.xp),String(state.coins)]);
  assert.deepEqual(await frame.locator('#quickXP, #quickCoins').allTextContents(),balances);
  if(trainer==='addition'){
   await page.keyboard.press('F5');
   await resume(page);
   await stage.getByText(/✅ Верно!/).waitFor();
   assert.deepEqual(await question(),scored);
   assert(await next.evaluate(button=>button===document.activeElement));
   await frame.locator('#quickTopline').waitFor();
   assert.deepEqual(await frame.locator('#quickXP, #quickCoins').allTextContents(),balances);
  }
  if(trainer==='multiplication'){
   await next.press('Enter');
   await options.first().waitFor();
   assert.notEqual((await question())[0],scored[0]);
   assert(await options.first().evaluate(button=>button===document.activeElement));
   assert.equal(await stage.locator('#quickAnswered').textContent(),'1');
  }
  await stage.getByRole('button',{name:'Завершить тренировку',exact:true}).press('Space');
  const heading=stage.getByRole('heading',{name:'Тренировка завершена!',exact:true});
  await heading.waitFor();
  assert(await heading.evaluate(node=>node===document.activeElement));
  assert.equal(await page.evaluate(id=>state.attemptHistory.filter(record=>record.id===id&&record.status==='finished').length,attempt),1);
  assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
  assert(await frame.locator('#quickTopline').isHidden());
  assert.equal(await stage.locator('.quick-summary-stat').first().innerText(),'1\nРешено');
  await stage.getByRole('button',{name:'Ещё раз',exact:true}).click();
  await stage.getByRole('heading',{name:'Что потренируем?'}).waitFor();
  await frame.getByRole('button',{name:'← Главный экран',exact:true}).click();
 }
 console.log('PASS_QUICK_VUE_EVENTS_OFFLINE',page.viewportSize().width);
}
async function checkQuickResultActions(browser,address,viewport,vue=true){
 active=fresh;stale='none';
 const context=await browser.newContext({
  viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600,serviceWorkers:vue?'allow':'block'
 });
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  if(!vue)await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  if(vue){
   await idle(page);await page.reload();
   await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
   await context.setOffline(true);await page.reload();
  }
  const home=page.locator(vue?'#homeDashboard[data-v-app]':'#mainView');
  const stage=page.locator(vue?'#quickStage[data-v-app]':'#quickStage');
  const result=stage.locator('.quick-summary');
  const heading=result.getByRole('heading',{name:'Тренировка завершена!',exact:true});
  const start=stage.getByRole('button',{name:'Начать тренировку',exact:true});
  const again=result.getByRole('button',{name:'Ещё раз',exact:true});
  const exit=result.getByRole('button',{name:'На главную',exact:true});
  const finish=stage.getByRole('button',{name:'Завершить тренировку',exact:true});
  const resumeDialog=page.getByRole('alertdialog',{name:/незавершённая тренировка/});
  const data=(ids)=>page.evaluate(({attempt,session,trainer})=>({
   xp:state.xp,coins:state.coins,
   completed:quickStatsFor(trainer).sessionsCompleted,
   aggregate:state.trainingAggregates.totalSessions,
   records:state.attemptHistory.filter(row=>row.id===attempt&&row.status==='finished')
    .map(({id,done,correct,endedAt,sessionSummary,items})=>({id,done,correct,endedAt,sessionSummary,items})),
   history:state.trainingHistory.filter(row=>row.sessionId===session)
  }),ids);
  const sessionIds=()=>page.evaluate(()=>({attempt:quickSession.recordId,session:quickSession.sessionId,trainer:quickTrainerId}));
  async function solve(key){
   const expected=await page.evaluate(()=>String(quickQuestion.correct));
   await stage.getByRole('button',{name:expected,exact:true}).press(key);
   await stage.getByText(/✅ Верно!/).waitFor();
  }
  await home.locator('button[data-home-action="quick-addition"]').press('Enter');
  await stage.locator('[data-quick-setup="choice:to10"]').press('Space');
  await page.evaluate(()=>{quickUpdateFactStats('addition',quickFactKey('addition',2,3),false);save()});
  await stage.locator('[data-quick-setup="smart:errors"]').press('Enter');
  const config=await page.evaluate(()=>quickSelection);
  await start.press('Enter');
  await stage.locator('.quick-answer').first().waitFor();
  const ids=await sessionIds(),before=await data(ids);
  const expected=await page.evaluate(()=>String(quickQuestion.correct));
  await stage.locator('.quick-answer').filter({hasNotText:new RegExp('^'+expected+'$')}).first().press('Space');
  await stage.getByText(/Пока нет/).waitFor();
  await solve('Enter');
  await stage.getByRole('button',{name:/Следующий пример/}).press('Space');
  await solve('Enter');
  await finish.press('Space');
  await heading.waitFor();
  assert(await heading.evaluate(node=>node===document.activeElement));
  assert.equal(await result.locator('button[onclick]').count(),0);
  if(vue)assert(await stage.evaluate(host=>!host.onclick&&!host.onkeydown));
  const summaryText=async()=> (await result.innerText()).replace(/🪙/g,'').replace(/\s+/g,' ').trim();
  const summary=await summaryText(),settled=await data(ids);
  assert.equal(settled.completed,before.completed+1);
  assert.equal(settled.aggregate,before.aggregate+1);
  assert.equal(settled.records.length,1);
  assert.equal(settled.history.length,1);
  const saved=settled.records[0].sessionSummary;
  assert.deepEqual(saved.selectedConfig,config);
  assert.equal(saved.answered,2);
  assert.equal(saved.wrong,1);
  const rewards=await result.locator('.quick-summary-reward span').allTextContents();
  assert.deepEqual(rewards.map(text=>text.replace('🪙','').trim()),['+'+saved.earnedXP+' XP','+'+saved.earnedCoins]);
  assert((await result.locator('.quick-review-fact').allTextContents()).includes('2 + 3'));
  if(vue){
   for(let i=0;i<2;i++){
    await page.keyboard.press('F5');await page.reload();
    await heading.waitFor();
    assert.equal(await summaryText(),summary);
    assert.deepEqual(await data(ids),settled);
    assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
    assert.equal(await resumeDialog.count(),0);
   }
  }
  await page.keyboard.press('Tab');
  assert(await again.evaluate(node=>node===document.activeElement));
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await start.waitFor();
  assert(await start.evaluate(node=>node===document.activeElement));
  assert.deepEqual(await page.evaluate(()=>quickSelection),config);
  assert.equal(await page.evaluate(()=>history.state?.quickResult??null),null);
  if(vue){await page.reload();await start.waitFor();}
  assert.deepEqual(await data(ids),settled);
  await start.press('Space');
  await stage.locator('.quick-answer').first().waitFor();
  assert.notEqual((await sessionIds()).attempt,ids.attempt);
  assert.deepEqual(await page.evaluate(()=>quickSession.selectedConfig),config);
  await finish.press('Space');
  await exit.press('Enter');
  await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
  if(vue){
   await seedQuickTrainingPlan(page);
   const plan=page.locator('#trainingPlanVue[data-v-app]');
   const launch=plan.getByRole('button',{name:'Начать',exact:true});
   await home.getByRole('button',{name:'Открыть план',exact:true}).press('Enter');
   await launch.press('Space');
   await start.press('Enter');
   await stage.locator('.quick-answer').first().waitFor();
   const planIds=await sessionIds();
   for(let i=0;i<5;i++){
    await solve(i%2?'Space':'Enter');
    if(i<4)await stage.getByRole('button',{name:/Следующий пример/}).press('Enter');
   }
   await finish.press('Space');
   await heading.waitFor();
   const planData=await data(planIds);
   await page.reload();
   await heading.waitFor();
   assert.deepEqual(await data(planIds),planData);
   assert.equal(await page.evaluate(()=>trainingPlanRunContext.itemId),'quick-multiply-three');
   await result.getByRole('button',{name:/Вернуться к плану/}).press('Space');
   await plan.getByRole('heading',{name:/План выполнен/}).waitFor();
   assert.equal(await plan.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
   await page.goForward();
   await heading.waitFor();
   await exit.press('Enter');
   await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>mk854Route().screen),'home');
   assert.deepEqual(await data(planIds),planData);
  }
  assert.deepEqual(errors,[]);
  console.log(vue?'PASS_QUICK_RESULT_ACTIONS_OFFLINE':'PASS_QUICK_RESULT_HTML_FALLBACK',viewport.width);
 }finally{await context.close()}
}
async function checkQuickSetupActions(browser,address,viewport,vue=true){
 active=fresh;stale='none';
 const context=await browser.newContext({
  viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600,serviceWorkers:vue?'allow':'block'
 });
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  if(!vue)await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  if(vue){
   await idle(page);await page.reload();
   await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
   await context.setOffline(true);await page.reload();
  }
  const home=page.locator(vue?'#homeDashboard[data-v-app]':'#mainView');
  const stage=page.locator(vue?'#quickStage[data-v-app]':'#quickStage');
  const button=id=>stage.locator('button[data-quick-setup="'+id+'"]');
  const config=()=>page.evaluate(()=>quickSelection);
  const scenarios=vue?[['multiplication','3'],['addition','to10'],['squares','11-20'],['cubes','6-10']]:[['addition','to10']];
  for(const [trainer,choice] of scenarios){
   await home.locator('button[data-home-action="quick-'+trainer+'"]').press('Enter');
   const range=button('choice:'+choice),start=button('start');
   await range.waitFor();
   assert.equal(await stage.locator('button[onclick]').count(),0);
   if(vue)assert(await stage.evaluate(host=>!host.onclick&&!host.onkeydown));
   await range.focus();
   await page.keyboard.down('Enter');
   await page.keyboard.down('Enter');
   await page.keyboard.up('Enter');
   assert(await range.evaluate(node=>node===document.activeElement));
   if(trainer==='multiplication'){
    assert.equal(await range.getAttribute('aria-pressed'),'false');
    await button('choice:all').press('Space');
    assert.equal(await range.getAttribute('aria-pressed'),'true');
    for(const table of [1,2,4,5,6,7,8,9,10])await button('choice:'+table).press('Space');
    assert.deepEqual((await config()).tables,[3]);
    assert.equal(await stage.locator('tr.quick-selected-row').count(),1);
   }else{
    assert.equal(await range.getAttribute('aria-pressed'),'true');
    assert.equal((await config()).mode,choice);
   }
   await button('smart:errors').focus();
   await page.keyboard.press('Tab');
   assert(await button('home').evaluate(node=>node===document.activeElement));
   await button('smart:errors').press('Space');
   await start.press('Enter');
   await stage.getByRole('status').getByText('Ошибок для повторения пока нет.').waitFor();
   assert.equal(await page.evaluate(()=>quickSession),null);
   await button('train-all').press('Space');
   assert.equal(await button('smart:all').getAttribute('aria-pressed'),'true');
   assert(await start.evaluate(node=>node===document.activeElement));
   assert.equal(await button('train-all').count(),0);
   const fact=await page.evaluate(()=>{
    const first=quickFactPool(quickTrainerId,quickSelection)[0].factKey;
    quickUpdateFactStats(quickTrainerId,first,false);save();return first;
   });
   const mode=trainer==='multiplication'||trainer==='cubes'?'errors':'weak';
   await button('smart:'+mode).press('Enter');
   const selected=await config(),label=await stage.locator('#quickSelectionText').innerText();
   if(vue){
    await page.keyboard.press('F5');await page.reload();
    await button('smart:'+mode).waitFor();
    assert.equal(await button('smart:'+mode).getAttribute('aria-pressed'),'true');
    assert.deepEqual(await config(),selected);
    assert.equal(await stage.locator('#quickSelectionText').innerText(),label);
   }
   await start.press('Space');
   await stage.locator('.quick-answer').first().waitFor();
   assert.equal(await page.evaluate(()=>quickQuestion.factKey),fact);
   assert.deepEqual(await page.evaluate(()=>quickSession.selectedConfig),selected);
   if(vue){
    await resume(page);
    await stage.locator('.quick-answer').first().waitFor();
    assert.deepEqual(await page.evaluate(()=>quickSession.selectedConfig),selected);
   }
   const answer=await page.evaluate(()=>String(quickQuestion.correct));
   await stage.getByRole('button',{name:answer,exact:true}).press('Enter');
   await stage.getByText(/✅ Верно!/).waitFor();
   await stage.getByRole('button',{name:'Завершить тренировку',exact:true}).press('Space');
   await stage.getByRole('button',{name:'Ещё раз',exact:true}).press('Enter');
   await button('home').press('Space');
   await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
  }
  if(vue){
   await seedQuickTrainingPlan(page);
   await home.getByRole('button',{name:'Открыть план',exact:true}).press('Enter');
   const plan=page.locator('#trainingPlanVue[data-v-app]');
   const launch=plan.getByRole('button',{name:'Начать',exact:true});
   await launch.press('Space');
   assert.equal(await button('choice:3').getAttribute('aria-pressed'),'true');
   assert.equal(await button('smart:errors').getAttribute('aria-pressed'),'true');
   await button('choice:4').press('Enter');
   await button('smart:weak').press('Space');
   await page.keyboard.press('F5');await page.reload();
   const returnToPlan=page.locator('#quickTrainerFrame').getByRole('button',{name:/Вернуться к плану/});
   await returnToPlan.waitFor();
   assert.equal(await stage.locator('#quickSelectionText').innerText(),'3, 4');
   assert.equal(await button('smart:weak').getAttribute('aria-pressed'),'true');
   await button('start').press('Enter');
   await stage.locator('.quick-answer').first().waitFor();
   assert.deepEqual(await page.evaluate(()=>quickSession.selectedConfig),{type:'multiTables',tables:[3,4],smartMode:'weak'});
   assert.equal(await page.evaluate(()=>trainingPlanRunContext.itemId),'quick-multiply-three');
   await returnToPlan.press('Space');
   await page.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).press('Enter');
   await launch.waitFor();
   await launch.press('Space');
   await button('choice:3').waitFor();
   assert.deepEqual(await config(),{type:'multiTables',tables:[3],smartMode:'errors'});
  }
  assert.deepEqual(errors,[]);
  console.log(vue?'PASS_QUICK_SETUP_ACTIONS_OFFLINE':'PASS_QUICK_SETUP_HTML_FALLBACK',viewport.width);
 }finally{await context.close()}
}
async function checkHomeDashboard(page){
 const home=page.locator('#homeDashboard[data-v-app]');
 await page.evaluate(()=>mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME()));
 await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
 assert.equal(await home.locator('.grade-grid > .grade-card').count(),8);
 assert.equal(await home.locator('.quick-home .quick-card').count(),5);
 const fifth=home.locator('.grade-card').filter({has:page.getByRole('button',{name:'Открыть 5 класс',exact:true})});
 assert.match(await fifth.locator('.grade-summary').innerText(),/\/74/);
 await fifth.getByRole('button',{name:'Открыть 5 класс',exact:true}).press('Enter');
 await page.locator('#grade5Vue[data-v-app]').waitFor();
 await page.goBack();
 await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
 const progress=home.getByRole('button',{name:'Мой прогресс',exact:true});
 assert.equal(await progress.count(),1);
 await progress.click();
 const studentProgress=page.locator('.vue-report[data-v-app]');
 await studentProgress.getByRole('heading',{name:'Мой учебный прогресс',exact:true}).waitFor();
 const grades=studentProgress.locator('.mk19f-grade-row');
 assert.equal(await grades.count(),8);
 assert.equal(await studentProgress.getByRole('progressbar').count(),9);
 await grades.last().getByRole('button',{name:'Открыть 8 класс',exact:true}).click();
 await page.locator('#grade8Vue[data-v-app]').waitFor();
 await page.goBack();
 await home.getByRole('heading',{name:'Выбери класс',exact:true}).waitFor();
 assert.equal(await home.locator('.training-history-row').count(),3);
 await home.getByRole('button',{name:/Вся история/}).click();
 const report=page.locator('.vue-report[data-v-app]');
 await report.getByRole('heading',{name:/Последние тренировки/}).waitFor();
 assert.equal(await report.locator('.training-history-row').count(),4);
 await report.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 await home.getByRole('button',{name:'Выбрать цель',exact:true}).click();
 const goalPicker=page.getByRole('dialog',{name:/Выбрать цель тренировки/}).locator('.vue-report[data-v-app]');
 await goalPicker.locator('.goal-option').first().click();
 const goal=home.locator('.training-goal-card');
 await goal.getByRole('button',{name:'Продолжить',exact:true}).waitFor();
 await page.reload();
 await goal.getByRole('button',{name:'Продолжить',exact:true}).click();
 await page.locator('#quickStage[data-v-app]').getByRole('heading',{name:'Что потренируем?'}).waitFor();
}
async function checkHomeActions(browser,address,viewport,vue=true){
 active=fresh;stale='none';
 const context=await browser.newContext({
  viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600,serviceWorkers:vue?'allow':'block'
 });
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  if(!vue)await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  if(vue){
   await idle(page);await page.reload();
   await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
   await context.setOffline(true);await page.reload();
  }
  await seedQuickTrainingPlan(page);
  await page.evaluate(()=>{
   for(let i=0;i<4;i++)recordTrainingSession({sessionId:'home-history-'+i,
    trainerId:'addition',answered:2,correct:1,wrong:1});
   MK854_CORE_RENDER_HOME();
  });
  const home=page.locator(vue?'#homeDashboard[data-v-app]':'#mainView');
  const start=home.getByRole('heading',{name:'Выбери класс',exact:true});
  const action=id=>home.locator('button[data-home-action="'+id+'"]');
  const modal=page.locator('#overlay.show #modal');
  const close=modal.getByRole('button',{name:'Закрыть окно',exact:true});
  const brand=page.getByRole('button',{name:'МатКвест — на главную',exact:true});
  const route=()=>page.evaluate(()=>mk854Route());
  const depth=()=>page.evaluate(()=>mk854Depth());
  await start.waitFor();
  assert.equal(await home.locator('button[data-home-action][onclick]').count(),0);
  assert.equal(await home.locator('.grade-card[tabindex]').count(),0);
  const first=action('grade-1'),second=action('grade-2');
  await first.focus();
  await page.keyboard.press('Tab');
  assert(await second.evaluate(button=>button===document.activeElement));
  for(const grade of vue?[1,2,3,4,5,6,7,8]:[4,5]){
   const before=await depth();
   const button=action('grade-'+grade);
   if(grade===4)await button.locator('xpath=..').locator('h2').click();
   else await button.press(grade%2?'Enter':'Space');
   await page.waitForFunction(g=>mk854Route().screen==='grade'&&currentGrade===g,grade);
   assert.equal(await depth(),before+1);
   if(vue&&grade===5){
    await page.keyboard.press('F5');await page.reload();
    await page.locator('#grade5Vue[data-v-app]').waitFor();
    assert.deepEqual(await route(),{screen:'grade',grade:5});
   }
   if(grade===5)await page.goBack();
   else await brand.press('Enter');
   await start.waitFor();
  }
  await action('quick-column').press('Space');
  await modal.getByRole('heading',{name:/Счёт столбиком/}).waitFor();
  await close.press('Enter');
  await start.waitFor();
  const trainerFrame=page.locator('#quickTrainerFrame');
  for(const trainer of vue?['multiplication','addition','squares','cubes']:['addition']){
   const before=await depth(),button=action('quick-'+trainer);
   if(trainer==='multiplication')await button.locator('xpath=..').locator('h3').click();
   else await button.press('Enter');
   await trainerFrame.getByRole('heading',{name:'Что потренируем?',exact:true}).waitFor();
   assert.deepEqual(await route(),{screen:'trainer',trainerId:trainer});
   assert.equal(await depth(),before+1);
   if(vue&&trainer==='addition'){
    await page.keyboard.press('F5');await page.reload();
    await trainerFrame.getByRole('heading',{name:'Что потренируем?',exact:true}).waitFor();
    assert.deepEqual(await route(),{screen:'trainer',trainerId:trainer});
   }
   await trainerFrame.getByRole('button',{name:/Главный экран/}).press('Space');
   await start.waitFor();
  }
  await action('plan').press('Space');
  const plan=page.locator('#trainingPlanVue');
  await plan.getByRole('heading',{name:/План тренировки/,level:1}).waitFor();
  assert.equal((await route()).screen,'trainingPlan');
  if(vue){
   await page.keyboard.press('F5');await page.reload();
   await plan.getByRole('heading',{name:/Таблица на 3: ошибки/}).waitFor();
  }
  await plan.getByRole('button',{name:/Главный экран/}).press('Enter');
  await start.waitFor();
  if(vue){await page.keyboard.press('F5');await page.reload();await start.waitFor();}
  assert.equal(await home.locator('.training-history-row').count(),3);
  for(const [id,heading,selector,count] of [
   ['progress',/Мой учебный прогресс/,'.mk19f-grade-row',8],
   ['history',/Последние тренировки/,'.training-history-row',4],
  ]){
   const button=action(id);
   await button.press('Space');
   await modal.getByRole('heading',{name:heading}).waitFor();
   assert.equal(await modal.locator(selector).count(),count);
   await page.keyboard.press('Escape');
   await modal.waitFor({state:'hidden'});
   assert(await button.evaluate(node=>node===document.activeElement));
  }
  assert.deepEqual(errors,[]);
  console.log(vue?'PASS_HOME_ACTIONS_OFFLINE':'PASS_HOME_ACTIONS_HTML_FALLBACK',viewport.width);
 }finally{await context.close()}
}
async function readGoalState(page){
 return page.evaluate(()=>({
  goal:state.activeTrainingGoal,serial:state.trainingGoalSerial,
  coins:state.coins,xp:state.xp,completed:state.completedTrainingGoals,history:state.trainingHistory,
 }));
}
async function checkGoalConfirmations(page,vue=true){
 await page.evaluate(()=>{
  state.activeTrainingGoal=trainingGoalCandidate('correct');
  state.activeTrainingGoal.progress=3;save();
  mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME());
 });
 const home=page.locator('.training-goal-card');
 const replace=home.getByRole('button',{name:'Заменить',exact:true});
 const cancel=home.getByRole('button',{name:'Отменить',exact:true});
 const keep='Оставить как есть';
 const dialog=page.locator('.mk872-training-dialog'+(vue?'[data-v-app]':':not([data-v-app])')).getByRole('alertdialog');
 const picker=page.locator('.vue-report'+(vue?'[data-v-app]':':not([data-v-app])'));
 const snapshot=await readGoalState(page);

 await replace.press('Enter');
 await dialog.getByRole('heading',{name:'Заменить цель тренировки?'}).waitFor();
 const decline=dialog.getByRole('button',{name:keep,exact:true});
 assert(await decline.evaluate(button=>button===document.activeElement));
 await decline.press('Enter');
 assert(await replace.evaluate(button=>button===document.activeElement));
 assert.deepEqual(await readGoalState(page),snapshot);
 await page.reload();
 await replace.waitFor();
 assert.deepEqual(await readGoalState(page),snapshot);

 await replace.click();
 await dialog.getByRole('button',{name:'Выбрать новую цель',exact:true}).click();
 await picker.locator('.goal-option').first().waitFor();
 await picker.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 assert.deepEqual(await readGoalState(page),snapshot);

 await replace.click();
 await dialog.getByRole('button',{name:'Выбрать новую цель',exact:true}).click();
 await picker.locator('.goal-option').last().click();
 const replacement=await readGoalState(page);
 assert.notEqual(replacement.goal.goalId,snapshot.goal.goalId);
 assert.equal(replacement.goal.progress,0);
 assert.deepEqual(replacement,{...snapshot,goal:replacement.goal,serial:snapshot.serial+1});
 await page.reload();
 await cancel.waitFor();
 assert.deepEqual(await readGoalState(page),replacement);

 await cancel.click();
 await dialog.getByRole('heading',{name:'Отменить цель тренировки?'}).waitFor();
 await page.keyboard.press('Escape');
 assert(await cancel.evaluate(button=>button===document.activeElement));
 await page.reload();
 await cancel.waitFor();
 assert.deepEqual(await readGoalState(page),replacement);
 await cancel.click();
 await dialog.getByRole('button',{name:'Отменить цель',exact:true}).click();
 const choose=home.getByRole('button',{name:'Выбрать цель',exact:true});
 await choose.waitFor();
 await page.reload();
 await choose.waitFor();
 assert.deepEqual(await readGoalState(page),{...replacement,goal:null});
 console.log(vue?'PASS_GOAL_CONFIRMATIONS_OFFLINE':'PASS_GOAL_CONFIRMATIONS_FALLBACK',page.viewportSize().width);
}
async function checkTrainingPlan(page){
 await page.evaluate(()=>{
  mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME());
  const id=state.profileId,hit=teacherProfileById(id);
  hit.profile.activeTrainingPlan={planId:'vue-plan-fixture',items:[
   {itemId:'review-subtraction',type:'curriculum',targetId:'g4:moro_missing_sub',title:'Неизвестное уменьшаемое',status:'pending'},
   {itemId:'review-table',type:'curriculum',targetId:'g4:table',title:'Таблица умножения',status:'pending'},
  ]};
  trainingPlanPersistProfile(id);
  teacherUnlocked=true;
  openTrainingPlanEditor(id);
 });
 const plan=page.locator('#trainingPlanVue[data-v-app]');
 const items=plan.locator('.training-plan-item');
 await items.first().getByRole('button',{name:/Ниже/}).click();
 await items.first().getByRole('heading',{name:'Таблица умножения',exact:true}).waitFor();
 await items.first().getByRole('button',{name:/Ниже/}).click();
 await plan.getByRole('button',{name:'Начать тренировку',exact:true}).click();
 assert.equal(await items.last().getByRole('button',{name:'Начать',exact:true}).isEnabled(),false);
 await page.reload();
 await plan.getByRole('heading',{name:/План тренировки/,level:1}).waitFor();
 assert.equal(await plan.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
 await items.first().getByRole('button',{name:'Начать',exact:true}).click();
 const quiz=page.locator('#qstage[data-v-app]');
 const field=quiz.locator('#quizInput');
 const prompt=await quiz.locator('.quizq').innerText();
 const equation=/x − (\d+) = (\d+)/.exec(prompt);
 assert(equation,prompt);
 const correct=String(Number(equation[1])+Number(equation[2]));
 await field.fill(correct);
 await resume(page);
 assert.equal(await field.inputValue(),correct);
 await page.locator('.training-plan-modal-return[data-v-app]').getByRole('button',{name:/Вернуться к плану/}).waitFor();
 await field.press('Enter');
 await quiz.getByText(/✅ Верно/).waitFor();
 await quiz.getByRole('button',{name:/Следующий пример/}).click();
 for(let i=0;i<4;i++)await confirmSkip(page,quiz);
 await page.locator('.vue-report[data-v-app]').getByRole('heading',{name:/Тренировка завершена/}).waitFor();
 await page.getByRole('button',{name:/Вернуться к плану/}).click();
 await items.first().getByRole('button',{name:'Открыть снова',exact:true}).waitFor();
 assert.equal(await plan.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
 await page.reload();
 assert.equal(await plan.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
 assert(await items.last().getByRole('button',{name:'Начать',exact:true}).isEnabled());
 await plan.getByRole('button',{name:'← Главный экран',exact:true}).click();
 const home=page.locator('#homeDashboard[data-v-app]');
 await home.getByRole('button',{name:'Открыть план',exact:true}).waitFor();
 assert.match(await home.locator('.home-training-plan').innerText(),/Выполнено 1 из 2 блоков/);
}
async function seedQuickTrainingPlan(page){
 await page.evaluate(()=>{
  const plan={planId:'vue-quick-plan-fixture',items:[{
   itemId:'quick-multiply-three',type:'quick',trainerId:'multiplication',mode:'errors',
   selection:{tables:[3]},title:'Таблица на 3: ошибки',status:'pending'
  }]};
  state.activeTrainingPlan=plan;
  for(let factor=1;factor<=10;factor++)quickUpdateFactStats('multiplication',quickFactKey('multiplication',3,factor),false);
  save();
  mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME());
 });
}
async function checkQuickTrainingPlan(page){
 await seedQuickTrainingPlan(page);
 const home=page.locator('#homeDashboard[data-v-app]');
 const plan=page.locator('#trainingPlanVue[data-v-app]');
 const frame=page.locator('#quickTrainerFrame[data-v-app]');
 const stage=frame.locator('#quickStage[data-v-app]');
 const planReturn=frame.getByRole('button',{name:/Вернуться к плану/});
 const launch=plan.getByRole('button',{name:'Начать',exact:true});
 const start=stage.getByRole('button',{name:'Начать тренировку',exact:true});
 const exit=page.locator('.mk872-training-dialog[data-v-app]').getByRole('alertdialog',{name:'Выйти из тренировки?',exact:true});
 const progress=plan.getByRole('progressbar');
 await home.locator('.home-training-plan').getByRole('button',{name:/Открыть план/}).click();
 await launch.click();
 await frame.getByRole('heading',{name:'Таблица умножения',level:1}).waitFor();
 await page.reload();
 await planReturn.waitFor();
 assert.equal(await stage.locator('#quickSelectionText').textContent(),'3');
 assert.equal(await stage.locator('.quick-smart-row').getByRole('button',{name:/Ошибки/}).getAttribute('aria-pressed'),'true');
 await planReturn.click();
 await launch.click();
 await start.click();
 await frame.locator('#quickTopline').waitFor();
 assert.equal(await frame.locator('#quickRangeLabel').textContent(),'3 • Ошибки');
 const active=()=>page.evaluate(()=>[quickSession.recordId,quickQuestion.instanceId,state.coins,state.xp]);
 const beforeExit=await active();
 await planReturn.click();
 await exit.getByRole('button',{name:'Остаться в тренировке',exact:true}).click();
 assert.deepEqual(await active(),beforeExit);
 assert(await planReturn.evaluate(button=>button===document.activeElement));
 await planReturn.click();
 await exit.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
 await launch.waitFor();
 assert.equal(await progress.getAttribute('aria-valuenow'),'0');
 assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
 await launch.click();
 await start.click();
 for(let i=0;i<5;i++){
  const expected=await page.evaluate(()=>String(quickQuestion.correct));
  const prompt=await stage.locator('.quick-question').innerText();
  await stage.getByRole('button',{name:expected,exact:true}).press(i%2===0?'Space':'Enter');
  await stage.getByText(/✅ Верно!/).waitFor();
  if(i===0){
   const saved=await active();
   await resume(page);
   await planReturn.waitFor();
   assert.equal(await frame.locator('#quickRangeLabel').textContent(),'3 • Ошибки');
   assert.equal(await stage.locator('.quick-question').innerText(),prompt);
   await stage.getByText(/✅ Верно!/).waitFor();
   assert.deepEqual(await active(),saved);
  }
  if(i<4)await stage.getByRole('button',{name:/Следующий пример/}).press('Enter');
 }
 const [attempt]=await active();
 await stage.getByRole('button',{name:'Завершить тренировку',exact:true}).press('Enter');
 await stage.getByRole('heading',{name:'Тренировка завершена!',exact:true}).waitFor();
 assert.equal(await planReturn.count(),1);
 assert.equal(await stage.locator('.quick-summary-stat').first().innerText(),'5\nРешено');
 await planReturn.press('Space');
 await plan.getByRole('heading',{name:/План выполнен/}).waitFor();
 assert.equal(await progress.getAttribute('aria-valuenow'),'1');
 await page.reload();
 await plan.getByRole('heading',{name:/План выполнен/}).waitFor();
 assert.equal(await progress.getAttribute('aria-valuenow'),'1');
 assert.equal(await page.evaluate(()=>mk872ReadDraft()),null);
 assert.equal(await page.evaluate(id=>state.attemptHistory.filter(record=>record.id===id&&record.status==='finished'&&record.done===5).length,attempt),1);
 assert.deepEqual(await page.evaluate(id=>state.attemptHistory.find(record=>record.id===id).items.map(item=>[item.rewardXP,item.rewardCoins]),attempt),Array.from({length:5},()=>[3,1]));
 await plan.getByRole('button',{name:'← Главный экран',exact:true}).click();
 console.log('PASS_QUICK_FRAME_AND_PLAN_OFFLINE',page.viewportSize().width);
}
async function checkStudentProfiles(page){
 const original=await page.evaluate(()=>{
  const name=currentProfile;
  profiles['Скрытый тестовый профиль']={...EMPTY_STATE,developerTestProfile:true};
  return name;
 });
 const header=page.locator('#appHeader[data-v-app]');
 const profileButton=header.locator('.profile-pill');
 await profileButton.click();
 const view=page.locator('.vue-report[data-v-app]');
 const profiles=view.locator('.mk871-profiles-screen');
 await profiles.getByRole('heading',{name:/Профили учеников/}).waitFor();
 assert.equal(await profiles.getByText('Скрытый тестовый профиль',{exact:true}).count(),0);
 const nameField=profiles.getByRole('textbox',{name:'Имя ученика',exact:true});
 await nameField.fill('Ученик Vue');
 await nameField.press('Enter');
 await page.waitForFunction(()=>currentProfile==='Ученик Vue');
 const identity=await page.evaluate(()=>state.profileId);
 assert.equal(await header.locator('#playerName').innerText(),'Ученик Vue');
 await profileButton.click();
 await profiles.getByRole('button',{name:/Изменить имя/}).click();
 const editor=view.getByRole('textbox',{name:/Отображаемое имя/});
 await editor.fill('Ф');
 await editor.press('Enter');
 await view.getByRole('status').getByText(/минимум 2 видимых символа/).waitFor();
 await editor.fill('Ученик После F5');
 await view.getByRole('button',{name:'Синий',exact:true}).click();
 assert.equal(await view.locator('#mk854EditPreview .nick-blue').innerText(),'Ученик После F5');
 await editor.press('Enter');
 await profiles.locator('.profile-row.current').getByText('Ученик После F5',{exact:true}).waitFor();
 assert.equal(await header.locator('#playerName.nick-blue').innerText(),'Ученик После F5');
 await page.reload();
 const current=profiles.locator('.profile-row.current .nickname-style');
 assert.equal(await current.innerText(),'Ученик После F5');
 assert.match(await current.getAttribute('class'),/nick-blue/);
 assert.equal(await page.evaluate(()=>state.profileId),identity);
 assert.equal(await header.locator('#playerName.nick-blue').innerText(),'Ученик После F5');
 await profiles.locator('.profile-row').filter({hasText:original}).getByRole('button',{name:'Выбрать',exact:true}).click();
 assert.equal(await page.evaluate(()=>currentProfile),original);
 assert.equal(await header.locator('#playerName').innerText(),original);
 const resources=await page.evaluate(()=>[state.coins||0,state.streak||0,levelFor(state.xp||0)].map(String));
 for(const [index,id] of ['coins','streak','level'].entries())assert.equal(await header.locator('#'+id).textContent(),resources[index]);
 assert.equal(await header.locator('#mk872TopLevelProgress').getAttribute('aria-valuenow'),
  await page.evaluate(()=>String(Math.floor(mk872GetLevelProgress(state.xp).xpIntoLevel))));
}
async function checkLeaderboard(page){
 const expected=await page.evaluate(()=>{
  const fixtures=[
   ['Участник рейтинга А',1200,7,false,'blue'],
   ['Участник рейтинга Б',800,5,false,'default'],
   ['Скрытый лидер',99999,0,true,'default']
  ];
  for(const [name,xp,bestStreak,developerTestProfile,nicknameStyleId] of fixtures){
   profiles[name]=ensureProfileIdentity({...deepCopy(EMPTY_STATE),xp,bestStreak,developerTestProfile,nicknameStyleId});
  }
  persistSilently();
  openLeaderboard();
  return fixtures.slice(0,2).map(([name,xp])=>({name,xp,level:levelFor(xp)}));
 });
 const table=page.locator('#modal .vue-report[data-v-app] .leader-table');
 async function checkRows(){
  await table.waitFor();
  assert.equal(await table.getByText('Скрытый лидер',{exact:true}).count(),0);
  for(const {name,xp,level} of expected){
   const row=table.locator('tbody tr').filter({has:page.getByText(name,{exact:true})});
   assert.equal(await row.locator('td').nth(3).innerText(),String(xp));
   assert.equal(await row.locator('.leader-mobile-level').textContent(),'ур. '+level);
  }
  const names=await table.locator('.leader-identity .nickname-style').allTextContents();
  assert(names.indexOf(expected[0].name)<names.indexOf(expected[1].name));
  assert.equal(await table.locator('.nick-blue').filter({hasText:expected[0].name}).count(),1);
 }
 await checkRows();
 if(page.viewportSize().width<500){
  assert(await table.locator('.leader-mobile-level').first().isVisible());
  await page.locator('#modal .mk-ux99-scroll-hint').waitFor();
 }
 await page.reload();
 await checkRows();
 await page.evaluate(()=>closeModal());
}
async function checkAchievementCatalog(page){
 const fixture=await page.evaluate(()=>{
  const name=currentProfile;
  profiles[name]={...state};
  currentProfile='Ученик для достижений';
  state=ensureProfileIdentity({...deepCopy(EMPTY_STATE),solved:10});
  const before=state.coins;
  persistSilently();
  openShop('achievements');
  const a=ACHIEVEMENTS.find(item=>item.id==='solved10');
  return {name,before,title:a.title,coins:a.reward.coins};
 });
 const screen=page.locator('#modal .achievement-screen[data-v-app]');
 const cards=screen.locator('.achievement-card');
 const card=cards.filter({has:page.getByText(fixture.title,{exact:true})});
 await card.locator('.achievement-status.done').waitFor();
 const receipt=await page.evaluate(()=>({coins:state.coins,unlock:achievementUnlockView(state).solved10}));
 assert.equal(receipt.coins,fixture.before+fixture.coins);
 assert(receipt.unlock.rewardGranted);
 const opened=screen.getByRole('button',{name:'Открытые',exact:true});
 await opened.click();
 assert.equal(await opened.evaluate(element=>element===document.activeElement),true);
 assert.equal(await screen.locator('.achievement-card:not(.done)').count(),0);
 await screen.getByRole('button',{name:'Не открытые',exact:true}).click();
 assert.equal(await cards.locator('.achievement-status.done').count(),0);
 await screen.getByRole('combobox',{name:'Категория достижений'}).selectOption('general');
 await screen.getByRole('combobox',{name:'Сортировка достижений'}).selectOption('nearest');
 assert.equal(await screen.locator('.achievement-category').count(),0);
 await screen.getByRole('button',{name:'Все',exact:true}).click();
 await card.waitFor();
 await page.reload();
 await card.locator('.achievement-status.done').waitFor();
 assert.deepEqual(await page.evaluate(()=>({coins:state.coins,unlock:achievementUnlockView(state).solved10})),receipt);
 await page.evaluate(name=>{
  currentProfile=name;
  state={...EMPTY_STATE,...profiles[name]};
  persistSilently();
  closeModal();
 },fixture.name);
}
async function checkBackupDialogs(page){
 const before=await page.evaluate(()=>{
  openDataManager();
  return {name:currentProfile,id:state.profileId,total:Object.keys(profiles).length,coins:state.coins,solved:state.solved};
 });
 const view=page.locator('#modal .vue-report[data-v-app]');
 const input=view.locator('#backupFileInput');
 const replace=view.getByRole('button',{name:'Заменить всё',exact:true});
 const merge=view.getByRole('button',{name:'Умно объединить',exact:true});
 const upload=(name,data)=>input.setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 async function download(label){
  const downloadEvent=page.waitForEvent('download');
  await view.getByRole('button',{name:label}).click();
  return JSON.parse(readFileSync(await (await downloadEvent).path(),'utf8'));
 }
 const single=await download(/Скачать текущего ученика/);
 assert.deepEqual(Object.keys(single.profiles),[before.name]);
 assert.equal(single.profiles[before.name].profileId,before.id);
 assert.equal(single.profiles[before.name].coins,before.coins);
 assert.equal(single.profiles[before.name].solved,before.solved);
 await view.getByRole('status').getByText(/Последняя копия/).waitFor();
 const full=await download(/Скачать полную копию/);
 assert.equal(Object.keys(full.profiles).length,before.total);
 assert.equal(full.scope,'all');
 await upload('повреждённый.json',{...single,profiles:{[before.name]:null}});
 await view.getByRole('alert').getByText(/повреждён один из профилей/).waitFor();
 await view.getByRole('button',{name:/Назад/}).click();
 await upload('копия.json',single);
 await view.getByRole('heading',{name:/Предпросмотр умного импорта/}).waitFor();
 await replace.click();
 await view.getByRole('heading',{name:/Заменить все данные/}).waitFor();
 await view.getByRole('button',{name:'Отмена',exact:true}).click();
 await merge.click();
 await view.getByRole('heading',{name:/Данные уже актуальны/}).waitFor();
 const preserved=()=>page.evaluate(()=>({name:currentProfile,id:state.profileId,total:Object.keys(profiles).length,coins:state.coins,solved:state.solved}));
 assert.deepEqual(await preserved(),before);
 await view.getByRole('button',{name:/Данные/}).click();
 const differentId=await page.evaluate(()=>newProfileId());
 const conflict={...single,profiles:{[before.name]:{...single.profiles[before.name],profileId:differentId}}};
 await upload('совпадение-имени.json',conflict);
 await merge.click();
 await view.getByRole('heading',{name:/Совпадение профиля 1\/1/}).waitFor();
 await view.getByRole('button',{name:'Пропустить',exact:true}).click();
 await view.getByText('Пропущено профилей:',{exact:false}).waitFor();
 assert.deepEqual(await preserved(),before);

 await view.getByRole('button',{name:/Данные/}).click();
 await upload('полная-копия.json',full);
 await replace.click();
 await view.getByRole('button',{name:'Да, восстановить копию',exact:true}).click();
 await view.getByRole('heading',{name:/Профили учеников/}).waitFor();
 await page.reload();
 assert.deepEqual(await preserved(),before);
 await page.evaluate(()=>closeModal());
}
async function checkTeacherReview(page,fixture){
 const topics=await page.evaluate(({ada,boris})=>{
  const target=profiles[boris],others=profiles[ada];
  const entry=(profile,topic,index,{corrected=false,resolved=false}={})=>{
   const at=Date.now()-index*60000;
   profile.attemptHistory.push({id:newAttemptId(),key:topic.key,topicId:topic.topicId,grade:topic.grade,stageIndex:0,
    kind:topic.kind,status:'finished',startedAt:at-1000,endedAt:at,total:1,done:1,correct:Number(corrected),
    items:[{itemId:newAttemptItemId(),kind:topic.kind,topicId:topic.topicId,grade:topic.grade,
     prompt:'Проверка отчёта '+index,finalCorrect:corrected,firstTry:false,skipped:false,startedAt:at-1000,endedAt:at,
     ...(resolved?{remediation:{resolved:true,resolvedAt:at}}:{})} ]});
  };
  const firstTopic=grade=>teacherGradeTopicKeys(grade).map(analyticsTopicMeta).find(topic=>topic?.implemented!==false&&topic?.key);
  const g1=firstTopic(1),g2=firstTopic(2),g6=firstTopic(6);
  for(const index of [6,7,8])entry(target,g1,index);
  entry(target,g2,9,{corrected:true});
  entry(target,g2,10,{resolved:true});
  entry(others,g6,11);
  return {g1,g2,g6,adaId:others.profileId,saved:JSON.stringify(target.attemptHistory)};
 },fixture);
 const detail=page.locator('#teacherStudentVue[data-v-app]');
 const weak=page.locator('#teacherWeakTopicsVue[data-v-app]');
 const errors=page.locator('#teacherErrorsVue[data-v-app]');
 const dialog=page.locator('#overlay.show .vue-report[data-v-app]');
 const value=(view,id)=>view.locator('[data-teacher-review-stat="'+id+'"] b').innerText();
 const metric=label=>dialog.locator('.review-stat').filter({has:page.getByText(label,{exact:true})}).locator('b').innerText();
 const back=(view,name)=>view.getByRole('button',{name:'← '+name,exact:true}).click();
 await detail.getByRole('button',{name:'🎯 Слабые темы',exact:true}).click();
 await weak.getByRole('heading',{name:'🎯 Слабые темы — '+fixture.boris,exact:true}).waitFor();
 assert.equal(await value(weak,'weak'),'1');
 assert.equal(await value(weak,'active'),'5');
 assert.equal(await weak.locator('.weak-card').first().getAttribute('data-teacher-topic'),topics.g1.key);
 const opener=weak.locator('[data-teacher-topic="'+topics.g1.key+'"]').getByRole('button',{name:'Подробнее'});
 await opener.click();
 await dialog.getByRole('heading',{name:topics.g1.title,exact:true}).waitFor();
 await dialog.getByText('Ученик: '+fixture.boris,{exact:true}).waitFor();
 assert.equal(await metric('Неверно'),'3');
 assert.equal(await metric('Активных ошибок'),'3');
 await page.keyboard.press('Escape');
 await dialog.waitFor({state:'hidden'});
 assert(await opener.evaluate(element=>element===document.activeElement));
 await back(weak,fixture.boris);

 await detail.getByRole('button',{name:'Посмотреть ошибки',exact:true}).click();
 await errors.getByRole('heading',{name:'🧠 Работа над ошибками — '+fixture.boris,exact:true}).waitFor();
 for(const [id,count] of Object.entries({active:5,resolved:1,g1:3,g2:1,g4:1,g6:0})){
  assert.equal(await value(errors,id),String(count));
 }
 assert.equal(await errors.locator('[data-teacher-error-topic="'+topics.g6.key+'"]').count(),0);
 const group=errors.locator('[data-teacher-error-topic="'+topics.g2.key+'"]');
 await group.getByText(/Активных: 1 • отработано: 1/).waitFor();
 await group.getByRole('button',{name:'Подробнее'}).click();
 await dialog.getByRole('heading',{name:topics.g2.title,exact:true}).waitFor();
 assert.equal(await metric('Исправлено'),'1');
 assert.equal(await metric('Отработано ошибок'),'1');
 await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 await back(errors,fixture.boris);
 await detail.getByRole('heading',{name:fixture.boris,exact:true}).waitFor();
 assert.equal(await page.evaluate(name=>JSON.stringify(profiles[name].attemptHistory),fixture.boris),topics.saved);

 await page.evaluate(id=>openTeacherStudentDetailById(id),topics.adaId);
 await detail.getByRole('button',{name:'🧠 Ошибки',exact:true}).click();
 await errors.getByRole('heading',{name:'🧠 Работа над ошибками — '+fixture.ada,exact:true}).waitFor();
 assert.equal(await value(errors,'active'),'1');
 assert.equal(await value(errors,'g1'),'0');
 assert.equal(await value(errors,'g6'),'1');
 await back(errors,fixture.ada);
 await detail.getByRole('heading',{name:fixture.ada,exact:true}).waitFor();
 assert.deepEqual(await page.evaluate(()=>({name:currentProfile,id:state.profileId})),fixture.identity);
 console.log('PASS_TEACHER_REVIEW',page.viewportSize().width);
}
async function checkTeacherMilestones(page,fixture){
 const cases=await page.evaluate(({ada,boris})=>{
  return [ada,boris].map((name,index)=>{
   const profile=profiles[name],grade=index?5:1,correct=index?2:1,total=correct+1;
   const endedAt=Date.now()-(index?0:45*86400000),startedAt=endedAt-3000;
   const title='Контрольная работа — '+name;
   profile.attemptHistory.push({id:newAttemptId(),title,grade,controlGradeChoice:grade,
    kind:'controlreview',status:'finished',startedAt,endedAt,total,done:total,correct,
    items:Array.from({length:total},(_,item)=>({
     itemId:newAttemptItemId(),kind:'quiz',grade,prompt:title,finalCorrect:item<correct,
     firstTry:item<correct,skipped:false,startedAt,endedAt
    }))});
   const achievement=ACHIEVEMENTS[index];
   profile.achievementUnlocks={[achievement.id]:{unlockedAt:endedAt,rewardGranted:true}};
   profile.quests={active:index?[{status:'active'},{status:'active'}]:[{status:'active'},{status:'completed',claimed:false}]};
   return {id:profile.profileId,name,grade,title,score:correct+'/'+total,
    achievement:achievement.title,quests:index?['2','0']:['1','1']};
  });
 },fixture);
 const detail=page.locator('#teacherStudentVue[data-v-app]');
 const courses=detail.locator('[data-teacher-course-grade]');
 const course=grade=>detail.locator('[data-teacher-course-grade="'+grade+'"]');
 const milestones=detail.locator('[data-teacher-milestone]');
 const control=detail.locator('[data-teacher-milestone="control"]');
 const achievements=detail.locator('[data-teacher-milestone="achievements"]');
 const quests=detail.locator('[data-teacher-milestone="quests"]');
 const works=detail.locator('.teacher-panel').filter({has:page.getByRole('heading',{name:/Последние школьные работы/})});
 const responses=detail.locator('.teacher-panel').filter({has:page.getByRole('heading',{name:'Статистика ответов по школьным заданиям'})});
 const responseCount=async()=>{
  const values=await responses.locator('.teacher-kpi b').allTextContents();
  return values.reduce((total,value)=>total+Number(value),0);
 };
 const setPeriod=async name=>{
  const button=detail.getByRole('button',{name,exact:true});
  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'),'true');
 };
 const questStates=()=>page.evaluate(names=>names.map(name=>JSON.stringify(profiles[name].quests)),[fixture.ada,fixture.boris]);
 const originalQuests=await questStates();
 for(const [index,student] of cases.entries()){
  await page.evaluate(id=>openTeacherStudentDetailById(id),student.id);
  await detail.getByRole('heading',{name:student.name,exact:true}).waitFor();
  await setPeriod('Сегодня');
  assert.deepEqual(await courses.evaluateAll(cards=>cards.map(card=>Number(card.dataset.teacherCourseGrade))),[1,2,3,4,5,6,7,8]);
  for(const grade of index?[5]:[1,2]){
   assert.match(await course(grade).locator('[data-teacher-course-status]').innerText(),/^\d+%$/);
   assert(Number(await course(grade).getByRole('progressbar').getAttribute('aria-valuenow'))>0);
  }
  const unused=course(index?6:5);
  assert.equal(await unused.locator('[data-teacher-course-status]').innerText(),'Не начат');
  assert.equal(await unused.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
  if(index)assert.equal(await course(1).locator('[data-teacher-course-status]').innerText(),'0%');
  await course(5).getByText('Обыкновенные дроби',{exact:true}).waitFor();
  assert.equal(await control.locator('.teacher-section-row b').innerText(),student.score);
  assert.match(await control.innerText(),new RegExp(student.grade+' класс'));
  await achievements.getByText(student.achievement,{exact:true}).waitFor();
  assert.equal(await achievements.getByText(cases[1-index].achievement,{exact:true}).count(),0);
  assert.deepEqual(await quests.locator('.teacher-kpi b').allTextContents(),student.quests);
  assert.equal(await works.getByText(student.title,{exact:true}).count(),index);
  const progressBefore=await courses.allTextContents(),milestonesBefore=await milestones.allTextContents();
  const todayResponses=await responseCount();
  await setPeriod('Всё время');
  await works.getByText(student.title,{exact:true}).waitFor();
  assert(await responseCount()>todayResponses);
  assert.equal(await works.getByText(cases[1-index].title,{exact:true}).count(),0);
  assert.deepEqual(await courses.allTextContents(),progressBefore);
  assert.deepEqual(await milestones.allTextContents(),milestonesBefore);
 }
 assert.deepEqual(await questStates(),originalQuests);
 console.log('PASS_TEACHER_MILESTONES',page.viewportSize().width);
}
async function checkTeacherDashboard(page){
 const fixture=await page.evaluate(()=>{
  const ada='Ветка Vue Ада',boris='Ветка Vue Борис';
  const identity={name:currentProfile,id:state.profileId};
  const first=ensureProfileIdentity({...deepCopy(EMPTY_STATE),xp:274});
  const second=ensureProfileIdentity({...deepCopy(EMPTY_STATE),xp:430});
  for(const grade of [1,2]){
   const key=teacherGradeTopicKeys(grade).find(key=>analyticsTopicMeta(key)?.implemented!==false);
   first.courseProgress[key]={best:STAGES.map(stage=>stage.need)};
  }
  second.courseProgress['g5:area_units_g5']={best:STAGES.map(stage=>stage.need)};
  const key='g4:moro_missing_sub',topic=analyticsTopicMeta(key),now=Date.now()-120000;
  const title='Попытка Бориса для журнала';
  second.attemptHistory=[{id:newAttemptId(),title,key,topicId:topic.topicId,grade:4,stageIndex:0,
   kind:topic.kind,status:'finished',startedAt:now-5000,endedAt:now,total:1,done:1,correct:0,
   items:[{itemId:newAttemptItemId(),kind:topic.kind,topicId:topic.topicId,grade:4,prompt:'Задание Бориса',
    finalCorrect:false,firstTry:false,skipped:false,startedAt:now-5000,endedAt:now}]}];
  const customDay=new Date();
  customDay.setDate(customDay.getDate()-2);
  const customDate=reportDateInputValue(customDay);
  const customWorks=['Упражнение в начале дня','Упражнение в конце дня'];
  const times=[reportLocalDateMs(customDate),reportLocalDateMs(customDate,true)];
  for(const [index,endedAt] of times.entries()){
   const startedAt=endedAt-500;
   second.attemptHistory.push({id:newAttemptId(),title:customWorks[index],key,topicId:topic.topicId,grade:4,stageIndex:0,
    kind:topic.kind,status:'finished',startedAt,endedAt,total:1,done:1,correct:1,
    items:[{itemId:newAttemptItemId(),kind:topic.kind,topicId:topic.topicId,grade:4,prompt:customWorks[index],
     finalCorrect:true,firstTry:true,skipped:false,startedAt,endedAt}]});
  }
  profiles[ada]=first;
  profiles[boris]=second;
  openTeacherDashboard();
  return {ada,boris,id:second.profileId,title,identity,customDate,customWorks,today:reportDateInputValue(new Date())};
 });
 const roster=page.locator('#teacherDashboardVue[data-v-app]');
 const search=roster.getByRole('searchbox',{name:'Найти ученика'});
 const sorting=roster.getByRole('combobox',{name:'Сортировать учеников'});
 const cards=roster.locator('.teacher-student-card'),names=()=>cards.locator('h3').allTextContents();
 await search.fill('ВЕТКА  UE');
 await search.press('Home');
 for(let i=0;i<6;i++)await search.press('ArrowRight');
 await search.press('V');
 assert.equal(await search.inputValue(),'ВЕТКА V UE');
 assert.equal(await search.evaluate(input=>input===document.activeElement&&input.selectionStart===7),true);
 await roster.getByRole('status').getByText('По выбранному фильтру учеников нет.').waitFor();
 await search.fill('ветка vue');
 await sorting.selectOption('name');
 assert.deepEqual(await names(),[fixture.ada,fixture.boris]);
 const grades=cards.first().locator('.teacher-progress-lines > .teacher-progress-line');
 assert.equal(await grades.count(),8);
 assert.deepEqual(await grades.locator(':scope > span').evaluateAll(labels=>labels.map(label=>label.lastChild.textContent.trim())),
  [1,2,3,4,5,6,7,8].map(grade=>grade+' класс'));
 for(const grade of [1,2,5]){
  const filter=roster.getByRole('button',{name:grade+' класс',exact:true});
  await filter.click();
  assert.equal(await filter.getAttribute('aria-pressed'),'true');
  assert.deepEqual(await names(),[grade===5?fixture.boris:fixture.ada]);
 }
 await roster.getByRole('button',{name:'Есть ошибки',exact:true}).click();
 assert.deepEqual(await names(),[fixture.boris]);
 await roster.getByRole('button',{name:'5 класс',exact:true}).click();
 await cards.getByRole('button',{name:'Открыть',exact:true}).click();
 const detail=page.locator('#teacherStudentVue[data-v-app]');
 await detail.getByRole('heading',{name:fixture.boris,exact:true}).waitFor();
 assert.equal(await detail.locator('.teacher-detail-grid [data-teacher-course-g1]').count(),1);
 assert.equal(await detail.locator('.teacher-detail-grid [data-teacher-course-g2]').count(),1);
 assert.equal(await page.evaluate(()=>teacherViewingProfileId),fixture.id);
 const period=detail.getByRole('button',{name:'7 дней',exact:true});
 await period.click();
 assert.equal(await period.getAttribute('aria-pressed'),'true');
 assert.equal(await period.evaluate(button=>button===document.activeElement),true);
 await detail.getByText(fixture.title,{exact:true}).waitFor();
 await detail.getByRole('button',{name:'📋 Журнал',exact:true}).click();
 const dialog=page.locator('#modal .vue-report[data-v-app]');
 await dialog.getByRole('heading',{name:'📋 Журнал попыток — '+fixture.boris,exact:true}).waitFor();
 await dialog.getByRole('button',{name:new RegExp(fixture.title)}).click();
 await dialog.getByText('Задание Бориса',{exact:true}).waitFor();
 await dialog.getByRole('button',{name:'← К журналу',exact:true}).click();
 await dialog.getByRole('button',{name:'← К ученику',exact:true}).click();
 await detail.getByRole('heading',{name:fixture.boris,exact:true}).waitFor();
 await detail.getByRole('button',{name:'📄 Отчёт',exact:true}).click();
 const report=page.locator('#teacherStudentReportVue[data-v-app] .student-report-screen');
 await report.getByRole('heading',{name:'Отчёт об учебном прогрессе'}).waitFor();
 assert.equal(await report.locator('.report-student-name').innerText(),'Ученик: '+fixture.boris);
 const gradesInOrder=['1','2','3','4','5','6','7','8'];
 assert.deepEqual(await report.locator('[data-report-course]').evaluateAll(cards=>cards.map(card=>card.dataset.reportCourse)),gradesInOrder);
 assert.deepEqual(await report.locator('[data-report-knowledge]').evaluateAll(cards=>cards.map(card=>card.dataset.reportKnowledge)),gradesInOrder);
 assert.equal(await report.getByText(fixture.ada,{exact:false}).count(),0);
 await report.getByRole('button',{name:'7 дней',exact:true}).click();
 await report.getByText(fixture.title,{exact:true}).waitFor();
 const periodLabel=report.locator('[data-report-period]');
 const previous=await periodLabel.innerText();
 const from=report.getByLabel('Начало периода'),to=report.getByLabel('Конец периода');
 const apply=report.getByRole('button',{name:'Свой период',exact:true});
 await from.fill('');
 await apply.click();
 await report.getByRole('alert').getByText('Укажите обе даты собственного периода.').waitFor();
 await from.fill(fixture.today);
 await to.fill(fixture.customDate);
 await apply.click();
 await report.getByRole('alert').getByText('Дата начала не может быть позже даты окончания.').waitFor();
 assert.equal(await periodLabel.innerText(),previous);
 assert.equal(await report.getByRole('button',{name:'7 дней',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await report.locator('[data-report-metric="attempted"] b').innerText(),'3');
 await from.fill(fixture.customDate);
 await apply.click();
 const expectedDate=fixture.customDate.split('-').reverse().join('.');
 assert.equal(await periodLabel.innerText(),expectedDate+' — '+expectedDate);
 assert.equal(await apply.getAttribute('aria-pressed'),'true');
 assert.equal(await report.getByRole('alert').innerText(),'');
 assert.equal(await report.locator('[data-report-metric="attempted"] b').innerText(),'2');
 const works=report.locator('[data-report-section="works"]');
 assert.equal(await works.getByText(fixture.title,{exact:true}).count(),0);
 for(const title of fixture.customWorks)await works.getByText(title,{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>Number.isNaN(reportLocalDateMs('2026-02-30'))),true);
 await page.evaluate(()=>{
  window.print=()=>{
   window.teacherTestPrintTitle=document.title;
   window.dispatchEvent(new Event('afterprint'));
  };
 });
 await report.getByRole('button',{name:/Печать \/ PDF/}).click();
 assert.match(await page.evaluate(()=>window.teacherTestPrintTitle),new RegExp(fixture.boris));
 const pdf=await page.pdf({preferCSSPageSize:true});
 assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
 assert(pdf.length>10000);
 await report.getByRole('button',{name:'← К ученику',exact:true}).first().click();
 await detail.getByRole('heading',{name:fixture.boris,exact:true}).waitFor();
 await detail.getByRole('button',{name:'📊 Карта знаний',exact:true}).click();
 await page.locator('#knowledgeMapVue[data-v-app]').getByText(fixture.boris,{exact:false}).first().waitFor();
 await page.locator('#knowledgeMapVue[data-v-app] .home-back-btn').click();
 await detail.getByRole('heading',{name:fixture.boris,exact:true}).waitFor();
 await checkTeacherReview(page,fixture);
 await checkTeacherMilestones(page,fixture);
 await detail.getByRole('button',{name:'← Все ученики',exact:true}).click();
 await search.waitFor();
 assert.equal(await search.inputValue(),'ветка vue');
 assert.equal(await sorting.inputValue(),'name');
 assert.equal(await roster.getByRole('button',{name:'5 класс',exact:true}).getAttribute('aria-pressed'),'true');
 assert.deepEqual(await names(),[fixture.boris]);
 assert.deepEqual(await page.evaluate(()=>({name:currentProfile,id:state.profileId})),fixture.identity);
 await page.evaluate(({ada,boris})=>{delete profiles[ada];delete profiles[boris]},fixture);
 console.log('PASS_TEACHER_DASHBOARD',page.viewportSize().width);
}
async function checkTeacherReportRestoration(page){
 const fixture=await page.evaluate(()=>{
  openTeacherStudentReport(state.profileId);
  return {id:state.profileId,name:currentProfile};
 });
 const report=page.locator('#teacherStudentReportVue[data-v-app]');
 const title=report.getByRole('heading',{name:'Отчёт об учебном прогрессе'});
 const pin=page.locator('#modal .vue-report[data-v-app]').getByLabel('PIN преподавателя',{exact:true});
 const periodLabel=report.locator('[data-report-period]');
 const from=report.getByLabel('Начало периода'),to=report.getByLabel('Конец периода');
 await title.waitFor();
 await from.fill('2026-11-05');await to.fill('2026-11-12');
 await report.getByRole('button',{name:'Свой период',exact:true}).click();
 await periodLabel.getByText('05.11.2026 — 12.11.2026',{exact:true}).waitFor();
 // An unfinished edit must not replace the applied period after reload.
 await from.fill('2026-11-08');
 await page.reload();
 await pin.waitFor();
 assert.equal(await page.evaluate(()=>teacherUnlocked),false);
 assert.equal(await title.count(),0);
 await pin.fill('4817');await pin.press('Enter');
 await title.waitFor();
 assert.equal(await report.locator('.report-student-name').innerText(),'Ученик: '+fixture.name);
 assert.equal(await page.evaluate(()=>teacherViewingProfileId),fixture.id);
 assert.equal(await from.inputValue(),'2026-11-05');
 assert.equal(await periodLabel.innerText(),'05.11.2026 — 12.11.2026');
 await report.getByRole('button',{name:'← К ученику',exact:true}).first().click();
 await page.locator('#teacherStudentVue[data-v-app]').getByRole('heading',{name:fixture.name,exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>mk854Route().screen),'home');
 console.log('PASS_TEACHER_REPORT_PERIOD_AFTER_OFFLINE_RELOAD',page.viewportSize().width);
}
async function checkMissingStudentReport(page){
 const report=page.locator('#teacherStudentReportVue[data-v-app]');
 const missing=report.getByRole('heading',{name:'Ученик не найден',exact:true});
 const roster=page.locator('#teacherDashboardVue[data-v-app]');
 const login=page.locator('#modal .vue-report[data-v-app]').getByLabel('PIN преподавателя',{exact:true});
 const identity=await page.evaluate(()=>{
  const name='Ученик для проверки отчёта',profile=ensureProfileIdentity(deepCopy(EMPTY_STATE));
  profiles[name]=profile;
  openTeacherStudentReport(profile.profileId);
  return {name,active:currentProfile,id:state.profileId,coins:state.coins};
 });
 await report.getByRole('heading',{name:'Отчёт об учебном прогрессе'}).waitFor();
 await page.evaluate(name=>{delete profiles[name]},identity.name);
 await report.getByRole('button',{name:/Печать \/ PDF/}).click();
 await missing.waitFor();
 assert.equal(await report.getByRole('button',{name:/Печать \/ PDF/}).count(),0);
 assert.equal(await report.getByText(identity.name).count(),0);
 await page.reload();
 await login.waitFor();
 assert.equal(await page.evaluate(()=>teacherUnlocked),false);
 assert.equal(await missing.count(),0);
 await login.fill('4817');
 await login.press('Enter');
 await missing.waitFor();
 await report.getByRole('button',{name:'К списку учеников',exact:true}).press('Enter');
 await roster.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
 assert.equal(await roster.getByText(identity.name).count(),0);
 assert.equal(await page.evaluate(()=>mk854Route().screen),'home');
 assert.deepEqual(await page.evaluate(()=>[currentProfile,state.profileId,state.coins]),[identity.active,identity.id,identity.coins]);
 await page.evaluate(()=>openTeacherStudentReport('removed-profile-id'));
 await missing.waitFor();
 await report.getByRole('button',{name:'К списку учеников',exact:true}).click();
 await roster.waitFor();
 console.log('PASS_MISSING_STUDENT_REPORT_OFFLINE',page.viewportSize().width);
}
async function checkTeacherPinDialog(page){
 const initial=await page.evaluate(()=>{
  openTeacherEntry();
  return {name:currentProfile,id:state.profileId,total:Object.keys(profiles).length};
 });
 const view=page.locator('#modal .vue-report[data-v-app] .teacher-pin-card');
 const newPin=view.getByLabel('Новый PIN',{exact:true});
 const confirm=view.getByLabel('Повторите PIN',{exact:true});
 await newPin.waitFor();
 assert.equal(await newPin.getAttribute('type'),'password');
 assert.equal(await confirm.getAttribute('type'),'password');
 await newPin.fill('48');
 await newPin.press('Enter');
 assert.equal(await confirm.evaluate(input=>input===document.activeElement),true);
 await confirm.fill('4817');
 await confirm.press('Enter');
 await view.getByRole('alert').getByText(/PIN должен содержать 4/).waitFor();
 await newPin.fill('4817');
 await confirm.fill('4816');
 await confirm.press('Enter');
 await view.getByRole('alert').getByText('PIN-коды не совпадают.',{exact:true}).waitFor();
 await confirm.fill('4817');
 await confirm.press('Enter');
 const dashboard=page.getByRole('heading',{name:/Панель преподавателя/});
 await dashboard.waitFor();
 await page.reload();
 assert.equal(await dashboard.count(),0);
 await page.evaluate(()=>openTeacherEntry());
 const login=view.getByLabel('PIN преподавателя',{exact:true});
 assert.equal(await login.getAttribute('type'),'password');
 await login.fill('4816');
 await login.press('Enter');
 await view.getByRole('alert').getByText('Неверный PIN.',{exact:true}).waitFor();
 assert.equal(await login.inputValue(),'');
 await login.fill('4817');
 await login.press('Enter');
 await dashboard.waitFor();
 await checkTeacherReportRestoration(page);
 await checkMissingStudentReport(page);
 await checkTeacherDashboard(page);
 await page.getByRole('button',{name:/Закрыть режим преподавателя/}).click();
 await page.evaluate(()=>openTeacherEntry());
 await view.getByRole('button',{name:'Забыли PIN?',exact:true}).click();
 const reset=view.getByLabel('Подтверждение сброса PIN',{exact:true});
 await reset.fill('СБРОС');
 await reset.press('Enter');
 await view.getByRole('alert').getByText('Введите слово СБРОСИТЬ полностью.',{exact:true}).waitFor();
 await reset.fill('сбросить');
 await reset.press('Enter');
 await newPin.waitFor();
 assert.deepEqual(await page.evaluate(()=>({name:currentProfile,id:state.profileId,total:Object.keys(profiles).length})),initial);
 await view.getByRole('button',{name:'Отмена',exact:true}).click();
}
async function checkTeacherPinFallback(browser,address){
 const ctx=await browser.newContext({serviceWorkers:'block'});
 const page=await ctx.newPage();
 let abortImport;
 const importing=new Promise(resolve=>{abortImport=resolve});
 let allowAbort;
 const mayAbort=new Promise(resolve=>{allowAbort=resolve});
 await page.route(url=>url.pathname.endsWith('/assets/ui/knowledge-map.js'), async route=>{
  abortImport();
  await mayAbort;
  await route.abort();
 });
 try{
  await page.goto(address,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>openTeacherEntry());
  await importing;
  const first=page.locator('#teacherPinNew'),confirm=page.locator('#teacherPinConfirm');
  await first.fill('4817');
  await confirm.fill('4817');
  allowAbort();
  await page.waitForFunction(()=>knowledgeMapModule===null);
  assert.equal(await first.inputValue(),'4817');
  assert.equal(await confirm.inputValue(),'4817');
  await confirm.press('Enter');
  await page.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
  const fallback=page.locator('#teacherDashboardVue:not([data-v-app])');
  const search=fallback.getByRole('searchbox',{name:'Найти ученика'});
  await search.fill('Несуществующий ученик');
  await fallback.getByRole('status').getByText(/учеников нет/).waitFor();
  assert.equal(await search.evaluate(input=>input===document.activeElement),true);
  await search.fill('');
  await fallback.getByRole('button',{name:'Открыть',exact:true}).first().click();
  const detail=page.locator('#teacherStudentVue:not([data-v-app])');
  assert.equal(await detail.locator('[data-teacher-course-grade]').count(),8);
  assert.equal(await detail.locator('[data-teacher-milestone]').count(),3);
  await detail.getByRole('button',{name:'📄 Отчёт',exact:true}).click();
  await page.getByRole('heading',{name:'Отчёт об учебном прогрессе'}).waitFor();
  const report=page.locator('#teacherStudentReportVue:not([data-v-app]) .student-report-screen');
  const day=await page.evaluate(()=>reportDateInputValue(new Date()));
  await report.getByLabel('Начало периода').fill(day);
  await report.getByLabel('Конец периода').fill(day);
  await report.getByRole('button',{name:'Свой период',exact:true}).click();
  await report.getByRole('button',{name:'Свой период',exact:true}).and(report.locator('[aria-pressed="true"]')).waitFor();
  assert.equal(await report.locator('[data-report-course]').count(),8);
  await report.getByRole('button',{name:'← К ученику',exact:true}).first().click();
  await detail.getByRole('button',{name:'🎯 Слабые темы',exact:true}).click();
  const topics=page.locator('#teacherWeakTopicsVue:not([data-v-app])');
  await topics.getByRole('button',{name:'Подробнее',exact:true}).first().click();
  await page.locator('#overlay.show .vue-report:not([data-v-app])').getByRole('button',{name:'Закрыть',exact:true}).click();
  await topics.locator('.home-back-btn').click();
  await detail.getByRole('button',{name:'🧠 Ошибки',exact:true}).click();
  const errors=page.locator('#teacherErrorsVue:not([data-v-app])');
  await errors.getByRole('status').getByText(/Ошибок в сохранённой истории нет/).waitFor();
  await errors.locator('.home-back-btn').click();
  await detail.getByRole('button',{name:'📄 Отчёт',exact:true}).waitFor();
  assert.equal(await detail.locator('[data-teacher-analytics-stat="weakTopics"] b').innerText(),'0');
  await detail.getByRole('button',{name:'Собрать план тренировки',exact:true}).click();
  const editor=page.locator('#trainingPlanVue:not([data-v-app])');
  await editor.getByRole('heading',{name:/План тренировки/}).waitFor();
  await editor.locator('.home-back-btn').click();
  await detail.getByRole('button',{name:'Открыть план',exact:true}).waitFor();
  const temp='Профиль для проверки удаления';
  const id=await page.evaluate(name=>{
   const profile=ensureProfileIdentity(deepCopy(EMPTY_STATE));
   profiles[name]=profile;
   openTeacherStudentDetailById(profile.profileId);
   return profile.profileId;
  },temp);
  await detail.getByRole('button',{name:/Удалить ученика/}).click();
  const action=page.locator('#overlay.show .vue-report:not([data-v-app])');
  await action.getByRole('button',{name:'Продолжить',exact:true}).click();
  const entered=action.getByRole('textbox',{name:/Введите имя ученика/});
  await entered.fill('Неверное имя');
  await entered.press('Enter');
  await action.getByRole('alert').getByText(/не совпадает/).waitFor();
  assert.equal(await page.evaluate(key=>!!teacherProfileById(key),id),true);
  await entered.fill(temp);
  await entered.press('Enter');
  await fallback.getByRole('heading',{name:/Панель преподавателя/}).waitFor();
  assert.equal(await page.evaluate(key=>!!teacherProfileById(key),id),false);

  const mapAction=await page.evaluate(()=>{
   const original=state.profileId,name='Профиль для карты знаний',topic='g4:moro_missing_sub';
   const profile=ensureProfileIdentity(deepCopy(EMPTY_STATE));
   profiles[name]=profile;
   openKnowledgeMap(profile.profileId,'teacher',4);
   openKnowledgeTopicDetail(topic);
   knowledgeTrainTopic(topic);
   return {original,name,topic,id:profile.profileId};
  });
  await action.getByRole('heading',{name:'Открыть как ученик?',exact:true}).waitFor();
  await action.getByText(mapAction.name,{exact:true}).waitFor();
  await action.getByRole('button',{name:'Отмена',exact:true}).click();
  assert.equal(await page.evaluate(()=>state.profileId),mapAction.original);
  await page.evaluate(key=>knowledgeTrainTopic(key),mapAction.topic);
  await action.getByRole('button',{name:'Продолжить',exact:true}).click();
  await page.locator('#overlay.show #qstage .quizq').waitFor();
  assert.deepEqual(await page.evaluate(()=>[state.profileId,teacherUnlocked,currentWeakTarget()?.key]),
   [mapAction.id,false,mapAction.topic]);
  console.log('PASS_TEACHER_PIN_FALLBACK');
 }finally{
  allowAbort();
  await ctx.close();
 }
}
async function checkTeacherActions(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await context.newPage(),uncaught=[];
 page.on('pageerror',error=>uncaught.push(error.message));
 try{
  await page.goto(address);
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>null));
  await page.reload();
  await context.setOffline(true);
  const fixture=await page.evaluate(()=>{
   const original={name:currentProfile,id:state.profileId};
   const plan='Ада запускает тренировку',lesson='Борис открывает тему',remove='Профиль на удаление';
   const key='g4:moro_missing_sub',lessonKey='g5:area_units_g5',now=Date.now();
   for(const name of [plan,lesson,remove]){
    profiles[name]=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:19});
   }
   const planItems=[
    {itemId:'done',type:'curriculum',targetId:key,title:'Выполненный пункт',status:'done',completedAt:now},
    {itemId:'pending',type:'curriculum',targetId:'g4:table',title:'Следующий пункт',status:'pending'}
   ];
   profiles[plan].activeTrainingPlan={planId:'teacher-actions-done',items:planItems};
   profiles[plan].courseProgress['g4:table']={best:[STAGES[0].need,0,0],bonus:[false,false,false]};
   profiles[plan].quickTrainers={multiplication:{factStats:{
    'mul:4x7':{attempts:3,correct:0,wrong:3,strength:20,lastWrongAt:now}
   }}};
   profiles[plan].trainingHistory=[{trainerId:'multiplication',endedAt:now-500,answered:12,correct:0,wrong:12,accuracy:0}];
   profiles[lesson].trainingHistory=[{trainerId:'addition',endedAt:now-1000,answered:12,correct:11,wrong:1}];
   for(const name of [plan,lesson]){
    const topic=name===plan?key:lessonKey,meta=analyticsTopicMeta(topic);
    profiles[name].attemptHistory=[1,2,3].map(index=>{
     const endedAt=now-index*60000,startedAt=endedAt-500;
     return {id:newAttemptId(),key:topic,kind:meta.kind,topicId:meta.topicId,grade:meta.grade,stageIndex:0,
      status:'finished',total:1,done:1,correct:0,endedAt,startedAt,
      items:[{itemId:newAttemptItemId(),kind:meta.kind,topicId:meta.topicId,grade:meta.grade,
       prompt:'Задание преподавателя '+index,finalCorrect:false,firstTry:false,skipped:false,endedAt,startedAt}]};
    });
    checkAchievementRewards({profile:profiles[name],silent:true});
   }
   persistSilently();
   openTeacherEntry();
   return {original,plan,lesson,remove,key:lessonKey,planId:profiles[plan].profileId,
    lessonId:profiles[lesson].profileId,removeId:profiles[remove].profileId};
  });
  const dialog=page.locator('#overlay.show .vue-report[data-v-app]');
  const roster=page.locator('#teacherDashboardVue[data-v-app]');
  const detail=page.locator('#teacherStudentVue[data-v-app]');
  const editor=page.locator('#trainingPlanVue[data-v-app]');
  const recommendations=detail.locator('[data-teacher-analytics-section="recommendations"]');
  const planCard=detail.locator('.training-plan-card');
  const metric=id=>detail.locator('[data-teacher-analytics-stat="'+id+'"] b').innerText();
  const button=(view,name)=>view.getByRole('button',{name,exact:true});
  const cancel=()=>button(dialog,'Отмена').click();
  const advance=()=>button(dialog,'Продолжить').click();
  const active=()=>page.evaluate(()=>({name:currentProfile,id:state.profileId}));
  const enter=async()=>{
   await page.evaluate(()=>openTeacherEntry());
   const input=dialog.getByLabel('PIN преподавателя',{exact:true});
   await input.fill('4817');
   await input.press('Enter');
   await roster.waitFor();
  };
  const open=async name=>{
   const row=roster.locator('.teacher-student-card').filter({has:page.getByRole('heading',{name,exact:true})});
   await button(row,'Открыть').click();
   await detail.getByRole('heading',{name,exact:true}).waitFor();
  };
  const exists=id=>page.evaluate(key=>!!teacherProfileById(key),id);
  await dialog.getByLabel('Новый PIN',{exact:true}).fill('4817');
  await dialog.getByLabel('Повторите PIN',{exact:true}).fill('4817');
  await button(dialog,'Создать PIN и войти').click();
  await open(fixture.remove);

  const remove=button(detail,'🗑 Удалить ученика');
  await remove.click();
  await dialog.getByText(fixture.remove,{exact:true}).waitFor();
  await cancel();
  assert(await exists(fixture.removeId));
  await remove.click();
  await advance();
  const entered=dialog.getByRole('textbox',{name:/Введите имя ученика/});
  const confirmRemove=button(dialog,'Удалить окончательно');
  await entered.fill(fixture.remove.toLowerCase());
  assert.equal(await confirmRemove.isEnabled(),false);
  await entered.press('Enter');
  await dialog.getByRole('alert').getByText(/не совпадает/).waitFor();
  await entered.fill(fixture.remove);
  assert(await confirmRemove.isEnabled());
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert(await exists(fixture.removeId));
  await remove.click();
  await advance();
  await entered.fill(fixture.remove);
  await confirmRemove.click();
  await roster.waitFor();
  assert.equal(await exists(fixture.removeId),false);
  assert.deepEqual(await active(),fixture.original);

  await open(fixture.plan);
  for(const [id,value] of Object.entries({weakTopics:'1',weakFacts:'1',errors:'4',lastTraining:'0%'})){
   assert.equal(await metric(id),value);
  }
  assert.equal(await planCard.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
  assert.equal(await planCard.getByRole('progressbar').getAttribute('aria-valuemax'),'2');
  await detail.locator('[data-teacher-analytics-section="quick"]').getByText(/4\s*[·×]\s*7/).first().waitFor();
  const learning=()=>page.evaluate(id=>{
   const profile=teacherProfileById(id).profile;
   const progress=Object.entries(profile.courseProgress).filter(([,topic])=>topic.best?.some(value=>value>0));
   return {attempts:profile.attemptHistory,progress,xp:profile.xp,coins:profile.coins};
  },fixture.planId);
  const beforePlan=await learning();
  await button(detail,'Открыть план').click();
  const removePlan=button(editor,'Удалить текущий план');
  const planId=()=>page.evaluate(id=>teacherProfileById(id).profile.activeTrainingPlan?.planId||null,fixture.planId);
  await removePlan.click();
  await dialog.getByText(fixture.plan,{exact:true}).waitFor();
  await cancel();
  assert.equal(await planId(),'teacher-actions-done');
  await removePlan.click();
  await button(dialog,'Удалить план').click();
  await detail.getByRole('heading',{name:fixture.plan,exact:true}).waitFor();
  assert.equal(await planId(),null);
  assert.deepEqual(await learning(),beforePlan);

  await page.evaluate(id=>{
   teacherProfileById(id).profile.activeTrainingPlan={planId:'teacher-actions-pending',items:[
    {itemId:'pending',type:'curriculum',targetId:'g4:table',title:'Новый пункт',status:'pending'}
   ]};
   trainingPlanPersistProfile(id);
   openTeacherStudentDetailById(id);
  },fixture.planId);
  await button(detail,'Открыть план').click();
  await removePlan.click();
  await detail.getByRole('heading',{name:fixture.plan,exact:true}).waitFor();
  assert.equal(await planId(),null);
  assert.equal(await dialog.count(),0);

  const launchQuick=button(recommendations,'Открыть тренировку');
  await launchQuick.click();
  await dialog.getByText(/в режиме «Повторить»/).waitFor();
  await cancel();
  assert.deepEqual(await active(),fixture.original);
  await launchQuick.click();
  await advance();
  await page.locator('#quickStage[data-v-app]').getByRole('heading',{name:'Что потренируем?'}).waitFor();
  assert.deepEqual(await active(),{name:fixture.plan,id:fixture.planId});
  assert.deepEqual(await page.evaluate(()=>({teacher:teacherUnlocked,id:quickTrainerId,mode:quickSelection.smartMode,tables:quickSelection.tables})),
   {teacher:false,id:'multiplication',mode:'weak',tables:[4,7]});

  await page.reload();
  assert.deepEqual(await active(),{name:fixture.plan,id:fixture.planId});
  assert.equal(await exists(fixture.removeId),false);
  assert.equal(await planId(),null);
  assert.deepEqual(await learning(),beforePlan);
  await enter();
  await open(fixture.lesson);
  for(const [id,value] of Object.entries({weakTopics:'1',weakFacts:'0',errors:'3',lastTraining:'92%'})){
   assert.equal(await metric(id),value);
  }
  assert.equal(await button(recommendations,'Открыть тренировку').count(),0);
  await detail.locator('[data-teacher-analytics-section="strong"]').getByText('✓ 92%',{exact:true}).waitFor();
  const topicTitle=await page.evaluate(key=>analyticsTopicMeta(key).title,fixture.key);
  await recommendations.getByText('Вернуться к теме «'+topicTitle+'»',{exact:true}).waitFor();
  const createPlan=button(planCard,'Собрать план тренировки');
  await createPlan.click();
  await editor.getByRole('heading',{name:/План тренировки/}).waitFor();
  assert(await page.evaluate(({id,key})=>teacherProfileById(id).profile.activeTrainingPlan.items.some(item=>item.targetId===key),
   {id:fixture.lessonId,key:fixture.key}));
  await button(editor,'← '+fixture.lesson).click();
  await button(planCard,'Открыть план').waitFor();
  assert.equal(await planCard.getByRole('progressbar').getAttribute('aria-valuenow'),'0');
  const launchTopic=button(recommendations,'Открыть тему');
  await launchTopic.click();
  await dialog.getByRole('heading',{name:'Открыть тему?',exact:true}).waitFor();
  await cancel();
  assert.deepEqual(await active(),{name:fixture.plan,id:fixture.planId});
  await launchTopic.click();
  await advance();
  await page.locator('#qstage[data-v-app]').waitFor();
  assert.deepEqual(await active(),{name:fixture.lesson,id:fixture.lessonId});
  assert.deepEqual(await page.evaluate(()=>({teacher:teacherUnlocked,mode:blockSession.practiceMode,key:currentWeakTarget()?.key})),
   {teacher:false,mode:'topic',key:fixture.key});

  const map=page.locator('#knowledgeMapVue[data-v-app]');
  const mapTopic=page.locator('#knowledgeTopicDetailVue[data-v-app]');
  const chooseMapTopic=async(name,grade,title)=>{
   await enter();
   await open(name);
   await button(detail,'📊 Карта знаний').click();
   await map.locator('.knowledge-hero').getByText(name,{exact:true}).waitFor();
   await map.locator('.knowledge-grade').filter({hasText:grade+' класс'}).click();
   await map.getByRole('searchbox',{name:'Найти тему'}).fill(title);
   await map.locator('.knowledge-card').filter({hasText:title}).first().click();
   await mapTopic.getByRole('heading',{name:'📊 '+title,exact:true}).waitFor();
  };
  const leavePractice=async()=>{
   await page.keyboard.press('Escape');
   await page.locator('.mk872-training-dialog[data-v-app]').getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
   await page.locator('#overlay.show').waitFor({state:'hidden'});
  };
  const switchTitle=dialog.getByRole('heading',{name:'Открыть как ученик?',exact:true});
  const staysInMap=async(id,key,opener)=>{
   assert.deepEqual(await page.evaluate(()=>[teacherUnlocked,knowledgeMapState.profileId,knowledgeMapState.topicKey]),
    [true,id,key]);
   assert(await opener.evaluate(element=>element===document.activeElement));
  };
  await leavePractice();
  const practiceKey='g4:moro_missing_sub';
  const practiceTitle=await page.evaluate(key=>analyticsTopicMeta(key).title,practiceKey);
  await chooseMapTopic(fixture.plan,4,practiceTitle);
  const train=button(mapTopic,'Тренировать тему');
  await train.click();
  await switchTitle.waitFor();
  await dialog.getByText(fixture.plan,{exact:true}).waitFor();
  await dialog.getByText(/откроет тренировку по теме/).waitFor();
  await dialog.getByText('«'+practiceTitle+'»',{exact:true}).waitFor();
  await cancel();
  assert.deepEqual(await active(),{name:fixture.lesson,id:fixture.lessonId});
  await staysInMap(fixture.planId,practiceKey,train);
  await train.click();
  await advance();
  await page.locator('#qstage[data-v-app]').waitFor();
  assert.deepEqual(await page.evaluate(()=>[state.profileId,teacherUnlocked,blockSession.practiceMode,currentWeakTarget()?.key]),
   [fixture.planId,false,'topic',practiceKey]);
  await leavePractice();

  const expectedSources=await page.evaluate(({id,key})=>{
   const profile=teacherProfileById(id).profile;
   const extraKey='g5:frac_to_mixed',topic=analyticsTopicMeta(extraKey);
   const record=profile.attemptHistory.find(item=>item.key===key);
   profile.attemptHistory.push({...record,id:newAttemptId(),key:extraKey,topicId:topic.topicId,
    items:[{...record.items[0],itemId:newAttemptItemId(),topicId:topic.topicId,prompt:'Ошибка другой темы'}]});
   persistSilently();
   return profile.attemptHistory.filter(item=>item.key===key).map(item=>item.id).sort();
  },{id:fixture.lessonId,key:fixture.key});
  await chooseMapTopic(fixture.lesson,5,topicTitle);
  const workErrors=button(mapTopic,'🧠 Работа над ошибками');
  await workErrors.click();
  await switchTitle.waitFor();
  await dialog.getByText(fixture.lesson,{exact:true}).waitFor();
  await dialog.getByText(/откроет работу над ошибками по теме/).waitFor();
  await page.keyboard.press('Escape');
  await switchTitle.waitFor({state:'hidden'});
  assert.deepEqual(await active(),{name:fixture.plan,id:fixture.planId});
  await staysInMap(fixture.lessonId,fixture.key,workErrors);
  await workErrors.click();
  await advance();
  const work=page.locator('#errorWorkVue[data-v-app]');
  await work.getByRole('heading',{name:'🧠 Работа над ошибками',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>[state.profileId,teacherUnlocked,errorWorkGradeFilter,errorWorkTopicFilter]),
   [fixture.lessonId,false,5,fixture.key]);
  const errorTopicTitle=await page.evaluate(key=>attemptTitle(key),fixture.key);
  await work.locator('.error-group').getByRole('heading',{name:errorTopicTitle,exact:true}).waitFor();
  assert.equal(await work.locator('.error-group').count(),1);
  await button(work,'5 заданий').click();
  await page.locator('#qstage[data-v-app]').waitFor();
  assert.deepEqual(await page.evaluate(()=>blockSession.errorSources.map(error=>error.sourceAttemptId).sort()),expectedSources);
  await page.reload();
  await page.locator('.mk872-training-dialog[data-v-app]').getByRole('button',{name:'Продолжить',exact:true}).click();
  await page.locator('#qstage[data-v-app]').waitFor();
  assert.deepEqual(await page.evaluate(()=>[state.profileId,teacherUnlocked,currentErrorSource()?.key]),[fixture.lessonId,false,fixture.key]);
  console.log('PASS_TEACHER_MAP_ACTIONS_OFFLINE',viewport.width);
  assert.deepEqual(uncaught,[]);
  console.log('PASS_TEACHER_ACTIONS_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function checkStoreCatalog(page){
 const fixture=await page.evaluate(()=>{
  state.coins=1000; state.xp=1000;
  const item=mk872ModernCatalog().find(item=>!isOwned('avatars',item.id)&&!item.rewardOnly
   &&item.level<=levelFor(state.xp)&&item.price>0&&item.price<state.coins);
  save();
  openShop('avatars','all');
  return {id:item.id,name:item.name,price:item.price,balance:state.coins,
   total:filteredShopItems('avatars').length};
 });
 const catalog=page.locator('#modal .shop-grid[data-v-app]');
 const card=catalog.locator('.shop-card').filter({has:page.getByText(fixture.name,{exact:true})});
 await card.waitFor();
 assert.equal(await catalog.locator('.mk868-final-hero-card').count(),fixture.total);
 const controls=page.locator('.store-controls[data-v-app]');
 await controls.getByRole('button',{name:'Редкие',exact:true}).click();
 const rare=controls.getByRole('button',{name:'Редкие',exact:true});
 await rare.and(controls.locator('[aria-pressed="true"]')).waitFor();
 assert.equal(await rare.evaluate(element=>element===document.activeElement),true);
 assert.equal(await catalog.locator('.shop-card').count(),await page.evaluate(()=>filteredShopItems('avatars').length));
 await controls.getByRole('button',{name:'Все',exact:true}).click();
 await controls.getByRole('combobox',{name:'Сортировка предметов'}).selectOption('priceDesc');
 await page.waitForFunction(()=>mkV71SortMode()==='priceDesc');
 const expected=await page.evaluate(()=>filteredShopItems('avatars')[0].name);
 assert.equal(await catalog.locator('.shop-card strong').first().innerText(),expected);
 await card.getByRole('button',{name:`Купить за ${fixture.price} 🪙`,exact:true}).click();
 await card.getByRole('button',{name:'Выбрано ✓',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>state.equipped.avatar),fixture.id);
 assert.equal(await page.evaluate(()=>state.coins),fixture.balance-fixture.price);
 await card.getByRole('button',{name:'🪙 Продать',exact:true}).click();
 const sale=page.locator('#mk865SaleDialog > [data-v-app]');
 await sale.getByRole('heading',{name:/Продать/}).waitFor();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#mk865SaleOverlay.show').count(),0);
 await card.getByRole('button',{name:'🪙 Продать',exact:true}).click();
 const refund=Math.floor(fixture.price*0.4);
 await page.getByRole('button',{name:`Продать сейчас +${refund}`,exact:true}).click();
 assert.equal(await page.evaluate(id=>isOwned('avatars',id),fixture.id),false);
 assert.equal(await page.evaluate(()=>state.coins),fixture.balance-fixture.price+refund);
 await page.reload();
 await catalog.locator('.mk868-final-hero-card').first().waitFor();
 await controls.getByRole('combobox',{name:'Сортировка предметов'}).waitFor();
 assert.equal(await page.evaluate(()=>state.coins),fixture.balance-fixture.price+refund);
 const tabs=page.locator('.shop-tabs[data-v-app]');
 const picker=page.locator('.mk-ux91-category-label[data-v-app]').getByRole('combobox',{name:'Раздел магазина'});
 await tabs.locator('[data-store-category="avatars"][aria-current="page"]').waitFor({state:'attached'});
 const switchTab=async category=>{
  if(await picker.isVisible())await picker.selectOption(category);
  else await tabs.locator('[data-store-category="'+category+'"]').click();
  await tabs.locator('[data-store-category="'+category+'"][aria-current="page"]').waitFor({state:'attached'});
 };
 await switchTab('frames');
 await switchTab('avatars');
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
}
async function checkCollectionSection(page){
 const frame=await page.evaluate(()=>{
  const item=mk872ActiveCollectionItems('frames').find(item=>item.id!=='fr_none');
  state.inventory.frames.push(item.id);
  save();
  openCollection();
  return {id:item.id,name:item.name};
 });
 const collection=page.locator('#mk872CollectionUX');
 const section=collection.locator('#mk872CollectionContent[data-v-app]');
 const navigation=collection.locator('.mk872-col-counter-grid[data-v-app]');
 const selectTab=(type)=>navigation.locator('[data-mk872-collection-tab="'+type+'"]').click();
 await selectTab('frames');
 const card=section.locator('.mk872-col-card').filter({has:page.getByText(frame.name,{exact:true})});
 await card.getByRole('button',{name:'Выбрать',exact:true}).click();
 await card.getByRole('button',{name:'Выбрано ✓',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>state.equipped.frame),frame.id);
 await selectTab('achievements');
 await section.getByRole('heading',{name:/Достижения/}).waitFor();
 assert(await section.locator('.mk872-col-card').count()>0);
 await selectTab('archive');
 await section.getByRole('heading',{name:/Архивные предметы/}).waitFor();
 await selectTab('frames');
 await card.getByRole('button',{name:'Выбрано ✓',exact:true}).waitFor();
 await page.reload();
 await card.getByRole('button',{name:'Выбрано ✓',exact:true}).waitFor();
 assert.equal(await navigation.locator('[aria-pressed="true"]').getAttribute('data-mk872-collection-tab'),'frames');
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
}
async function seedStoreProfile(page){
 return page.evaluate(()=>{
  const cosmetics={
   avatar:['avatars','av_mq_bit'], frame:['frames',SHOP_CATALOG.frames.find(x=>x.price>0).id],
   pet:['pets','pet_cosmic_whale'], effect:['effects','fx_sparks'],
   background:['backgrounds','bg_cosmos'], title:['titles','title_math'],
  };
  for(const [slot,[category,id]] of Object.entries(cosmetics)){
   state.inventory[category].push(id);
   state.equipped[slot]=id;
  }
  const badge=SHOP_CATALOG.badges.find(x=>x.price>0),sticker=purchasableStickerItems()[0];
  state.inventory.badges.push(badge.id);state.equipped.badges=[badge.id];
  state.inventory.stickers.push(sticker.id);state.equipped.stickers=[sticker.id];
  state.nicknameStyleId='blue';state.xp=650;state.coins=724;normalizeShop();save();
  const c=normalizeProfileCosmetics(state);
  return {name:currentProfile,profileId:state.profileId,avatar:c.avatar.id,frame:c.frame.css,
   effect:c.effect.css,title:c.title.name,labels:[c.frame.name,c.pet.name,c.background.name,c.effect.name],
   badge:badge.name,sticker:sticker.name,owned:ownedTotal(state),coins:state.coins,xp:Math.floor(mk872GetLevelProgress(state.xp).xpIntoLevel)};
 });
}
async function expectStorePreview(card,fixture){
 await card.waitFor();
 assert.match(await card.getAttribute('class'),/profile-bg-cosmos/);
 const nickname=card.locator('.profile-preview-info > b.nick-blue');
 assert.equal(await nickname.innerText(),fixture.name);
 assert.equal(await nickname.evaluate(node=>getComputedStyle(node).color),'rgb(184, 226, 255)');
 const avatar=card.locator('.avatar-badge.'+fixture.frame+'[data-mk-avatar-id="'+fixture.avatar+'"]');
 const art=avatar.locator('img').first();
 await art.waitFor();
 await art.evaluate(image=>image.decode());
 assert(await art.evaluate(image=>image.naturalWidth>0));
 await avatar.locator('.avatar-effect-layer.'+fixture.effect).waitFor({state:'attached'});
 await avatar.locator('.pet-mini').waitFor();
 assert.equal(await card.locator('.profile-title-line').innerText(),'🏷️ '+fixture.title);
 const summary=await card.locator('small.profile-dark-copy').innerText();
 for(const label of fixture.labels)assert(summary.includes(label),summary);
 assert(summary.includes('собрано '+fixture.owned+' предметов'));
 assert.equal(await card.getByRole('progressbar').getAttribute('aria-valuenow'),String(fixture.xp));
 assert.equal(await card.locator('.profile-badge-chip').getAttribute('title'),fixture.badge);
 assert.equal(await card.locator('.favorite-sticker').getAttribute('title'),fixture.sticker);
 assert.equal(Number((await card.locator('.shop-balance').innerText()).replace(/[^0-9]/g,'')),fixture.coins);
 assert(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
}
async function checkStoreSurface(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const dialog=page.locator('#overlay.show #modal');
 const profiles=dialog.locator('.vue-report[data-v-app] .mk871-profiles-screen');
 const heading=dialog.locator('[data-store-heading][data-v-app]');
 const card=dialog.locator('[data-store-preview][data-v-app] .profile-preview');
 const close=heading.getByRole('button',{name:'Закрыть окно',exact:true});
 const profileCard=profiles.locator('.profile-preview');
 const shop=profiles.getByRole('button',{name:/Магазин/});
 const collection=profiles.getByRole('button',{name:/Моя коллекция/});
 const selectCategory=async id=>{
  const picker=dialog.getByRole('combobox',{name:'Раздел магазина',exact:true});
  if(await picker.isVisible())await picker.selectOption(id);
  else await dialog.locator('.shop-tabs[data-v-app] [data-store-category="'+id+'"]').click();
 };
 const checkScreen=async (name,topic,fixture)=>{
  const title=heading.getByRole('heading',{name:new RegExp(name)});
  await title.waitFor();
  assert.equal(await dialog.getAttribute('aria-labelledby'),await title.getAttribute('id'));
  await expectStorePreview(card,fixture);
  assert.equal(await page.evaluate(()=>state.profileId),fixture.profileId);
  return heading.getByRole('button',{name:'Справка: '+topic,exact:true});
 };
 try{
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const fixture=await seedStoreProfile(page);
  await page.locator('#appHeader[data-v-app] .profile-pill').click();
  await expectStorePreview(profileCard,fixture);
  await shop.click();
  const help=await checkScreen('Магазин наград','shop',fixture);
  await help.press('Enter');
  await page.locator('#mk872-help-layer [data-v-app]').getByRole('heading',{name:'О магазине'}).waitFor();
  await page.keyboard.press('Escape');
  assert(await help.evaluate(button=>button===document.activeElement));
  await selectCategory('collection');
  await checkScreen('Моя коллекция','collection',fixture);
  await dialog.locator('[data-mk872-collection-tab="pets"]').click();
  await context.setOffline(true);
  await page.reload();
  await checkScreen('Моя коллекция','collection',fixture);
  assert.equal(await dialog.locator('[data-mk872-collection-tab="pets"]').getAttribute('aria-pressed'),'true');
  await selectCategory('avatars');
  await checkScreen('Магазин наград','shop',fixture);
  await page.reload();
  await checkScreen('Магазин наград','shop',fixture);
  await close.press('Enter');
  await expectStorePreview(profileCard,fixture);
  await collection.press('Space');
  await checkScreen('Моя коллекция','collection',fixture);
  await page.goBack();
  await expectStorePreview(profileCard,fixture);
  await page.goForward();
  await checkScreen('Моя коллекция','collection',fixture);
  await page.keyboard.press('Escape');
  await expectStorePreview(profileCard,fixture);
  await page.reload();
  await expectStorePreview(profileCard,fixture);
  assert.deepEqual(errors,[]);
  console.log('PASS_STORE_SURFACE',JSON.stringify({width:viewport.width,cosmetics:true,helpFocus:true,history:true,offlineReload:true}));
 }finally{await context.close()}
}
async function checkCollectionEconomy(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const header=page.locator('#appHeader[data-v-app]');
 const navigation=page.locator('#mk872CollectionUX .mk872-col-counter-grid[data-v-app]');
 const content=page.locator('#mk872CollectionContent[data-v-app]');
 const worth=page.locator('#modal .mk30-collection-worth[data-v-app] strong');
 const tab=id=>navigation.locator('[data-mk872-collection-tab="'+id+'"]');
 const owned=async id=>Number((await tab(id).locator('b').innerText()).split('/')[0]);
 const value=async()=>Number((await worth.innerText()).replace(/[^0-9]/g,''));
 const close=page.locator('#overlay.show #modal .mtop .x');
 async function select(id,key='Enter'){
  await tab(id).press(key);
  assert.equal(await tab(id).getAttribute('aria-pressed'),'true');
  assert.equal(await tab(id).getAttribute('aria-controls'),'mk872CollectionContent');
  assert.equal(await navigation.locator('[aria-pressed="true"]').count(),1);
  assert(await tab(id).evaluate(button=>button===document.activeElement));
 }
 async function openStoreCategory(id){
  const picker=page.getByRole('combobox',{name:'Раздел магазина',exact:true});
  if(await picker.isVisible())await picker.selectOption(id);
  else await page.locator('.shop-tabs[data-v-app] [data-store-category="'+id+'"]').click();
 }
 try{
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  const fixture=await page.evaluate(()=>{
   state.coins=1000;state.xp=650;save();
   const pet=catalogItem('pets','pet_bot');
   return {name:pet.name,id:pet.id,price:pet.price,coins:state.coins,
    worth:mk30CollectionWorth(state),pets:mk872CollectionCount('pets')[0],archive:mk873ArchiveModel().count};
  });
  await header.locator('.profile-pill').click();
  await page.locator('.mk871-profiles-screen').getByRole('button',{name:/Моя коллекция/}).click();
  await navigation.waitFor();
  assert.equal(await navigation.getByRole('button').count(),11);
  assert.equal(await value(),fixture.worth);
  const sections=await navigation.getByRole('button').evaluateAll(buttons=>buttons.map(button=>button.dataset.mk872CollectionTab));
  for(const id of sections.filter(id=>id!=='pets'&&id!=='archive')){
   await select(id);
   assert.equal((await content.locator('.mk872-col-head h3').innerText()).trim(),(await tab(id).locator('small').innerText()).trim());
  }
  await select('pets','Space');
  await content.getByRole('heading',{name:/Питомцы/}).waitFor();
  assert.equal(await owned('pets'),fixture.pets);
  await select('archive');
  await content.getByRole('heading',{name:/Архивные предметы/}).waitFor();
  assert.equal(await owned('archive'),fixture.archive);
  await page.reload();
  await content.getByRole('heading',{name:/Архивные предметы/}).waitFor();
  assert.equal(await tab('archive').getAttribute('aria-pressed'),'true');
  await close.click();
  await page.locator('.mk871-profiles-screen').waitFor();
  await close.click();
  await page.locator('#overlay.show').waitFor({state:'hidden'});

  const menu=header.locator('.mk-ui19-nav-toggle');
  if(await menu.isVisible())await menu.click();
  await header.getByRole('button',{name:'Магазин',exact:true}).click();
  const catalog=page.locator('#modal .shop-grid[data-v-app]');
  await catalog.waitFor();
  await openStoreCategory('pets');
  const card=catalog.locator('.shop-card').filter({has:page.getByText(fixture.name,{exact:true})});
  await card.getByRole('button',{name:'Купить за '+fixture.price+' 🪙',exact:true}).click();
  await card.getByRole('button',{name:'🪙 Продать',exact:true}).waitFor();
  await openStoreCategory('collection');
  await select('pets');
  await content.getByText(fixture.name,{exact:true}).waitFor();
  assert.equal(await owned('pets'),fixture.pets+1);
  assert.equal(await value(),fixture.worth+fixture.price);
  assert.equal(await page.evaluate(()=>state.coins),fixture.coins-fixture.price);
  await page.reload();
  await content.getByText(fixture.name,{exact:true}).waitFor();
  assert.equal(await tab('pets').getAttribute('aria-pressed'),'true');
  assert.equal(await value(),fixture.worth+fixture.price);

  await select('archive');
  const archived=content.locator('.mk873-archive-card').filter({has:page.getByText(fixture.name,{exact:true})});
  await archived.getByRole('button',{name:'Продать питомца',exact:true}).click();
  const refund=Math.floor(fixture.price*.4);
  await page.locator('#mk865SaleDialog > [data-v-app]').getByRole('button',{name:'Продать сейчас +'+refund,exact:true}).click();
  await archived.getByText('Уже продан',{exact:true}).waitFor();
  assert.equal(await tab('archive').getAttribute('aria-pressed'),'true');
  assert.equal(await owned('archive'),fixture.archive+1);
  assert.equal(await owned('pets'),fixture.pets);
  assert.equal(await value(),fixture.worth);
  await page.reload();
  await archived.getByText('Уже продан',{exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>mk854Route()),{screen:'store',category:'collection',collectionTab:'archive'});
  assert.equal(await value(),fixture.worth);
  assert.equal(await page.evaluate(()=>state.coins),fixture.coins-fixture.price+refund);
  assert.equal(await page.evaluate(id=>state.saleHistory.filter(record=>record.id===id).length,fixture.id),1);
  assert.deepEqual(errors,[]);
  console.log('PASS_COLLECTION_ECONOMY_AND_SECTIONS_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function checkPetQuickPanel(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const panel=page.locator('#mk19gPetPanel[data-v-app]');
 const close=page.locator('#overlay.show #modal .mtop').getByRole('button',{name:'Закрыть окно',exact:true});
 const choice=id=>panel.locator('[data-pet-choice="'+id+'"]');
 const current=panel.locator('.mk19g-pet-name');
 const home=page.locator('#homeDashboard[data-v-app]');
 const collection=page.locator('#mk872CollectionUX');
 const catalog=page.locator('#modal .shop-grid[data-v-app]');
 const card=name=>catalog.locator('.shop-card').filter({has:page.getByText(name,{exact:true})});
 const economy=()=>page.evaluate(()=>[state.coins,state.xp,state.shopStats, [...state.inventory.pets].sort()]);
 async function openCategory(category){
  const picker=page.getByRole('combobox',{name:'Раздел магазина',exact:true});
  if(await picker.isVisible())await picker.selectOption(category);
  else await page.locator('.shop-tabs[data-v-app] [data-store-category="'+category+'"]').click();
 }
 async function enterShop(){
  const header=page.locator('#appHeader[data-v-app]');
  const toggle=header.locator('.mk-ui19-nav-toggle');
  if(await toggle.isVisible())await toggle.click();
  await header.getByRole('button',{name:'Магазин',exact:true}).click();
  await catalog.waitFor();
  await openCategory('pets');
  await panel.waitFor();
 }
 async function equipped(id,name){
  await current.getByText(name,{exact:true}).waitFor();
  assert.equal(await choice(id).getAttribute('aria-pressed'),'true');
  assert(await choice(id).isDisabled());
  assert.equal(await panel.locator('button[aria-pressed="true"]').count(),1);
  assert.equal(await page.evaluate(()=>state.equipped.pet),id);
 }
 try{
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  await home.waitFor();
  const fixture=await page.evaluate(()=>{
   state.coins=600;state.xp=650;save();
   const regular=catalogItem('pets','pet_bot'),reward=catalogItem('pets','pet_streak_owl');
   return {regular:{id:regular.id,name:regular.name,price:regular.price},reward:{id:reward.id,name:reward.name},
    before:state.coins,total:mk19gPetSummary().total};
  });
  const {regular,reward}=fixture;
  await enterShop();
  await equipped('pet_none','Без питомца');
  assert.equal(await panel.getByRole('button',{name:/Увеличить/}).count(),0);
  assert.equal(await panel.locator('.mk19g-pet-choice').count(),1);
  assert.equal(await choice(reward.id).count(),0);
  assert(await card(reward.name).getByRole('button',{name:/Серия 10/}).isDisabled());
  await card(regular.name).getByRole('button',{name:'Купить за '+regular.price+' 🪙',exact:true}).click();
  await equipped(regular.id,regular.name);
  assert.equal(await page.evaluate(()=>state.coins),fixture.before-regular.price);
  assert.equal(await panel.locator('.mk19g-pet-collection-count').innerText(),'1 / '+fixture.total);
  await choice('pet_none').press('Enter');
  await equipped('pet_none','Без питомца');
  await page.reload();
  await equipped('pet_none','Без питомца');
  assert.deepEqual(await page.evaluate(()=>mk854Route()),{screen:'store',category:'pets'});
  await close.click();
  await page.locator('#overlay.show').waitFor({state:'hidden'});

  await home.locator('.quick-home button[data-home-action="quick-multiplication"]').click();
  const quick=page.locator('#quickStage[data-v-app]');
  await quick.getByRole('button',{name:'Начать тренировку',exact:true}).click();
  for(let i=0;i<10;i++){
   const answer=await page.evaluate(()=>String(quickQuestion.correct));
   await quick.getByRole('button',{name:answer,exact:true}).click();
   await quick.getByText(/✅ Верно!/).waitFor();
   if(i<9)await quick.getByRole('button',{name:/Следующий пример/}).click();
  }
  await quick.getByRole('button',{name:'Завершить тренировку',exact:true}).click();
  await quick.getByRole('heading',{name:'Тренировка завершена!',exact:true}).waitFor();
  assert(await page.evaluate(id=>isAchievementUnlocked(state,'streak10')&&isOwned('pets',id),reward.id));
  await page.locator('#quickTrainerFrame[data-v-app]').getByRole('button',{name:'← Главный экран',exact:true}).click();
  await home.waitFor();
  const earned=await economy();
  await enterShop();
  await choice(reward.id).click();
  await equipped(reward.id,reward.name);
  assert.match(await panel.locator('.mk19g-pet-rarity').innerText(),/за достижение/);
  assert.equal(await panel.locator('.mk19g-pet-collection-count').innerText(),'2 / '+fixture.total);
  assert.equal(await card(reward.name).getByRole('button',{name:/Продать/}).count(),0);
  await page.reload();
  await equipped(reward.id,reward.name);
  const artwork=panel.getByRole('button',{name:'Увеличить: '+reward.name,exact:true});
  await artwork.press('Enter');
  const viewer=page.locator('#mk872AvatarViewer .mk872-viewer-content[data-v-app]');
  await viewer.locator('#mk872ViewerTitle').getByText(reward.name,{exact:true}).waitFor();
  await viewer.getByRole('button',{name:'Закрыть просмотр',exact:true}).click();
  await viewer.waitFor({state:'detached'});
  assert(await artwork.evaluate(button=>button===document.activeElement));

  await openCategory('collection');
  await collection.waitFor();
  await equipped(reward.id,reward.name);
  await collection.locator('[data-mk872-collection-tab="pets"]').click();
  await choice(regular.id).click();
  await equipped(regular.id,regular.name);
  const picked=collection.locator('#mk872CollectionContent[data-v-app] .mk872-col-card.selected');
  await picked.getByText(regular.name,{exact:true}).waitFor();
  await choice('pet_none').click();
  await equipped('pet_none','Без питомца');
  assert.deepEqual(await page.evaluate(()=>mk854Route()),{screen:'store',category:'collection',collectionTab:'pets'});
  await page.reload();
  await collection.waitFor();
  await equipped('pet_none','Без питомца');
  await choice(reward.id).click();
  await equipped(reward.id,reward.name);
  await page.reload();
  await collection.waitFor();
  await equipped(reward.id,reward.name);
  await panel.getByRole('button',{name:'Посмотреть всех питомцев',exact:true}).click();
  await catalog.waitFor();
  await equipped(reward.id,reward.name);
  assert.deepEqual(await economy(),earned);
  assert.deepEqual(errors,[]);
  console.log('PASS_PET_QUICK_PANEL_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function checkArtworkViewer(page){
 const fixture=await page.evaluate(()=>{
  const avatar=catalogItem('avatars','av_mq_bit'),pet=catalogItem('pets','pet_cosmic_whale');
  const equipped={avatar:state.equipped.avatar,pet:state.equipped.pet};
  state.inventory.avatars.push(avatar.id);
  state.inventory.pets.push(pet.id);
  state.equipped.avatar=avatar.id;
  state.equipped.pet=pet.id;
  save();
  openProfiles();
  return {avatar:avatar.name,pet:pet.name,equipped};
 });
 const profile=page.locator('#modal .vue-report[data-v-app] .mk871-profiles-screen');
 const popup=page.locator('#mk872AvatarViewer');
 const viewer=popup.locator('.mk872-viewer-content[data-v-app]');
 const close=viewer.getByRole('button',{name:'Закрыть просмотр',exact:true});
 const profileAvatar=profile.locator('.profile-preview > .avatar-badge');
 const profilePet=profileAvatar.locator('.pet-mini');
 const collection=page.locator('#mk872CollectionUX');
 const collectionArt=title=>collection.locator('#mk872CollectionContent[data-v-app] .mk872-col-card')
  .filter({has:page.getByText(title,{exact:true})}).locator('.mk872-col-art');
 const selectTab=type=>collection.locator('[data-mk872-collection-tab="'+type+'"]').click();
 const measure=async(trigger,kind,title,openByKey,closeBy)=>{
  const original=trigger.locator('img').first();
  await original.waitFor();
  const src=await original.getAttribute('src');
  if(openByKey)await trigger.press('Enter');
  else await trigger.click();
  await viewer.locator('#mk872ViewerTitle').getByText(title,{exact:true}).waitFor();
  assert.equal(await popup.getAttribute('aria-label'),kind==='pet'?'Просмотр питомца':'Просмотр аватара');
  const visual=viewer.locator('.mk30-visual.mk30-'+kind);
  const image=visual.locator('img').first();
  assert.equal(await image.getAttribute('src'),src);
  await page.waitForFunction(()=>{const image=document.querySelector('#mk872ViewerVisual img');return image?.complete&&image.naturalWidth>0});
  const size=await image.evaluate(element=>{
   const area=element.closest('.mk30-visual').getBoundingClientRect(),image=element.getBoundingClientRect();
   return {side:area.width,width:image.width,height:image.height,
    fits:area.left>=0&&area.right<=innerWidth&&area.top>=0&&area.bottom<=innerHeight};
  });
  assert(size.fits&&size.side>=150&&size.side<=301,JSON.stringify(size));
  assert(size.width>=size.side*.70&&size.height>=size.side*.70,JSON.stringify(size));
  assert(await close.evaluate(button=>button===document.activeElement));
  await page.keyboard.press('Tab');
  assert(await close.evaluate(button=>button===document.activeElement));
  if(closeBy==='button')await close.click();
  else if(closeBy==='back')await page.goBack();
  else await page.keyboard.press('Escape');
  await viewer.waitFor({state:'detached'});
  await page.waitForFunction(()=>!history.state?.__mk30PetViewer);
  assert(await trigger.evaluate(node=>node===document.activeElement));
 };
 await measure(profileAvatar,'avatar',fixture.avatar,true,'button');
 await measure(profilePet,'pet',fixture.pet,false,'escape');
 await profile.getByRole('button',{name:/Моя коллекция/}).click();
 await selectTab('avatars');
 await measure(collectionArt(fixture.avatar),'avatar',fixture.avatar,false,'escape');
 await selectTab('pets');
 const pet=collectionArt(fixture.pet);
 await measure(pet,'pet',fixture.pet,true,'button');
 await measure(pet,'pet',fixture.pet,false,'back');
 await collection.waitFor();
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
 await page.evaluate(equipped=>{Object.assign(state.equipped,equipped);save()},fixture.equipped);
 console.log('PASS_ARTWORK_VIEWER_OFFLINE',page.viewportSize().width);
}
async function checkArchivedRefunds(page){
 const fixture=await page.evaluate(()=>{
  const avatar=SHOP_CATALOG.avatars.find(item=>mk873IsArchivedAvatar(item.id)&&!item.rewardOnly&&(item.price||0)>0);
  const pet=catalogItem('pets','pet_cat');
  state.coins=620;
  state.inventory.avatars.push(avatar.id);state.equipped.avatar=avatar.id;
  state.inventory.pets.push(pet.id);
  mk865SetAcquisition(state,'avatars',avatar.id,'store',400,Date.now()-900000);
  mk865SetAcquisition(state,'pets',pet.id,'store',390,Date.now()-900000);
  save();openCollection();mk873CollectionSwitch('archive');
  return {avatar:avatar.id,name:avatar.name,pet:pet.id};
 });
 const archive=page.locator('#mk872CollectionContent[data-v-app]');
 const refund=archive.getByRole('button',{name:'Вернуть 400 🪙 (100%)',exact:true});
 const dialog=page.locator('.mk872-training-dialog[data-v-app]').getByRole('alertdialog');
 const snapshot=()=>page.evaluate(avatar=>({
  coins:state.coins,owned:state.inventory.avatars.includes(avatar),equipped:state.equipped.avatar,
  refund:mk873Receipt(state,avatar)?.refundCoins??null,
  sales:state.saleHistory.filter(item=>item.id===avatar).length,
 }),fixture.avatar);
 const before=await snapshot();
 await refund.click();
 await dialog.getByRole('heading',{name:'Вернуть архивный аватар?'}).waitFor();
 const description=await dialog.locator('p').innerText();
 assert(description.includes(fixture.name)&&description.includes('400'),description);
 await dialog.getByRole('button',{name:'Оставить как есть',exact:true}).click();
 assert(await refund.evaluate(button=>button===document.activeElement));
 assert.deepEqual(await snapshot(),before);
 await page.reload();
 await refund.waitFor();
 assert.deepEqual(await snapshot(),before);

 await refund.click();
 await page.goBack();
 await dialog.waitFor({state:'detached'});
 assert.deepEqual(await snapshot(),before);
 await page.goForward();
 await refund.click();
 const accept=dialog.getByRole('button',{name:'Вернуть 400 🪙',exact:true});
 const other=await page.context().newPage();
 const refunded=archive.getByRole('button',{name:'Возврат выполнен ✓',exact:true});
 const after={coins:1020,owned:false,equipped:'av_default',refund:400,sales:1};
 try{
  await other.goto(page.url());
  await other.evaluate(()=>{openCollection();mk873CollectionSwitch('archive')});
  await other.locator('#mk872CollectionContent[data-v-app]').getByRole('button',{
   name:'Вернуть 400 🪙 (100%)',exact:true,
  }).click();
  const otherAccept=other.locator('.mk872-training-dialog[data-v-app]').getByRole('button',{name:'Вернуть 400 🪙',exact:true});
  await Promise.all([accept.evaluate(button=>{button.click();button.click()}),otherAccept.click()]);
  await page.waitForFunction(async avatar=>{
   const name='matkvest-archive-refund:'+mk873ReceiptKey(state,avatar);
   const {held,pending}=await navigator.locks.query();
   const saved=JSON.parse(localStorage.getItem('mq4_profiles')||'{}')[currentProfile];
   return ![...held,...pending].some(lock=>lock.name===name)
    &&saved?.coins===1020&&saved.legacyAvatarRefunds?.[avatar]?.refundCoins===400;
  },fixture.avatar);
  await page.reload();
  await refunded.waitFor();
  assert.deepEqual(await snapshot(),after);
 }finally{
  const closed=other.waitForEvent('close');
  await other.close({runBeforeUnload:true});
  await closed;
 }
 await page.reload();
 await refunded.waitFor();
 assert(await refunded.isDisabled());
 await page.evaluate(avatar=>mk873RefundArchivedAvatar(avatar),fixture.avatar);
 assert.deepEqual(await snapshot(),after);
 assert.equal(await dialog.count(),0);
 console.log('PASS_ARCHIVED_AVATAR_REFUND_ONCE_OFFLINE',page.viewportSize().width);
 await archive.getByRole('button',{name:'Продать питомца',exact:true}).click();
 const sale=page.locator('#mk865SaleDialog > [data-v-app]');
 await sale.getByRole('button',{name:'Продать сейчас +156',exact:true}).click();
 await page.reload();
 assert.deepEqual(await page.evaluate(({avatar,pet})=>({
  coins:state.coins,avatar:mk873Receipt(state,avatar)?.refundCoins,
  pet:state.saleHistory.find(item=>item.id===pet)?.refundCoins,
  sales:state.saleHistory.filter(item=>[avatar,pet].includes(item.id)).length,
 }),fixture),{coins:1176,avatar:400,pet:156,sales:2});
 await page.evaluate(()=>mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME()));
 await page.getByRole('button',{name:'Открыть кошелёк и посмотреть монеты',exact:true}).click();
 const wallet=page.locator('#mk19eWallet[data-v-app]');
 assert.equal((await wallet.locator('.mk19e-balance').innerText()).replace(/[^\d]/g,''),'1176');
 const sales=wallet.locator('.mk19e-transactions');
 await sales.getByText(/Полная компенсация за архивный аватар/).waitFor();
 await sales.getByText(/40% от стоимости покупки/).first().waitFor();
 await wallet.getByRole('button',{name:'Моя коллекция',exact:true}).click();
 await page.getByRole('heading',{name:/Моя коллекция/}).waitFor();
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
}
async function checkArchivedRefundInterruption(browser,address,viewport,failProfileWrite){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
 try{
  const page=await context.newPage();
  await page.goto(address);await idle(page);await page.reload();
  await page.waitForFunction(v=>window.testBuild===v&&!!navigator.serviceWorker.controller,latest);
  const fixture=await page.evaluate(()=>{
   const avatar=SHOP_CATALOG.avatars.find(item=>mk873IsArchivedAvatar(item.id)&&!item.rewardOnly&&item.price>0).id;
   state.coins=620;state.inventory.avatars.push(avatar);state.equipped.avatar=avatar;
   mk865SetAcquisition(state,'avatars',avatar,'store',400,Date.now()-900000);
   save();openCollection();mk873CollectionSwitch('archive');
   return {avatar,transaction:mk873TransactionId(state,avatar)};
  });
  await context.setOffline(true);
  const other=await context.newPage();
  await other.goto(address);
  await other.evaluate(()=>{openCollection();mk873CollectionSwitch('archive')});
  const prepare=async tab=>{
   const archive=tab.locator('#mk872CollectionContent[data-v-app]');
   await archive.getByRole('button',{name:'Вернуть 400 🪙 (100%)',exact:true}).click();
   return tab.getByRole('button',{name:'Вернуть 400 🪙',exact:true});
  };
  const [accept,otherAccept]=await Promise.all([prepare(page),prepare(other)]);
  if(failProfileWrite){
   await Promise.all([page,other].map(tab=>tab.evaluate(()=>{
    // The journal can commit while the profile's localStorage write fails.
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
     if(this===localStorage&&key==='mq4_profiles')throw new DOMException('Interrupted profile write','QuotaExceededError');
     return original.call(this,key,value);
    };
   })));
  }
  await Promise.all([accept.evaluate(button=>button.click()),otherAccept.evaluate(button=>button.click())]);
  if(failProfileWrite){
   await other.getByText(/Возврат записан. Обнови страницу/).waitFor();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mq4_profiles'))[currentProfile].coins),620);
  }
  await other.close({runBeforeUnload:false});
  if(!failProfileWrite){
   // Keep a contender alive through F5 while the closing tab can be holding the lock.
   await page.waitForFunction(async transaction=>!!await mk873RefundJournal('readonly',(store,done)=>{
    const lookup=store.get(transaction);lookup.onsuccess=()=>done(lookup.result);
   }),fixture.transaction);
  }
  await page.keyboard.press('F5');
  const refunded=page.locator('#mk872CollectionContent[data-v-app]').getByRole('button',{name:'Возврат выполнен ✓',exact:true});
  const verify=async()=>{
   await page.reload();
   await refunded.waitFor();
   assert(await refunded.isDisabled());
   const result=await page.evaluate(async ({avatar,transaction})=>{
    const receipts=await mk873RefundJournal('readonly',(store,done)=>{
     const read=store.getAll();read.onsuccess=()=>done(read.result);
    });
    const saved=JSON.parse(localStorage.getItem('mq4_profiles'))[currentProfile];
    return {coins:state.coins,savedCoins:saved.coins,owned:state.inventory.avatars.includes(avatar),
     equipped:state.equipped.avatar,receipt:mk873Ledger(saved)[avatar]?.refundCoins,
     sales:state.saleHistory.filter(row=>row.transactionId===transaction).length,
     journal:receipts.filter(row=>row.receipt.transactionId===transaction).length};
   },fixture);
   assert.deepEqual(result,{coins:1020,savedCoins:1020,owned:false,equipped:'av_default',receipt:400,sales:1,journal:1});
  };
  await verify();
  await verify();
  console.log('PASS_ARCHIVED_AVATAR_INTERRUPTION_OFFLINE',viewport.width,failProfileWrite?'profile-write-failed':'tab-closed');
 }finally{await context.close()}
}
async function checkChestStore(page){
 const before=await page.evaluate(()=>{
  state.coins=600;save();openChestStore861();
  return {coins:state.coins,opened:mk861ChestOpenCount(state)};
 });
 const chest=page.locator('.mk861-chest-page[data-v-app]');
 for(const chance of ['70%','25%','5%'])await chest.getByText(chance,{exact:true}).waitFor();
 const help=chest.getByRole('button',{name:'Справка: chest',exact:true});
 await help.click();
 await page.locator('.mk872-help-dialog[data-v-app]').getByRole('heading',{name:'О сундуке удачи',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#mk872-help-layer').count(),0);
 assert.equal(await help.evaluate(element=>element===document.activeElement),true);
 await chest.getByRole('button',{name:/Открыть за 200/}).click();
 const reveal=page.locator('.mk861-reveal[data-v-app]');
 await reveal.getByRole('button',{name:'Готово',exact:true}).click();
 await chest.locator('.mk861-history-row').first().waitFor();
 const receipt=await page.evaluate(()=>{
  const row=state.chestHistory.at(-1);
  return {opened:state.chestStats.totalOpened,coins:state.coins,compensation:row.compensationCoins,rarity:row.rarity};
 });
 assert.equal(receipt.opened,before.opened+1);
 assert.equal(receipt.coins,before.coins-200+receipt.compensation);
 await page.reload();
 await chest.locator('.mk861-history-row').first().waitFor();
 assert.equal(await page.evaluate(()=>state.chestStats.totalOpened),receipt.opened);
 assert.equal(await page.evaluate(()=>state.coins),receipt.coins);
 assert.equal(await page.evaluate(()=>state.chestHistory.at(-1).rarity),receipt.rarity);
 await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
}
async function checkLearningDialogFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 try{
  await page.goto(address);
  await page.evaluate(()=>{openGrade(4);startQuizStage('moro_missing_sub',0);});
  const frame=page.locator('#schoolAttemptFrame:not([data-v-app])');
  const input=page.locator('#quizInput');
  const layer=page.locator('.mk872-training-dialog:not([data-v-app])');
  const original=await page.evaluate(()=>blockSession.attemptId);
  await input.fill('41');
  await frame.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await layer.getByRole('button',{name:'Остаться в тренировке',exact:true}).click();
  assert.equal(await input.inputValue(),'41');
  await page.reload();
  await layer.getByRole('button',{name:'Продолжить',exact:true}).click();
  assert.equal(await page.evaluate(()=>blockSession.attemptId),original);
  assert.equal(await input.inputValue(),'41');
  assert.equal(await frame.getByRole('progressbar').getAttribute('aria-valuemax'),'5');
  const quiz=page.locator('#qstage:not([data-v-app])');
  await quiz.locator('#quizSkip').press('Enter');
  await layer.getByRole('button',{name:'Да, пропустить задание',exact:true}).press('Enter');
  await quiz.locator('#quizNext').press('Enter');
  assert.equal(await frame.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
  await frame.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await layer.getByRole('button',{name:'Выйти и удалить попытку',exact:true}).click();
  await page.evaluate(()=>openG5FractionMix());
  await page.locator('.vue-report:not([data-v-app])').getByRole('button',{name:'Начать микс',exact:true}).click();
  assert.equal(await frame.getByRole('progressbar').getAttribute('aria-valuemax'),'12');
  console.log('PASS_LEARNING_SHELL_AND_DIALOGS_FALLBACK');
 }finally{await context.close();}
}
async function checkTableExerciseFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  await page.evaluate(()=>{openGrade(4);startTableStage(0)});
  const table=page.locator('#tstage:not([data-v-app])');
  const input=table.getByRole('textbox',{name:'Ответ'});
  await input.fill(await page.evaluate(()=>String(ta*tb)));
  await input.press('Enter');
  await table.getByText(/✅ Верно!/).waitFor();
  await table.locator('#tablePrimary').press('Enter');
  await table.locator('#tableSkip').press('Space');
  await page.getByRole('button',{name:'Да, пропустить задание',exact:true}).press('Enter');
  assert.deepEqual(await page.evaluate(()=>blockSession.items.map(item=>[item.finalCorrect,item.skipped])),[[true,false],[false,true]]);
  console.log('PASS_TABLE_EXERCISE_HTML_FALLBACK');
 }finally{await context.close()}
}
async function checkColumnExerciseFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  await page.evaluate(()=>{openGrade(4);startColumnStage('div',0)});
  const column=page.locator('#stage:not([data-v-app])');
  const first=column.locator('input.qin').first();
  await first.press('Enter');
  await column.getByText(/Заполни обязательные клетки/).waitFor();
  await fillColumnCells(column);
  await first.press('Enter');
  await column.getByText(/✅ Отлично!/).waitFor();
  await column.locator('#columnPrimary').press('Enter');
  // After advancing, wait for the next real skip button. Enter activates a native
  // button on keydown; Space activates on keyup and can race a legacy DOM rerender.
  const nextSkip=column.locator('#columnSkip');
  await nextSkip.waitFor({state:'visible'});
  await nextSkip.press('Enter');
  const skipConfirm=page.getByRole('button',{name:'Да, пропустить задание',exact:true});
  await skipConfirm.waitFor({state:'visible',timeout:10000});
  // The confirmation must not implicitly record a skip before user approval.
  assert.deepEqual(await page.evaluate(()=>blockSession.items.map(item=>[item.finalCorrect,item.skipped])),[[true,false]]);
  await skipConfirm.press('Enter');
  assert.deepEqual(await page.evaluate(()=>blockSession.items.map(item=>[item.finalCorrect,item.skipped])),[[true,false],[false,true]]);
  console.log('PASS_COLUMN_EXERCISE_HTML_FALLBACK');
 }finally{await context.close()}
}
async function checkQuickExerciseFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
  await page.goto(address);
  await page.evaluate(()=>openQuickTrainer('addition'));
  const stage=page.locator('#quickStage:not([data-v-app])');
  await stage.getByRole('button',{name:'Начать тренировку',exact:true}).press('Enter');
  const [example,answer]=await page.evaluate(()=>[quickQuestion.instanceId,String(quickQuestion.correct)]);
  await stage.getByRole('button',{name:answer,exact:true}).press('Space');
  const next=stage.locator('#quickNextBtn');
  assert(await next.evaluate(button=>button===document.activeElement));
  assert.deepEqual(await page.evaluate(()=>quickSessionRecord().items.map(item=>[item.rewardXP,item.rewardCoins])),[[3,1]]);
  await next.press('Enter');
  assert.notEqual(await page.evaluate(()=>quickQuestion.instanceId),example);
  await stage.getByRole('button',{name:'Завершить тренировку',exact:true}).press('Enter');
  const heading=stage.getByRole('heading',{name:'Тренировка завершена!',exact:true});
  await heading.waitFor();
  assert(await heading.evaluate(node=>node===document.activeElement));
  console.log('PASS_QUICK_EXERCISE_HTML_FALLBACK');
 }finally{await context.close()}
}
async function checkAppHeaderFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 try{
  await page.goto(address);
  const header=page.locator('#appHeader:not([data-v-app])');
  const toggle=header.locator('.mk-ui19-nav-toggle');
  const nav=header.locator('#mk-ui19-navigation');
  await header.locator('#mk872TopLevelProgress[role="progressbar"]').waitFor();
  await toggle.press('Enter');
  await nav.waitFor();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  assert(await toggle.evaluate(button=>button===document.activeElement));
  assert(await nav.isHidden());
  await toggle.click();
  await nav.getByRole('button',{name:'Данные',exact:true}).press('Space');
  const dialog=page.locator('#overlay.show #modal');
  await dialog.getByRole('heading',{name:/Данные и резервные копии/}).waitFor();
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await dialog.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await header.locator('.profile-pill').press('Enter');
  await dialog.getByRole('heading',{name:/Профили учеников/}).waitFor();
  console.log('PASS_APP_HEADER_FALLBACK');
 }finally{await context.close()}
}
async function checkPetQuickPanelFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:850}});
 const page=await context.newPage();
 await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 try{
  await page.goto(address);
  await page.evaluate(()=>{
   state.inventory.pets.push('pet_bot');save();openShop('collection');
  });
  const panel=page.locator('#mk19gPetPanel:not([data-v-app])');
  const current=panel.locator('.mk19g-pet-name');
  await panel.locator('[data-pet-choice="pet_bot"]').press('Space');
  await current.getByText('Мини-бот',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>mk854Route().category),'collection');
  await panel.locator('[data-pet-choice="pet_none"]').click();
  await current.getByText('Без питомца',{exact:true}).waitFor();
  await page.reload();
  await current.getByText('Без питомца',{exact:true}).waitFor();
  await panel.getByRole('button',{name:'Посмотреть всех питомцев',exact:true}).click();
  await current.getByText('Без питомца',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>mk854Route().category),'pets');
  console.log('PASS_PET_QUICK_PANEL_FALLBACK');
 }finally{await context.close()}
}
async function checkCollectionNavigationFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:850}});
 const page=await context.newPage();
 await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 try{
  await page.goto(address);
  const fixture=await seedStoreProfile(page);
  const expected=await page.evaluate(()=>{
   state.inventory.pets.push('pet_bot');save();openCollection();
   return mk30WorthLabel(state);
  });
  const heading=page.locator('[data-store-heading]:not([data-v-app])');
  const help=heading.getByRole('button',{name:'Справка: collection',exact:true});
  const preview=page.locator('[data-store-preview]:not([data-v-app]) .profile-preview');
  await expectStorePreview(preview,{...fixture,owned:fixture.owned+1});
  await help.press('Enter');
  await page.locator('#mk872-help-layer').getByRole('heading',{name:'О моей коллекции',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert(await help.evaluate(button=>button===document.activeElement));
  const navigation=page.locator('#mk872CollectionUX .mk872-col-counter-grid:not([data-v-app])');
  const content=page.locator('#mk872CollectionContent:not([data-v-app])');
  const archive=navigation.locator('[data-mk872-collection-tab="archive"]');
  await archive.press('Enter');
  await content.getByRole('heading',{name:/Архивные предметы/}).waitFor();
  assert.equal(await archive.getAttribute('aria-pressed'),'true');
  await page.reload();
  await content.getByRole('heading',{name:/Архивные предметы/}).waitFor();
  assert.equal(await archive.getAttribute('aria-pressed'),'true');
  assert.equal((await page.locator('.mk30-collection-worth strong').innerText()).trim(),expected);
  await expectStorePreview(preview,{...fixture,owned:fixture.owned+1});
  console.log('PASS_COLLECTION_NAVIGATION_AND_STORE_SURFACE_FALLBACK');
 }finally{await context.close()}
}
async function checkStudentQuestFallback(browser,address){
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
 try{
  await page.goto(address);
  await page.locator('.quest-home-card').getByRole('button',{name:'Открыть',exact:true}).click();
  const board=page.locator('#questBoardVue:not([data-v-app])');
  const first=board.locator('.quest-card').first();
  const id=await first.getAttribute('data-quest-id');
  assert.equal(await board.getByRole('progressbar').count(),3);
  await first.getByRole('button',{name:/Заменить/}).click();
  const dialog=page.getByRole('dialog',{name:/Заменить квест/}).locator('.vue-report:not([data-v-app])');
  await dialog.getByRole('button',{name:'Заменить',exact:true}).click();
  assert.notEqual(await first.getAttribute('data-quest-id'),id);
  assert(await first.getByRole('button',{name:/Заменить/}).isDisabled());
  console.log('PASS_STUDENT_QUESTS_FALLBACK');
 }finally{await context.close();}
}
async function checkStudentQuests(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const home=page.locator('#homeDashboard[data-v-app]');
 const board=page.locator('#questBoardVue[data-v-app]');
 const history=board.locator('.quest-history');
 const summary=()=>board.locator('.quest-board-summary b').allTextContents();
 const card=id=>board.locator('[data-quest-id="'+id+'"]');
 const progress=id=>card(id).getByRole('progressbar');
 const open=()=>home.locator('.quest-home-card').getByRole('button',{name:'Открыть',exact:true}).click();
 const back=()=>board.getByRole('button',{name:'← Главный экран',exact:true}).click();
 const getState=()=>page.evaluate(()=>({coins:state.coins,xp:state.xp,quests:state.quests}));
 const reload=async()=>{
  await page.keyboard.press('F5');
  await page.reload();
  await board.getByRole('heading',{name:'🔥 Квесты',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>mk854Route().screen),'quests');
 };
 try{
  await page.goto(address);
  await idle(page);
  await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await open();
  const ids=await page.evaluate(()=>Object.fromEntries(state.quests.active.map(quest=>[quest.templateId,quest.id])));
  await progress(ids.solve5).waitFor();
  assert.deepEqual(await summary(),['3','0','0']);
  assert.equal(await progress(ids.solve5).getAttribute('aria-valuenow'),'0');
  const historyToggle=history.locator('summary');
  await historyToggle.click();
  await history.getByText('История появится после получения первой награды.').waitFor();
  await page.goBack();
  await home.waitFor();
  await page.goForward();
  await progress(ids.solve5).waitFor();
  await back();
  await home.locator('.quick-home button[data-home-action="quick-addition"]').click();
  const exercise=page.locator('#quickStage[data-v-app]');
  await exercise.getByRole('button',{name:'Начать тренировку',exact:true}).click();
  for(let index=0;index<3;index++){
   await exercise.locator('.quick-answer').first().waitFor();
   const answer=await page.evaluate(()=>String(quickQuestion.correct));
   await exercise.getByRole('button',{name:answer,exact:true}).click();
   await exercise.getByText(/✅ Верно!/).waitFor();
   if(index<2)await exercise.getByRole('button',{name:/Следующий пример/}).click();
  }
  await exercise.getByRole('button',{name:'Завершить тренировку',exact:true}).click();
  await exercise.getByRole('heading',{name:'Тренировка завершена!',exact:true}).waitFor();
  await page.locator('.quick-screen .home-back-btn').click();
  await open();
  const claim=card(ids.firstTry3).getByRole('button',{name:/Получить награду/});
  await claim.waitFor();
  assert.equal(await progress(ids.solve5).getAttribute('aria-valuetext'),'3 / 5');
  assert.equal(await progress(ids.firstTry3).getAttribute('aria-valuetext'),'3 / 3');
  assert.deepEqual(await summary(),['2','1','0']);
  const before=await getState();
  await reload();
  assert.deepEqual(await getState(),before);
  assert.equal(await progress(ids.solve5).getAttribute('aria-valuetext'),'3 / 5');
  const reward=before.quests.active.find(quest=>quest.id===ids.firstTry3).reward;
  await historyToggle.click();
  await claim.click();
  const notice=page.locator('#rewardNotice[data-v-app] #rewardPop.show');
  await notice.getByText(/Квест выполнен/).waitFor();
  const historyRows=history.locator('.quest-history-row');
  await historyRows.getByText(/Точно с первой/).waitFor();
  assert.equal(await historyRows.count(),1);
  assert.deepEqual(await summary(),['3','0','1']);
  const claimed=await getState();
  assert.equal(claimed.coins,before.coins+reward.coins);
  assert.equal(claimed.xp,before.xp+reward.xp);
  assert.equal(claimed.quests.history[0].id,ids.firstTry3);
  assert.equal(claimed.quests.history[0].claimed,true);
  await page.evaluate(id=>claimQuest(id),ids.firstTry3);
  await notice.getByText(/Эта награда уже получена/).waitFor();
  assert.deepEqual(await getState(),claimed);

  const replace=card(ids.solve5).getByRole('button',{name:/Заменить/});
  const dialog=page.getByRole('dialog',{name:/Заменить квест/}).locator('.vue-report[data-v-app] .quest-replace-dialog');
  await replace.click();
  await dialog.getByText('Прогресс 3 / 5 будет потерян.',{exact:true}).waitFor();
  assert.equal(await dialog.getByText('Пять заданий',{exact:true}).count(),1);
  await dialog.getByRole('button',{name:'Отмена',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  assert(await replace.evaluate(button=>button===document.activeElement));
  assert.deepEqual(await getState(),claimed);
  await replace.click();
  await dialog.waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert.deepEqual(await getState(),claimed);
  await replace.click();
  await dialog.getByRole('button',{name:'Заменить',exact:true}).click();
  await card(ids.solve5).waitFor({state:'detached'});
  const after=await getState();
  const replacement=after.quests.active.find(quest=>!claimed.quests.active.some(old=>old.id===quest.id));
  assert(replacement);
  assert.notEqual(replacement.templateId,'solve5');
  assert.equal(await progress(replacement.id).getAttribute('aria-valuenow'),'0');
  assert.equal(after.quests.rerollUsed,true);
  assert.equal(after.coins,claimed.coins);
  assert.equal(after.xp,claimed.xp);
  assert.deepEqual(after.quests.history,claimed.quests.history);
  assert.equal(await board.getByRole('button',{name:/Заменить/}).count(),3);
  for(const button of await board.getByRole('button',{name:/Заменить/}).all())assert(await button.isDisabled());

  await reload();
  assert.deepEqual(await getState(),after);
  assert.equal(await card(ids.solve5).count(),0);
  assert.equal(await progress(replacement.id).getAttribute('aria-valuenow'),'0');
  assert(await card(replacement.id).getByRole('button',{name:/Заменить/}).isDisabled());
  await historyToggle.click();
  await historyRows.getByText(/Точно с первой/).waitFor();
  assert.equal(await historyRows.count(),1);
  await back();
  await home.waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS_STUDENT_QUESTS_OFFLINE',viewport.width);
 }finally{await context.close();}
}
async function checkStorageRecovery(browser,address,viewport){
 active=fresh;stale='none';
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500,acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>{errors.push('Unexpected native dialog: '+dialog.message());return dialog.dismiss()});
 const banner=page.locator('#mk-v877-storage-recovery[data-v-app]');
 const view=page.locator('#overlay.show .vue-report[data-v-app]');
 const restore=banner.getByRole('button',{name:'Восстановить из полной копии',exact:true});
 const replace=view.getByRole('button',{name:'Заменить всё',exact:true});
 const corrupt='{"Оборванные данные ученика":\n';
 const snapshot=()=>page.evaluate(()=>({
  guard:mkV877CorruptProfiles,raw:localStorage.getItem('mq4_profiles'),
  rescue:localStorage.getItem('mk_v877_corrupt_profiles_rescue'),
  savedName:localStorage.getItem('mq4_current_profile'),legacy:localStorage.getItem('mq4'),
  settings:localStorage.getItem('mq4_app_settings'),
  active:currentProfile,profiles:Object.keys(profiles).sort().map(name=>[name,profiles[name].profileId,profiles[name].coins,profiles[name].xp])
 }));
 try{
  await page.goto(address);
  await idle(page);
  await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  const backup=await page.evaluate(()=>{
   const first=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:101,xp:492});
   const second=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:509,xp:783});
   first.courseProgress['g4:table']={best:[STAGES[0].need,0,0]};
   profiles={'Проба А':first,'Проба Б':second};
   for(const profile of Object.values(profiles))checkAchievementRewards({profile,silent:true});
   currentProfile='Проба А';state=deepCopy(first);persistSilently();
   return makeBackup('all');
  });
  assert.equal(backup.scope,'all');
  backup.currentProfile='Проба Б';
  const expected=Object.keys(backup.profiles).sort().map(name=>{
   const profile=backup.profiles[name];
   return [name,profile.profileId,profile.coins,profile.xp];
  });
  assert.equal(await banner.count(),0);
  await page.evaluate(raw=>localStorage.setItem('mq4_profiles',raw),corrupt);
  await page.reload();
  await banner.getByRole('alert').getByText(/Данные профилей повреждены/).waitFor();
  await banner.getByRole('alert').getByText(/Автосохранение приостановлено/).waitFor();
  await page.evaluate(()=>persistSilently());
  const before=await snapshot();
  assert.equal(before.guard,true);
  assert.equal(before.raw,corrupt);
  assert.deepEqual(before.profiles,expected.slice(0,1));


  await restore.click();
  await view.getByRole('heading',{name:/Данные и резервные копии/}).waitFor();
  // The warning stays present while the file dialog and its close button remain usable.
  await view.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await view.waitFor({state:'hidden'});
  await restore.click();
  const chooserEvent=page.waitForEvent('filechooser');
  await view.getByRole('button',{name:'Выбрать файл',exact:true}).click();
  const chooser=await chooserEvent;
  await chooser.setFiles({name:'полная-копия.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  for(const name of Object.keys(backup.profiles))await view.locator('.import-plan').getByText(name,{exact:true}).waitFor();
  await view.getByRole('heading',{name:/Предпросмотр восстановления/}).waitFor();
  await view.getByRole('alert').getByText(/Локальные данные повреждены/).waitFor();
  assert.equal(await view.getByRole('button',{name:'Умно объединить',exact:true}).count(),0);
  await view.getByRole('button',{name:'Скачать повреждённые исходные данные',exact:true}).waitFor();
  assert.deepEqual(await snapshot(),before);
  await replace.click();
  await view.getByRole('heading',{name:/Заменить все данные/}).waitFor();
  await view.getByRole('button',{name:'Отмена',exact:true}).click();
  assert.equal((await snapshot()).raw,corrupt);
  assert.equal((await snapshot()).guard,true);
  await page.evaluate(()=>{
   const original=Storage.prototype.setItem;
   window.failStorageWrite='mk_v877_corrupt_profiles_rescue';
   Storage.prototype.setItem=function(key,value){
    if(this===localStorage&&key===window.failStorageWrite)throw new DOMException('Test quota','QuotaExceededError');
    return original.call(this,key,value);
   };
  });
  await replace.click();
  await view.getByRole('button',{name:'Да, восстановить копию',exact:true}).click();
  await view.getByRole('alert').getByText(/Браузер не смог сохранить копию повреждённых данных/).waitFor();
  assert.deepEqual(await snapshot(),before);

  const receipt=page.waitForEvent('download');
  await view.getByRole('button',{name:'Скачать повреждённые исходные данные',exact:true}).click();
  const download=await receipt;
  assert.equal(download.suggestedFilename(),'matkvest_corrupt_profiles_rescue.txt');
  assert.deepEqual(readFileSync(await download.path()),Buffer.from(corrupt));
  assert.equal(await page.evaluate(()=>mkV877RecoveryExported),true);
  assert.equal((await snapshot()).raw,corrupt);

  await page.evaluate(()=>{window.failStorageWrite='mq4_profiles'});
  const retry=view.getByRole('button',{name:'Повторить восстановление',exact:true});
  await retry.click();
  await view.getByRole('alert').getByText(/Браузер не смог записать восстановленные профили/).waitFor();
  const preserved={...before,rescue:corrupt};
  assert.deepEqual(await snapshot(),preserved);
  await page.evaluate(()=>persistSilently());
  assert.deepEqual(await snapshot(),preserved);
  await page.evaluate(()=>{window.failStorageWrite=null});
  await retry.click();
  await view.getByRole('heading',{name:/Профили учеников/}).waitFor();
  await banner.waitFor({state:'detached'});
  const restored=await snapshot();
  assert.equal(restored.guard,false);
  assert.equal(restored.rescue,corrupt);
  assert.equal(restored.active,backup.currentProfile);
  assert.deepEqual(restored.profiles,expected);
  assert.deepEqual(Object.keys(JSON.parse(restored.raw)).sort(),Object.keys(backup.profiles).sort());
  await page.keyboard.press('F5');
  await page.reload();
  assert.equal(await banner.count(),0);
  const after=await snapshot();
  assert.equal(after.guard,false);
  assert.equal(after.rescue,corrupt);
  assert.equal(after.active,backup.currentProfile);
  assert.deepEqual(after.profiles,expected);
  assert.equal(await page.evaluate(()=>profiles['Проба А'].courseProgress['g4:table'].best[0]),backup.profiles['Проба А'].courseProgress['g4:table'].best[0]);
  assert.equal(after.savedName,backup.currentProfile);
  assert.equal(JSON.parse(after.legacy).profileId,backup.profiles[backup.currentProfile].profileId);
  assert.deepEqual(errors,[]);
  console.log('PASS_STORAGE_RECOVERY_OFFLINE',viewport.width);
 }finally{await context.close()}
}
async function run(browser,address,viewport){
 active=old;stale='none';retries=new Set();
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(address);
  await checkHome(page,'Пройдено тем: 0/74 • этапов: 0/222');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>null));
  await page.evaluate(()=>{
   progressFor('g5:area_units_g5').best=STAGES.map(stage=>stage.need);
   save();
  });
  await page.reload();
  await checkHome(page,'Пройдено тем: 1/74 • этапов: 3/222');
  await check(page,first,{enterGrade:true});
  await page.evaluate(()=>localStorage.setItem('verifiedRefreshProbe','saved'));
  active=fresh;stale='all';
  const rejected=await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration();
   const installed=new Promise(resolve=>registration.addEventListener('updatefound',()=>{
    const candidate=registration.installing;
    candidate.addEventListener('statechange',()=>{
     if(candidate.state==='redundant'||candidate.state==='activated')resolve(candidate.state);
    });
   },{once:true}));
   await registration.update();
   return installed;
  });
  assert.equal(rejected,'redundant');
  await idle(page);
  await page.reload();
  assert.equal(await check(page,first),'saved');
  stale='unversioned';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await check(page,latest);
  assert(retries.has('index.html')&&retries.has(marker),'Build-specific retry did not verify stale CDN resources');
  stale='all';
  await page.keyboard.press('F5');
  // Headless Chromium may leave browser shortcuts to the host. Navigate the same
  // route with a browser reload even on hosts that do not forward F5.
  await page.reload();
  assert.equal(await check(page,latest),'saved');
  await page.goBack();
  await checkHome(page,'Пройдено тем: 1/74 • этапов: 3/222');
  await page.reload();
  await checkHome(page,'Пройдено тем: 1/74 • этапов: 3/222');
  await page.goto(address+'index.html');
  assert.equal(await check(page,latest,{enterGrade:true}),'saved');
  await ctx.setOffline(true);
  await page.reload();
  assert.equal(await check(page,latest),'saved');
  if(hashes['assets/ui/knowledge-map.js']){
   await page.evaluate(()=>mk854PushAndRender({screen:'home'},()=>MK854_CORE_RENDER_HOME()));
   await checkSharedRewardsAndFooter(page);
   await checkAppHeader(page);
   await page.evaluate(()=>openKnowledgeMap());
   await page.locator('#knowledgeMapVue[data-v-app] .knowledge-card').first().waitFor();
   await checkOfflineQuiz(page);
   await checkOfflineGrade4Block(page);
   await checkReviewExercises(page);
   await checkQuickExercises(page);
   await checkHomeDashboard(page);
   await checkGoalConfirmations(page);
   await checkTrainingPlan(page);
   await checkQuickTrainingPlan(page);
   await checkStudentProfiles(page);
   await checkLeaderboard(page);
   await checkAchievementCatalog(page);
   await checkBackupDialogs(page);
   await checkStoreCatalog(page);
   await checkCollectionSection(page);
   await checkArtworkViewer(page);
   await checkArchivedRefunds(page);
   await checkChestStore(page);
   await checkTeacherPinDialog(page);
   await checkOfflineMixRestart(page);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_VERIFIED_REFRESH',JSON.stringify({width:viewport.width,first,latest,online:true,offline:true,offlineQuiz:true,storedProgress:true}));
 }finally{await ctx.close();}
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port+'/matkvest/';
  assert.equal(digest(html),worker.match(/const APP_BUILD_HASH = "([^"]+)";/)[1]);
  const verifiedScripts=[...html.matchAll(/<script src="((?:g5-[\w-]+|g[123478]-textbook)\.js)\?v=\d+"><\/script>/g)].map(match=>match[1]);
  assert.equal(verifiedScripts.filter(name=>name.startsWith('g5-')).length,19);
  const knowledgeMap=html.match(/const knowledgeMapUrl = "\.\/(assets\/ui\/knowledge-map\.js)\?v=\d+";/);
  if(knowledgeMap)verifiedScripts.push(knowledgeMap[1]);
  const routeCore=html.match(/<script src="\.\/(assets\/ui\/legacy-navigation-core\.js)\?v=\d+"><\/script>/);
  if(routeCore)verifiedScripts.push(routeCore[1]);
  assert.deepEqual(Object.keys(hashes).sort(),verifiedScripts.sort());
  for(const [name,hash] of Object.entries(hashes))assert.equal(digest(readFileSync(name)),hash,name);
  await checkTeacherPinFallback(browser,origin);
  await checkStudentQuestFallback(browser,origin);
  await checkLearningDialogFallback(browser,origin);
  await checkQuickExerciseFallback(browser,origin);
  await checkTableExerciseFallback(browser,origin);
  await checkColumnExerciseFallback(browser,origin);
  await checkHomeActions(browser,origin,{width:390,height:850},false);
  await checkQuickSetupActions(browser,origin,{width:390,height:850},false);
  await checkQuickResultActions(browser,origin,{width:390,height:850},false);
  const withoutVue=await browser.newContext({serviceWorkers:'block'});
  try{
   const page=await withoutVue.newPage();
   await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
   await page.goto(origin);
   await checkGoalConfirmations(page,false);
  }finally{await withoutVue.close()}
  active=fresh;stale='none';
  const fallback=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:650},isMobile:true,hasTouch:true});
  try{
   const page=await fallback.newPage();
   await page.route('**/assets/ui/knowledge-map.js?*',route=>route.abort());
   await page.goto(origin);
   await checkSharedRewardsAndFooter(page,false);
  }finally{await fallback.close()}
  await checkAppHeaderFallback(browser,origin);
  await checkPetQuickPanelFallback(browser,origin);
  await checkCollectionNavigationFallback(browser,origin);
  await checkDeveloperTools(browser,origin,{width:390,height:850},false);
  for(const width of [390,1280]){
   const viewport={width,height:850};
   await run(browser,origin,viewport);
   await checkQuizChoiceEvents(browser,origin,viewport);
   await checkTableVueEvents(browser,origin,viewport);
   await checkColumnVueEvents(browser,origin,viewport);
   await checkHomeActions(browser,origin,viewport);
   await checkQuickSetupActions(browser,origin,viewport);
   await checkQuickResultActions(browser,origin,viewport);
   await checkArchivedRefundInterruption(browser,origin,viewport,false);
   await checkArchivedRefundInterruption(browser,origin,viewport,true);
   await checkDeveloperTools(browser,origin,viewport);
   await checkPetQuickPanel(browser,origin,viewport);
   await checkCollectionEconomy(browser,origin,viewport);
   await checkStoreSurface(browser,origin,viewport);
   await checkTeacherActions(browser,origin,viewport);
   await checkStudentQuests(browser,origin,viewport);
   await checkStorageRecovery(browser,origin,viewport);
  }
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
