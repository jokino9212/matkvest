import {createAccountStore} from './account_store.mjs?v=293';
import {MatKvestApiClient} from './stage29_api_client.mjs?v=293';
import {createTableTraining} from './table_training.mjs?v=293';
const modeKey='mk95-mode',selectionKey='mk95-selection',eventKey='mk95-auth-change',logoutKey='mk95-logout-pending';
function sessionGet(key){try{return sessionStorage.getItem(key)}catch{return null}}
function sessionSet(key,value){try{if(value===null)sessionStorage.removeItem(key);else sessionStorage.setItem(key,value)}catch{}}
let mode=document.documentElement.dataset.mk95Mode==='server'?'server':'local';
const api=new MatKvestApiClient();
const store=createAccountStore(api,{
 loadSelection:()=>{try{return JSON.parse(sessionGet(selectionKey)||'null')}catch{return null}},
 saveSelection:v=>sessionSet(selectionKey,v?JSON.stringify(v):null),
 loadLogoutPending:()=>{try{return localStorage.getItem(logoutKey)==='1'}catch{return null}},
 saveLogoutPending:v=>{try{if(v)localStorage.setItem(logoutKey,'1');else localStorage.removeItem(logoutKey)}catch{}},
 authChanged:()=>{try{localStorage.setItem(eventKey,crypto.randomUUID())}catch{}}
});
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const button=(label,action)=>{const b=el('button',label);b.type='button';b.className='btn soft';b.addEventListener('click',action);return b};
const entryHost=document.getElementById('mk95-account-entry');
const dialog=el('dialog');dialog.className='mk95-account-dialog';dialog.setAttribute('aria-labelledby','mk95-account-title');dialog.dataset.mk95Server='';
const title=el('h2','Аккаунт МатКвест');title.id='mk95-account-title';
const content=el('section'),note=el('p');note.setAttribute('role','status');
dialog.append(title,note,content,button('Закрыть',()=>dialog.close()));document.body.append(dialog);
const messages={local:'Локальный режим',connecting:'Проверка сессии…',loading:'Загрузка данных ученика…',offline:'Нет связи. Серверные данные недоступны; локальное обучение можно открыть отдельно.',error:'Не удалось получить данные. Повторите подключение.',ready:'Данные подтверждены сервером.',select:'Выберите ученика.', 'signed-out':'Войдите в аккаунт ученика.', 'unsupported-role':'Пока доступен только аккаунт ученика.', 'logout-unconfirmed':'Выход не подтверждён. Серверные данные скрыты до завершения выхода.', 'session-changed':'Сессия изменилась в другой вкладке. Подключитесь заново.'};
const read=()=>{const s=store.read();if(s.snapshot)s.snapshot.level=window.mk872GetLevelProgress(s.snapshot.profile.xp_total);return {...s,available:true,mode,message:messages[s.status]||'',table:table.read()}};
const closeReport=()=>{const overlay=document.getElementById('overlay');if(overlay?.dataset.mk95Report){delete overlay.dataset.mk95Report;overlay.classList.remove('show');document.getElementById('modal').replaceChildren()}};
const reportOverlay=document.getElementById('overlay');
new MutationObserver(()=>{if(reportOverlay.dataset.mk95Report&&!reportOverlay.classList.contains('show'))closeReport()}).observe(reportOverlay,{attributes:true,attributeFilter:['class']});
const emit=()=>window.dispatchEvent(new Event('mk95-account-change'));
const table=createTableTraining({api,store,mode:()=>mode,emit,sessionGet,sessionSet});
function local(){table.pause();closeReport();mode='local';sessionSet(modeKey,null);sessionSet(selectionKey,null);delete document.documentElement.dataset.mk95Mode;store.invalidate('local');dialog.close();emit();}
function open(){
 if(mode==='local'){
  if(window.mk854Route?.().screen!=='home'||window.mk872HasActiveLearning?.()){alert('Сначала вернитесь на главную, сохранив текущую тренировку.');return}
  window.closeModal();mode='server';sessionSet(modeKey,'server');document.documentElement.dataset.mk95Mode='server';emit();
 }
 if(!dialog.open)dialog.showModal();
 render(store.read());
 if(['local','offline','error','signed-out','session-changed'].includes(store.read().status))store.resume();
}
function report(kind){
 if(mode!=='server')return;
 const s=read();
 if(!s.snapshot){open();return}
 const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const name=s.snapshot.profile.display_name;
 const model=kind==='progress'?{serverReadOnly:true,title:'Мой учебный прогресс — '+name,profileName:name,totalXP:s.snapshot.profile.xp_total,courses:s.snapshot.progress.course_progress}:{serverReadOnly:true,title:'Журнал попыток — '+name,rows:s.snapshot.history.attempts.map(r=>({id:r.id,title:r.title,status:({finished:'Завершена',interrupted:'Прервана',abandoned:'Прервана',incomplete_backup:'Незавершённая копия'})[r.status]||'Запись',date:r.date?new Date(r.date).toLocaleString('ru-RU'):'—',source:r.source==='backup'?'Из копии':'Сервер',score:(r.correct??'—')+'/'+(r.total??'—')})),more:s.snapshot.history.next_offset!==null};
 const rows=kind==='progress'?model.courses.map(r=>escape(r.course_key)+' · этап '+escape(r.stage_index+1)+' · '+escape(r.best_score)):model.rows.map(r=>escape(r.title)+' · '+escape(r.score)+' · '+escape(r.date));
 const fallback='<div class="mtop"><h2>'+escape(model.title)+'</h2><button type="button" class="x" data-report-close aria-label="Закрыть окно">×</button></div><div data-mk95-server>'+ (rows.length?rows.map(r=>'<p>'+r+'</p>').join(''):'<p>Пока нет записей.</p>')+'</div>';
 const overlay=document.getElementById('overlay');overlay.dataset.mk95Report='true';
 window.showVueReport(kind==='progress'?'mountStudentProgress':'mountAttemptJournal',model,{close:closeReport},fallback);
}
function render(s){
 if(!dialog.open)return;
 content.replaceChildren();note.textContent=messages[s.status]||'';
 if(store.logoutPending()){
  content.append(button('Завершить выход',()=>store.logout()));
 }else if(s.user){
  const select=el('select');select.setAttribute('aria-label','Серверный ученик');const prompt=el('option','Выберите ученика');prompt.value='';prompt.disabled=true;select.append(prompt);
  for(const p of s.profiles){const o=el('option',p.display_name);o.value=p.id;select.append(o)}
  select.value=s.selectedId||'';select.addEventListener('change',()=>store.select(select.value));content.append(select,button('Выйти',()=>store.logout()));
  if(!s.profiles.length)content.append(el('p','Нет серверных профилей. Создание и перенос пока не подключены.'));
  if(s.status==='offline'||s.status==='error')content.append(button('Повторить',()=>store.resume()));
 }else if(s.status!=='connecting'){
  const form=el('form'),email=el('input'),password=el('input');email.type='email';email.required=true;email.autocomplete='username';email.setAttribute('aria-label','Электронная почта');password.type='password';password.required=true;password.autocomplete='current-password';password.setAttribute('aria-label','Пароль');
  const submit=el('button','Войти');submit.type='submit';submit.className='btn primary';
  form.append(email,password,submit);form.addEventListener('submit',e=>{e.preventDefault();const secret=password.value;password.value='';store.login(email.value,secret)});
  content.append(form,button('Повторить подключение',()=>store.resume()));
  if(['offline','session-changed','error'].includes(s.status))content.append(button('Выйти из аккаунта',()=>store.logout()));
 }
 content.append(button('Локальный режим',local));
}
store.subscribe(s=>{closeReport();render(s);table.onAccount();emit()});
entryHost.append(button('Аккаунт',open));
window.MK95Account={read,open,local,home:()=>{table.pause();closeReport()},progress:()=>report('progress'),journal:()=>report('journal'),tableOpen:table.open,tablePause:table.pause,tableAction:table.action,tableSync:table.sync};
window.addEventListener('storage',e=>{if((e.key===eventKey||e.key===logoutKey)&&mode==='server')store.invalidate('session-changed')});
window.addEventListener('offline',()=>{if(mode==='server')store.invalidate('offline')});
window.addEventListener('online',()=>{if(mode==='server'&&store.logoutPending())store.invalidate('logout-unconfirmed');else if(mode==='server'&&store.read().status==='offline')store.resume()});
window.addEventListener('focus',()=>{if(mode==='server'&&store.read().status==='ready'&&!dialog.open)store.resume()});
emit();if(mode==='server')store.resume();
