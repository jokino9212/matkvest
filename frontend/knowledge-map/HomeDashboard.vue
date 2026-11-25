<script setup>
import TrainingHistoryRows from './TrainingHistoryRows.vue';
import SchoolAttempt from './SchoolAttempt.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

import {useAccountMode} from './accountMode.js';
const {account,action:accountAction}=useAccountMode();
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
    <template v-if="account.snapshot">
      <h2>{{ account.snapshot.profile.display_name }}</h2>
      <p>Подтверждено сервером: {{ account.snapshot.profile.xp_total }} XP · {{ account.snapshot.wallet.balance }} монет</p>
      <p>Записей учебного прогресса: {{ account.snapshot.progress.course_progress.length }}</p>
      <button type="button" class="mk19f-home-open" data-mk95-progress @click="accountAction('progress')">Мой прогресс</button>
      <button type="button" class="btn soft" data-mk95-journal @click="accountAction('journal')">Журнал попыток</button>
    </template>
    <template v-if="account.table?.open">
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
    <p>В тестовом серверном режиме доступны 18 тренажёров 4–5 классов. Остальные темы и покупки пока работают локально.</p>
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
