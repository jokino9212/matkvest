<script setup>
import TrainingHistoryRows from './TrainingHistoryRows.vue';
import SchoolAttempt from './SchoolAttempt.vue';
import StoreWallet from './StoreWallet.vue';
import CollectionSection from './CollectionSection.vue';
import StoreCatalog from './StoreCatalog.vue';
import StoreChest from './StoreChest.vue';
import StoreSaleDialog from './StoreSaleDialog.vue';
import TeacherDashboard from './TeacherDashboard.vue';
import {ref,computed,watch} from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

import {useAccountMode} from './accountMode.js';
const {account,action:accountAction}=useAccountMode();
const inviteCode=ref(''),consent=ref(false);
watch(()=>account.value.selectedId,()=>{inviteCode.value='';consent.value=false});
function tutorRun(action,arg){window.MK95Account?.tutorRun(action,arg)}
const tutorActions={close:()=>accountAction('open'),search:q=>tutorRun('search',q),open:id=>tutorRun('report',{id}),run:tutorRun};
function acceptTutor(){if(consent.value){const code=inviteCode.value.trim();inviteCode.value='';consent.value=false;tutorRun('accept',{code,consent:true})}}
const shopCategory=ref('avatars');
const shopSection=computed(()=>account.value.economy?.catalogSections.find(s=>s.id===shopCategory.value)||account.value.economy?.catalogSections[0]);
const saleId=ref(null);
watch(()=>account.value.selectedId,()=>{saleId.value=null});
const currentSale=computed(()=>account.value.economy?.quotes.find(q=>q.item_id===saleId.value));
const saleModel=computed(()=>{
 const e=account.value.economy,q=currentSale.value;if(!e||!q)return null;
 const m=e.mission,own=m?.item_id===q.item_id?m:null,topic=e.usefulTopics.find(t=>t.topic_id===own?.topic_id);
 return {title:'Продажа предмета',subtitle:'Возврат считается от подтверждённой уплаченной цены.',mission:own?{title:own.completed?'Выгодная продажа готова':'Выгодная продажа',topic:topic?.title||own.topic_id,progress:own.progress,total:own.required,percent:100*own.progress/own.required,completed:own.completed,refund:own.refund}:null,refunds:[{label:'Продать сейчас',coins:q.refund_now,detail:'40% уплаченной цены'},{label:'Выгодная продажа',coins:q.refund_mission,detail:'80% после 10 правильных заданий',good:true}],notice:m&&!own?'Уже есть миссия другого предмета.':!m&&!e.usefulTopics.length?'Сейчас нет подтверждённой полезной темы.':'',topics:!m&&!e.blocked?e.usefulTopics.map(x=>({key:x.topic_id,grade:Number(x.topic_id[1]),title:x.title,reason:x.reason,detail:''})):[],buttons:[[{label:'Продать сейчас',disabled:e.blocked},{label:own?.completed?'Получить 80%':'Продолжить тренировку',primary:true,disabled:e.blocked||!own}],[{label:'Отменить миссию',disabled:e.blocked||!own||own.completed}]]};
});
function sendEconomy(body){window.MK95Account?.economyRun(body)}
function shopRun(action,id){
 const e=account.value.economy;if(!e?.live||e.blocked)return;
 const c=e.catalogSections.flatMap(s=>s.cards).find(x=>x.id===id);
 if(action==='sell'&&e.quotes.some(q=>q.item_id===id)){saleId.value=id;return}
 if(action==='buy'&&c?.button.action==='buy'){
  const price=Number(c.priceLabel.split(' ')[0]);if(Number.isSafeInteger(price)&&window.confirm('Купить «'+c.name+'» за '+price+' монет?'))sendEconomy({action:'buy',item_id:id,expected_price:price});
 }
 if(action==='equip')chooseItem(id);
}
function chooseItem(id){
 const e=account.value.economy;if(!e?.live||e.blocked)return;
 const item=e.collectionSections.flatMap(s=>s.items).find(i=>i.id===id),c=e.catalogSections.flatMap(s=>s.cards).find(x=>x.id===id);
 if(!(item?.button&&!item.disabled||c?.button.action==='equip'))return;
 sendEconomy({action:'equip',item_id:id,enabled:!(item?.selected||c?.equipped)});
}
const economyActions={shop:()=>{saleId.value=null;accountAction('shop')},collection:()=>{saleId.value=null;accountAction('collection')},run:shopRun,choose:chooseItem,sell:id=>shopRun('sell',id)};
const chestActions={help:()=>window.alert('Сундук открывается на сервере. При исчерпании выбранной редкости начисляется предусмотренная компенсация.'),open:()=>{const chest=account.value.economy?.chest;if(chest&&!chest.disabled&&window.confirm('Открыть сундук за '+chest.price+' монет?'))sendEconomy({action:'chest',expected_price:chest.price})}};
function continueMission(){
 const m=account.value.mission;if(!m||m.completed)return;
 saleId.value=null;accountAction('economyBack');openSchool(m.topic_id,0);
}
const saleActions={close:()=>saleId.value=null,choose:index=>{const t=account.value.economy?.usefulTopics[index];if(currentSale.value&&t&&!account.value.economy.blocked)sendEconomy({action:'mission_start',item_id:currentSale.value.item_id,topic_id:t.topic_id})},run:(row,col)=>{
 const e=account.value.economy,q=currentSale.value,m=e?.mission;if(!e||!q||e.blocked)return;
 if(row===0&&col===0&&window.confirm('Продать предмет за '+q.refund_now+' монет?')){sendEconomy({action:'sell',item_id:q.item_id,mode:'now',expected_refund:q.refund_now});saleId.value=null;}
 else if(row===0&&col===1&&m?.item_id===q.item_id){if(m.completed){if(window.confirm('Продать предмет за '+q.refund_mission+' монет?')){sendEconomy({action:'sell',item_id:q.item_id,mode:'mission',expected_refund:q.refund_mission,mission_id:m.id});saleId.value=null;}}else continueMission();}
 else if(row===1&&col===0&&m?.item_id===q.item_id&&!m.completed&&window.confirm('Отменить миссию?'))sendEconomy({action:'mission_cancel',mission_id:m.id});
}};
const tableActions={close:()=>accountAction('tablePause'),back:()=>accountAction('tablePause'),abandon:()=>accountAction('tablePause'),input:event=>window.MK95Account?.tableAction('input',event),primary:()=>window.MK95Account?.tableAction('primary'),skip:()=>window.MK95Account?.tableAction('skip'),pick:index=>window.MK95Account?.tableAction('pick',index),inputCell:el=>window.MK95Account?.tableAction('cell',el),toggleDot:el=>window.MK95Account?.tableAction('dot',el),moveCell:(event,el)=>window.MK95Account?.tableAction('move',{event,el})};
function openSchool(topic,stage){window.MK95Account?.tableOpen(topic,stage)}
function runLocal(action){if(account.value.mode==='local')props.actions.run(action)}
function activateCard(event, action) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.target.closest('button, a[href]') || event.currentTarget.matches('.soon, .disabled, .locked, [aria-disabled="true"]')) return;
  runLocal(action);
}
</script>

<template>
  <section v-if="account.mode === 'server'" class="home-start" data-mk95-server>
    <h1>МатКвест</h1>
    <p role="status">{{ account.message }}</p>
    <TeacherDashboard v-if="account.user?.role==='tutor'" :model="{server:true,...account.tutor}" :actions="tutorActions" />
    <template v-else>
    <template v-if="account.snapshot">
      <h2>{{ account.snapshot.profile.display_name }}</h2>
      <p>Подтверждено сервером: {{ account.snapshot.profile.xp_total }} XP · {{ account.snapshot.wallet.balance }} монет</p>
      <p>Записей учебного прогресса: {{ account.snapshot.progress.course_progress.length }}</p>
      <button type="button" class="mk19f-home-open" data-mk95-progress @click="accountAction('progress')">Мой прогресс</button>
      <button type="button" class="btn soft" data-mk95-journal @click="accountAction('journal')">Журнал попыток</button>
    </template>
    <section v-if="account.snapshot?.tutorLink" class="teacher-panel" data-mk95-tutor-link>
      <h2>Связь с преподавателем</h2>
      <p v-if="account.snapshot.tutorLink.linked">Преподавателю доступны подтверждённые учебные результаты.</p>
      <button v-if="account.snapshot.tutorLink.linked" type="button" class="btn soft" :disabled="account.tutor?.busy" @click="tutorRun('student-unlink')">Отозвать доступ преподавателя</button>
      <form v-else @submit.prevent="acceptTutor">
        <label>Код приглашения <input v-model="inviteCode" aria-label="Код приглашения" maxlength="256" autocomplete="off" required></label>
        <label><input v-model="consent" type="checkbox"> Согласен предоставить преподавателю доступ к учебным результатам этого ученика</label>
        <button type="submit" class="btn primary" :disabled="!consent || inviteCode.trim().length<32 || account.tutor?.busy">Принять приглашение</button>
      </form>
      <p v-if="account.tutor?.error" role="alert">{{ account.tutor.error }}</p>
    </section>
    <p v-if="account.operation?.error" role="alert">{{ account.operation.error }}</p>
    <button v-if="account.operation?.pending" type="button" class="btn soft" data-mk95-economy-retry :disabled="account.operation.busy" @click="accountAction('economyRetry')">Повторить ожидающую операцию</button>
    <p v-if="account.mission">Выгодная продажа: {{ account.mission.progress }}/{{ account.mission.required }} правильных заданий.
      <button v-if="!account.mission.completed" class="btn soft" type="button" @click="continueMission">Продолжить миссию</button>
    </p>
    <section v-if="account.economy" data-mk95-economy :data-economy-view="account.economy.view">
      <button class="btn soft" type="button" @click="saleId=null;accountAction('economyBack')">Назад к тренировкам</button>
      <StoreSaleDialog v-if="saleModel" :model="saleModel" :actions="saleActions" />
      <template v-if="account.economy.view==='wallet'">
        <h2>Мой кошелёк</h2><StoreWallet :model="account.economy.wallet" :actions="economyActions" />
      </template>
      <template v-else-if="account.economy.view==='collection'">
        <h2>Моя коллекция</h2><p>Полученные предметы и достижения подтверждены сервером. {{ account.economy.live?'Выбор и продажи подтверждаются сервером.':'Выбор предметов пока недоступен.' }}</p>
        <CollectionSection v-for="section in account.economy.collectionSections" :key="section.id" :model="section" :actions="economyActions" />
      </template>
      <template v-else>
        <h2>Магазин</h2><p role="status">{{ account.economy.live?'Цены и операции подтверждаются сервером.':'Предпросмотр встроенного каталога. Сервер пока не предоставляет цены, покупку, продажу и сундуки.' }}</p>
        <StoreChest v-if="account.economy.chest" :model="account.economy.chest" :actions="chestActions" />
        <select v-if="account.economy.catalogSections.length" aria-label="Категория магазина" :value="shopSection?.id" @change="shopCategory=$event.target.value">
          <option v-for="section in account.economy.catalogSections" :key="section.id" :value="section.id">{{ section.title }}</option>
        </select>
        <div v-if="shopSection" class="shop-grid"><StoreCatalog :model="shopSection" :actions="economyActions" /></div>
      </template>
    </section>
    <template v-else-if="account.table?.open">
      <SchoolAttempt :model="account.table.model" :actions="tableActions" />
      <p v-if="account.table.status === 'blocked'" role="alert">Результат сохранён, но сервер отклонил блок. Повторное начисление отключено.</p>
      <button v-if="account.table.status === 'pending'" type="button" class="btn soft" @click="accountAction('tableSync')">Повторить синхронизацию</button>
    </template>
    <section v-else-if="account.table?.enabled" class="training-history">
      <h2>4–5 классы · Серверные тренировки</h2>
      <p>Новый блок выдаётся при подключении. Сохранённый блок можно продолжить без сети.</p>
      <template v-for="grade in [4,5]" :key="grade">
      <h3>{{ grade }} класс</h3>
      <article v-for="topic in account.table.catalogue.filter(t=>t.grade===grade)" :key="topic.topic" class="report-card" style="display:block">
        <b>{{ topic.title }}</b>
        <div class="actions">
          <button v-for="step in topic.stages" :key="step.stage" type="button" class="btn soft"
            :disabled="account.table.busy || (!step.enabled && account.status!=='offline')"
            :data-mk95-table-open="topic.topic==='g4:table'&&step.stage===0?'':null"
            :data-mk95-topic="topic.topic" :data-mk95-stage="step.stage"
            @click="openSchool(topic.topic,step.stage)">{{ step.label }} · {{ step.best }}</button>
        </div>
      </article>
      </template>
    </section>
    <p v-if="account.table?.error" role="alert">{{ account.table.error }}</p>
    <p>В тестовом серверном режиме доступны 18 тренажёров 4–5 классов. Остальные темы доступны только в отдельном локальном режиме.</p>
    </template>
    <button type="button" class="btn soft" @click="accountAction('open')">Аккаунт и выбор ученика</button>
    <button type="button" class="btn soft" @click="accountAction('local')">Локальный режим</button>
  </section>
  <template v-else>
  <section class="home-start">
    <h1>{{ model.title }}</h1>
    <p>{{ model.description }}</p>
    <button type="button" class="mk19f-home-open" data-home-action="progress" @click="runLocal('progress')">Мой прогресс</button>
  </section>
  <div class="grade-grid">
    <section
      v-for="grade in model.grades" :key="grade.action" :class="grade.className"
      @click="activateCard($event, grade.action)"
    >
      <div class="grade-ico" v-html="grade.icon"></div>
      <h2>{{ grade.title }}</h2>
      <p>{{ grade.description }}</p>
      <div :id="grade.summaryId" class="grade-summary">{{ grade.summary }}</div>
      <button type="button" class="btn primary" :data-home-action="grade.action" @click="runLocal(grade.action)">{{ grade.buttonLabel }}</button>
    </section>
  </div>
  <section class="quick-home" aria-labelledby="quick-home-title">
    <header class="quick-home-head"><h2 id="quick-home-title"><span aria-hidden="true">⚡</span> Быстрые тренажёры</h2></header>
    <div class="quick-grid">
      <article v-for="trainer in model.trainers" :key="trainer.action" :class="trainer.className" @click="activateCard($event, trainer.action)">
        <template v-if="trainer.description">
          <div class="quick-card-content">
            <span class="quick-card-icon" aria-hidden="true" v-html="trainer.icon"></span>
            <div class="quick-card-copy"><h3>{{ trainer.title }}</h3><p>{{ trainer.description }}</p></div>
          </div>
          <button type="button" class="btn primary" :aria-label="trainer.label" :data-home-action="trainer.action" @click="runLocal(trainer.action)">Тренироваться</button>
        </template>
        <button v-else type="button" class="btn quick-compact-action" :data-home-action="trainer.action" @click="runLocal(trainer.action)">
          <span class="quick-card-icon" aria-hidden="true" v-html="trainer.icon"></span>
          <strong>{{ trainer.title }}</strong><span class="quick-arrow" aria-hidden="true">→</span>
        </button>
      </article>
    </div>
  </section>
  <section :class="model.goal.className">
    <div class="mk854-goal-main">
      <div class="mk854-goal-title">{{ model.goal.title }}</div>
      <div class="mk854-goal-meta">{{ model.goal.detail }}</div>
    </div>
    <div class="training-goal-actions">
      <button
        v-for="button in model.goal.buttons" :key="button.action" type="button" :class="button.className"
        :data-home-action="button.action" @click="runLocal(button.action)"
      >{{ button.label }}</button>
    </div>
    <div v-if="model.goal.progress" class="training-goal-progress-row">
      <div class="training-goal-track" :aria-label="model.goal.progress.label"><span :style="{ width: model.goal.progress.width }"></span></div>
      <div class="training-goal-count">{{ model.goal.progress.count }}</div>
    </div>
  </section>
  <section v-if="model.plan" class="training-plan-card home-training-plan">
    <div class="training-plan-head">
      <div><h2>{{ model.plan.title }}</h2><p>{{ model.plan.progress }}</p></div>
      <button type="button" :class="model.plan.button.className" :data-home-action="model.plan.button.action" @click="runLocal(model.plan.button.action)">{{ model.plan.button.label }}</button>
    </div>
  </section>
  <section class="training-history mk854-compact">
    <div class="training-history-head"><h2>Последние тренировки</h2></div>
    <TrainingHistoryRows v-if="model.history.rows.length" :rows="model.history.rows" />
    <div v-else class="training-history-empty">Здесь появятся 2–3 последние тренировки.</div>
    <button
      v-if="model.history.more" type="button" class="training-history-more" data-home-action="history" @click="runLocal('history')"
    >Вся история →</button>
  </section>
  <section v-for="card in model.sections" :key="card.action" :class="card.className">
    <div><h2>{{ card.title }}</h2><p>{{ card.description }}</p><div :class="card.countClass">{{ card.count }}</div></div>
    <button type="button" :class="card.buttonClass" :data-home-action="card.action" @click="runLocal(card.action)">{{ card.buttonLabel }}</button>
  </section>
  </template>
</template>
