import {accountStore as store} from './account_store.mjs?v=290';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const button=(label,action)=>{const b=el('button',label);b.type='button';b.className='btn soft';b.addEventListener('click',action);return b;};
const host=document.getElementById('mk95-account-entry');
const dialog=el('dialog');dialog.className='mk95-account-dialog';dialog.setAttribute('aria-labelledby','mk95-account-title');
const title=el('h2','Аккаунт МатКвест');title.id='mk95-account-title';
const content=el('section');const note=el('p');note.setAttribute('role','status');
const close=button('Закрыть',()=>dialog.close());dialog.append(title,note,content,close);document.body.append(dialog);
const entry=button('Аккаунт',()=>{dialog.showModal();if(['local','offline','error','signed-out'].includes(store.read().status))store.resume();});
host.append(entry);
function render(s){
 if(!dialog.open)return;
 content.replaceChildren();
 note.textContent=({connecting:'Подключение…',loading:'Загрузка данных ученика…',offline:'Сервер недоступен. Локальное обучение продолжает работать.',error:'Не удалось получить данные. Локальные данные не изменены.',ready:'Подтверждённые данные сервера. Локальное обучение пока отдельно.',select:'Выберите серверного ученика.', 'signed-out':'Войдите в аккаунт ученика.', 'unsupported-role':'В этом этапе доступен только аккаунт ученика.', 'logout-unconfirmed':'Выход на сервере не подтверждён. Закройте браузер или повторите после подключения.'})[s.status]||'';
 if(s.user){
  const select=el('select');select.setAttribute('aria-label','Серверный ученик');
  const prompt=el('option','Выберите ученика');prompt.value='';prompt.disabled=true;select.append(prompt);
  for(const p of s.profiles){const o=el('option',p.display_name);o.value=p.id;select.append(o);}
  select.value=s.selectedId||'';select.addEventListener('change',()=>store.select(select.value));
  content.append(select,button('Выйти',()=>store.logout()));
  if(!s.profiles.length)content.append(el('p','Нет серверных профилей. Их создание и перенос — следующий шаг.'));
  if(s.snapshot){
   const {profile,wallet,progress}=s.snapshot;
   content.append(el('h3',profile.display_name),el('p',profile.xp_total+' XP · '+wallet.balance+' монет'),el('p','Записей прогресса: '+progress.course_progress.length));
  }
  if(s.status==='offline'||s.status==='error')content.append(button('Повторить',()=>store.resume()));
 }else if(!['connecting','loading'].includes(s.status)){
  const form=el('form');const email=el('input');email.type='email';email.required=true;email.autocomplete='username';email.setAttribute('aria-label','Электронная почта');
  const password=el('input');password.type='password';password.required=true;password.autocomplete='current-password';password.setAttribute('aria-label','Пароль');
  const submit=el('button','Войти');submit.type='submit';submit.className='btn primary';
  form.append(email,password,submit);form.addEventListener('submit',e=>{e.preventDefault();const secret=password.value;password.value='';store.login(email.value,secret);});
  content.append(form,button('Повторить подключение',()=>store.resume()));
 }
}
store.subscribe(render);dialog.addEventListener('close',()=>entry.focus());entry.addEventListener('click',()=>render(store.read()));
