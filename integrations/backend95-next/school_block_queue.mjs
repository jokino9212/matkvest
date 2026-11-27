// Shared numeric, choice and written-arithmetic Grade 4 offline journals.
export const SCHOOL_TOPICS=Object.freeze({
 'g4:table':'Таблица умножения',
 'g4:moro_order_1000':'Числовые выражения. Порядок действий',
 'g4:order':'Порядок действий',
 'g4:equations':'Выражения и уравнения',
 'g4:moro_missing_sub':'Неизвестное уменьшаемое и вычитаемое',
 'g4:moro_missing_add':'Неизвестное слагаемое',
 'g4:moro_missing_muldiv':'Неизвестный множитель, делимое и делитель',
 'g4:column:add':'Сложение столбиком', 'g4:column:sub':'Вычитание столбиком',
 'g4:column:mul':'Умножение столбиком', 'g4:column:div':'Деление уголком',
 'g5:natural_compare':'Сравнение натуральных чисел',
 'g5:natural_add':'Сложение натуральных чисел и его свойства',
 'g5:natural_subtract':'Вычитание натуральных чисел',
 'g5:natural_multiply':'Умножение натуральных чисел и его свойства',
 'g5:natural_divide':'Деление натуральных чисел',
 'g5:frac_to_mixed':'Неправильная дробь → смешанное число',
 'g5:mixed_to_frac':'Смешанное число → неправильная дробь'
});
export const STAGES=['Разминка','Тренировка','Мастерство'];
export const COUNTS=[5,7,10], PASS=[4,5,8];
export const stageOf=row=>row.stage??0;
export const expectedAnswer=(topic,question)=>topic==='g4:table'?question.a*question.b:question.answer;
export function stageAllowed(best,stage){return Number.isInteger(stage)&&stage>=0&&stage<3&&(stage===0||Number(best?.[stage-1]||0)>=PASS[stage-1]);}
export const isColumn=topic=>/^g4:column:(add|sub|mul|div)$/.test(topic);
export const isFraction=topic=>topic==='g5:frac_to_mixed'||topic==='g5:mixed_to_frac';
export const maxDigits=topic=>isFraction(topic)||['g5:natural_multiply','g5:natural_divide'].includes(topic)?6:topic==='g4:table'?3:4;
export const gradeOf=topic=>Number(topic[1]);
export function validateQuestion(topic,question,columnKeys){
 if(isColumn(topic)){
  const {a,b}=question,op=topic.split(':').at(-1);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<=0||b<=0||a>99999||b>99999||(op==='sub'&&a<=b)||(op==='mul'&&(b<10||b>99||a>9999))||(op==='div'&&(b<2||b>9||a%b!==0)))throw Error('INVALID_COLUMN_QUESTION');
  if(!Array.isArray(columnKeys)||columnKeys.length!==2)throw Error('INVALID_COLUMN_KEYS');
  const [required,optional]=columnKeys;
  for(const map of columnKeys){
   if(!map||Array.isArray(map)||typeof map!=='object')throw Error('INVALID_COLUMN_KEYS');
   for(const [key,value] of Object.entries(map))if(!/^(final|addMark|subMark|borrowDot|mul1|mul2|mulCarry1|mulCarry2|mulFinalCarry|quot|prod[0-9]+|next[0-9]+|rem[0-9]+):[0-9]+$/.test(key)||typeof value!=='string'||!/^([0-9•])?$/.test(value))throw Error('INVALID_COLUMN_KEYS');
  }
  if(!Object.keys(required).length||Object.values(required).some(v=>!/^\d$/.test(v))||Object.keys(required).some(k=>Object.hasOwn(optional,k)))throw Error('INVALID_COLUMN_KEYS');
  return {a,b,columnKeys:[required,optional]};
 }
 if(topic==='g4:table'){
  const {a,b}=question;if(!Number.isInteger(a)||!Number.isInteger(b)||a<2||b<2||a>9||b>9)throw Error('INVALID_QUESTION');
  return {a,b};
 }
 const {expression,answer,steps,choices,choice_labels,place_values,form,prompt_markup}=question;
 if(typeof expression!=='string'||!expression||expression.length>500||!Number.isInteger(answer)||answer<0||answer>=10**maxDigits(topic)||!Array.isArray(steps)||steps.some(x=>typeof x!=='string'))throw Error('INVALID_QUESTION');
 if(isFraction(topic)){
  if(!form||!['number','mixed','improper'].includes(form.kind)||typeof prompt_markup!=='string'||prompt_markup.length>100000||choices!==undefined)throw Error('INVALID_FRACTION');
  if(form.kind==='number'?form.denominator!==null:!Number.isInteger(form.denominator)||form.denominator<1||form.denominator>answer||(form.kind==='mixed'&&answer%form.denominator===0))throw Error('INVALID_FRACTION');
  return {expression,answer,steps,form:{kind:form.kind,denominator:form.denominator,label:typeof form.label==='string'?form.label:''},prompt_markup};
 }
 if(choice_labels!==undefined&&(topic!=='g5:natural_compare'||JSON.stringify(choice_labels)!==JSON.stringify(['<','=','>'])||JSON.stringify(choices)!==JSON.stringify([0,1,2])))throw Error('INVALID_CHOICE_LABELS');
 if(place_values!==undefined&&(topic!=='g5:natural_compare'||!Array.isArray(place_values)||place_values.length!==2||place_values.some(x=>typeof x!=='string'||!/^\d{1,4}$/.test(x))||place_values[0].length!==place_values[1].length))throw Error('INVALID_PLACE_VALUES');
 if(choices!==undefined&&(!Array.isArray(choices)||!choices.includes(answer)||new Set(choices).size!==choices.length||choices.some(x=>!Number.isInteger(x)||x<0||x>9999)))throw Error('INVALID_CHOICES');
 return {expression,answer,steps,...(choices?{choices}:{}),...(choice_labels?{choice_labels}:{}),...(place_values?{place_values}:{})};
}
// The existing backend issues questions/permits and grades the full journal.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validId = x => typeof x === 'string' && uuid.test(x);
const keyOf = (owner, profile, pack) => JSON.stringify([owner, profile, pack]);
const identity = s => s?.status === 'ready' && s.user?.id && s.selectedId === s.snapshot?.profile?.id && s.user.role === 'student'
  ? {owner:s.user.id,profile:s.selectedId} : null;
export function createSchoolBlockQueue({api, store, outbox}) {
  const same = (owner,profile) => {const s=identity(store.read());return s?.owner===owner && s.profile===profile && !store.logoutPending?.();};
  async function begin({pack,startedAt,permit}) {
    const s=identity(store.read());
    if(!s || !same(s.owner,s.profile) || !validId(s.owner) || !validId(s.profile)) throw Error('PROFILE_NOT_READY');
    if(!validId(pack?.id) || !Object.hasOwn(SCHOOL_TOPICS,pack.topic_id) || !Number.isInteger(pack.stage) || pack.stage<0 || pack.stage>2 || !Array.isArray(pack.questions) || pack.questions.length!==COUNTS[pack.stage]) throw Error('INVALID_BLOCK');
    if(typeof startedAt!=='string' || !Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(pack.expires_at)) || Date.parse(startedAt)>=Date.parse(pack.expires_at) || (!pack.full && !validId(permit))) throw Error('INVALID_START');
    const start={started_at:startedAt,...(!pack.full?{permit}:{})};
    const questions=pack.questions.map((question,i)=>validateQuestion(pack.topic_id,question,pack.column_keys?.[i]));
    const row={key:keyOf(s.owner,s.profile,pack.id),owner:s.owner,profile:s.profile,pack:pack.id,topic:pack.topic_id,stage:pack.stage,count:pack.questions.length,start,status:'draft',questions,index:0,revision:0,draft:questions.map(()=>({answer:'',cells:{},checks:[],skipped:false,solved:false}))};
    return outbox.insert(row); // persist immutable identity and start before going offline
  }
  async function complete(key,items){
    // The key is recovered from the existing local draft. Local completion is not
    // a server authorization; flush independently verifies the cookie-bound owner.
    return outbox.complete(key,structuredClone(items));
  }
  const active=new Map();
  async function flush() {
    const s=identity(store.read());if(!s || !same(s.owner,s.profile))return [];
    const scope=keyOf(s.owner,s.profile,'');
    if(active.has(scope))return active.get(scope);
    const run=(async()=>{
      let actor;try{actor=await api.resumeSession()}catch{return [];}
      if(actor?.id!==s.owner || actor.role!=='student' || !same(s.owner,s.profile))return [];
      const sent=[];
      for(const row of await outbox.list(s.owner,s.profile)){
        if(row.status!=='pending' || !same(s.owner,s.profile))continue;
        try{
          const receipt=await api.request('PUT','/student/profiles/'+encodeURIComponent(row.profile)+'/offline-school/'+encodeURIComponent(row.pack),{body:row.body});
          if(receipt?.id!==row.pack || receipt.status!=='finished')throw Error('INVALID_RECEIPT');
          await outbox.settle(row.key,'confirmed',receipt);sent.push(row.key);
        }catch(error){
          // No deletion on errors, including a response lost after server commit.
          // 401/403 may mean a changed session; do not mark the journal as permanently rejected.
          if([409,422].includes(error.status))await outbox.settle(row.key,'blocked',{code:error.code||'REJECTED'});
          break;
        }
      }
      return sent;
    })().finally(()=>active.delete(scope));
    active.set(scope,run);return run;
  }
  return {begin,complete,flush};
}
// One transaction applies the input/check/advance and creates the immutable final
// journal. No separate completion write can be lost during F5.
export function columnFeedback(question,raw){
 const [required,optional]=question.columnKeys,keys={...required,...optional};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_CELLS');
 const cells={};
 for(const [key,value] of Object.entries(raw)){
  if(!Object.hasOwn(keys,key)||typeof value!=='string'||!/^([0-9•])?$/.test(value))throw Error('INVALID_CELLS');
  if(value)cells[key]=value;
 }
 const missing=Object.keys(required).filter(key=>!cells[key]);
 const wrong=missing.length?[]:Object.keys(cells).filter(key=>cells[key]!==keys[key]);
 return {cells,missing,wrong};
}
// Match the original §31 grade_conversion contract; equality alone is insufficient.
export function fractionFeedback(question,raw){
 const {kind,denominator}=question.form;
 const expected=kind==='number'?{'answer:0':question.answer}:kind==='mixed'?{'fraction:0':Math.floor(question.answer/denominator),'fraction:1':question.answer%denominator}:{'fraction:1':question.answer};
 const allowed=kind==='number'?['answer:0']:['fraction:0','fraction:1','fraction:2'];
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_CELLS');
 const cells={};
 for(const [key,value] of Object.entries(raw)){
  if(!allowed.includes(key)||typeof value!=='string'||!/^\d{0,6}$/.test(value))throw Error('INVALID_CELLS');
  if(value)cells[key]=value;
 }
 const missing=Object.keys(expected).filter(key=>!Object.hasOwn(cells,key));
 const wrong=missing.length?[]:Object.keys(expected).filter(key=>Number(cells[key])!==expected[key]);
 if(!missing.length&&kind==='improper'&&Object.hasOwn(cells,'fraction:0'))wrong.push('fraction:0');
 if(!missing.length&&kind!=='number'&&Object.hasOwn(cells,'fraction:2')&&Number(cells['fraction:2'])!==denominator)wrong.push('fraction:2');
 return {cells,missing,wrong};
}
export function applyColumnAction(row,revision,kind,value){
 if(row.status!=='draft'||row.revision!==revision)throw Error('DRAFT_CHANGED');
 const next=structuredClone(row),item=next.draft[next.index],question=next.questions[next.index];
 if((kind==='input'||kind==='check'||kind==='skip')&&!item.solved){
  const f=isFraction(next.topic)?fractionFeedback(question,value):columnFeedback(question,value);item.cells=f.cells;
  if(kind==='input'){item.feedback='';item.wrong=[];item.missing=[];}
  if(kind==='check'){
   item.missing=f.missing;item.wrong=f.wrong;
   if(f.missing.length)item.feedback='Заполни обязательные клетки.';
   else {
    if(item.checks.length>=1000)throw Error('CHECK_LIMIT');
    item.checks.push(f.cells);item.solved=f.wrong.length===0;
    item.feedback=item.solved?'Вся запись верна!':'Исправь отмеченные клетки.';
   }
  }
  if(kind==='skip')item.skipped=true;
 }else if(kind!=='advance'||!item.solved)throw Error('INVALID_ACTION');
 if(kind==='advance'||kind==='skip'){
  if(next.index+1===next.count){
   next.body={...next.start,items:next.draft.map(x=>({checks:x.checks,skipped:x.skipped,...(x.skipped?{cells:x.cells||{}}:{})}))};
   next.status='pending';
  }else next.index++;
 }
 next.revision++;return next;
}
export function applyTableAction(row,revision,kind,value){
 if(isColumn(row.topic)||isFraction(row.topic))return applyColumnAction(row,revision,kind,value);
 if(row.status!=='draft'||row.revision!==revision)throw Error('DRAFT_CHANGED');
 const next=structuredClone(row),item=next.draft[next.index],question=next.questions[next.index];
 const numeric=String(value??'').replace(/[^0-9]/g,'').slice(0,maxDigits(next.topic));
 if(kind==='input'&&!item.solved){item.answer=numeric;item.feedback='';}
 else if(kind==='check'&&!item.solved){
  item.answer=numeric;
  if(!numeric){item.feedback='Введи ответ.';}
  else{
   if(item.checks.length>=1000)throw Error('CHECK_LIMIT');
   if(question.choices&&!question.choices.includes(Number(numeric)))throw Error('INVALID_CHOICE');
   item.checks.push({'answer:0':numeric});
   item.solved=Number(numeric)===expectedAnswer(next.topic,question);
   item.feedback=item.solved?'Верно!':'Проверь ответ и попробуй ещё раз.';
  }
 }else if((kind==='advance'&&item.solved)||(kind==='skip'&&!item.solved)){
  if(kind==='skip'){item.answer=question.choices&&!question.choices.includes(Number(numeric))?'':numeric;item.skipped=true;}
  if(next.index+1===next.count){
   next.body={...next.start,items:next.draft.map(x=>({checks:x.checks,skipped:x.skipped,...(x.skipped&&x.answer?{cells:{'answer:0':x.answer}}:{})}))};
   next.status='pending';
  }else next.index++;
 }else throw Error('INVALID_ACTION');
 next.revision++;return next;
}
export function indexedSchoolOutbox(indexedDB=globalThis.indexedDB, databaseName='matkvest-backend95-block-outbox'){
  const opened=new Promise((resolve,reject)=>{
    const r=indexedDB.open(databaseName,1);
    r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  async function transact(mode,work){const db=await opened;return new Promise((resolve,reject)=>{
    const tx=db.transaction('blocks',mode),s=tx.objectStore('blocks');let value,err;
    const finish=x=>{value=x;};const fail=e=>{err=e;tx.abort();};
    tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(err||tx.error||Error('OUTBOX_ABORTED'));
    try{work(s,finish,fail)}catch(e){fail(e)}
  });}
  return {
    insert(row){return transact('readwrite',(s,done,fail)=>{const r=s.getAll();r.onsuccess=()=>{const old=r.result.find(x=>x.key===row.key);if(old){if(JSON.stringify(old.start)!==JSON.stringify(row.start)||old.count!==row.count||JSON.stringify(old.context)!==JSON.stringify(row.context)||old.topic!==row.topic||stageOf(old)!==stageOf(row))return fail(Error('BLOCK_START_CONFLICT'));done(old);return;}if(r.result.some(x=>x.owner===row.owner&&x.profile===row.profile&&(x.status==='draft'||x.status==='pending')))return fail(Error('BLOCK_ALREADY_ACTIVE'));if(row.start.permit&&r.result.some(x=>x.owner===row.owner&&x.profile===row.profile&&x.start.permit===row.start.permit))return fail(Error('PERMIT_ALREADY_ASSIGNED'));s.add(row);done(row);};});},
    act(key,revision,kind,value){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{try{if(!r.result)throw Error('BLOCK_MISSING');const next=applyTableAction(r.result,revision,kind,value);s.put(next);done(next);}catch(e){fail(e)}};});},
    complete(key,items){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row||!Array.isArray(items)||items.length!==row.count)return fail(Error('INVALID_BLOCK'));const body={items,...row.start};if(row.status!=='draft'){if(JSON.stringify(row.body)!==JSON.stringify(body))return fail(Error('BLOCK_BODY_CONFLICT'));done(row);return;}const next={...row,body,status:'pending'};s.put(next);done(next);};});},
    list(owner,profile){return transact('readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result.filter(x=>x.owner===owner&&x.profile===profile));});},
    settle(key,status,receipt){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row)return fail(Error('BLOCK_MISSING'));if(row.status==='confirmed'){done(row);return;}const next={...row,status,receipt};s.put(next);done(next);};});}
  };
}
