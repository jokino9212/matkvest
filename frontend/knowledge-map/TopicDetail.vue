<script setup>
import { computed } from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

const mastery = computed(() => {
  const topic = props.model.topic;
  if (topic.displayStatus === 'unavailable') return 'Скоро';
  if (topic.masteryPercent !== null) return `Освоение: ${topic.masteryPercent}%`;
  return topic.displayStatus === 'notstarted' ? 'Не начато' : 'Мало данных';
});

const outcomes = [
  { id: 'firstTry', icon: '✅', label: 'с первой' },
  { id: 'corrected', icon: '🟡', label: 'исправлено' },
  { id: 'wrong', icon: '❌', label: 'неверно' },
  { id: 'skipped', icon: '⏭', label: 'пропущено' },
];

const counts = computed(() => {
  const totals = { firstTry: 0, corrected: 0, wrong: 0, skipped: 0 };
  for (const answer of props.model.recent) totals[answer.outcome]++;
  return totals;
});

const outcomeIcons = Object.fromEntries(outcomes.map(({ id, icon }) => [id, icon]));
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back()">← К карте знаний</button>
  </div>
  <section class="knowledge-hero">
    <h1>📊 {{ model.topic.title }}</h1>
    <p>{{ model.topic.grade }} класс • {{ model.topic.group }} • {{ model.statusLabel }}</p>
  </section>
  <div class="knowledge-detail-grid">
    <section class="knowledge-detail-panel">
      <h2>{{ mastery }}</h2>
      <div v-if="model.topic.preliminary" class="weak-preliminary">Предварительная оценка: данных пока немного.</div>
      <template v-if="model.topic.stages.length">
        <h3>Ступени темы</h3>
        <div v-for="stage in model.topic.stages" :key="stage.index" class="knowledge-stage-detail">
          <span>{{ stage.ico }} {{ stage.name }}</span>
          <b v-if="stage.passed">✅ Пройдена</b>
          <b v-else-if="stage.started">○ {{ stage.best }}/{{ stage.total }}</b>
          <b v-else>○ Не пройдена</b>
        </div>
      </template>
      <div v-else class="lesson"><b>Дополнительная тренировка.</b> Не входит в обязательные ступени курса.</div>
      <div style="margin-top:12px"><b>Последняя работа:</b> {{ model.lastActivity || 'Не проходил' }}</div>
    </section>
    <section class="knowledge-detail-panel">
      <h3>Последние {{ model.recent.length }} заданий</h3>
      <div class="knowledge-detail-kpis">
        <div v-for="outcome in outcomes" :key="outcome.id">
          <b>{{ counts[outcome.id] }}</b><small>{{ outcome.icon }} {{ outcome.label }}</small>
        </div>
      </div>
      <div class="knowledge-recent">
        <template v-if="model.recent.length">
          <span v-for="(answer, index) in model.recent" :key="index" :title="answer.date">{{ outcomeIcons[answer.outcome] }}</span>
        </template>
        <small v-else>Пока нет заданий.</small>
      </div>
      <div style="margin-top:14px">
        <b>Активные ошибки:</b> {{ model.topic.activeErrors }}<br>
        <b>Отработанные ошибки:</b> {{ model.topic.resolvedErrors }}
      </div>
    </section>
  </div>
  <div class="actions">
    <template v-if="model.topic.implemented !== false">
      <button type="button" class="btn primary" @click="actions.train(model.topic.key)">Тренировать тему</button>
      <button v-if="model.topic.activeErrors" type="button" class="btn soft" @click="actions.errors(model.topic.key)">🧠 Работа над ошибками</button>
    </template>
    <button v-else type="button" class="btn soft" disabled>Тема готовится</button>
    <button type="button" class="btn soft" @click="actions.back()">← К карте</button>
  </div>
  <div v-if="model.teacher && model.topic.implemented !== false" class="knowledge-context-note">
    Для тренировки МатКвест переключится на профиль этого ученика и закроет режим преподавателя.
  </div>
</template>
