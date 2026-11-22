<script setup>
import GradeFilters from './GradeFilters.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

const statuses = [
  { id: 'all', label: 'Все состояния' },
  { id: 'weak', label: '🔴 Слабые' },
  { id: 'unstable', label: '🟡 Нестабильные' },
  { id: 'good', label: '🟢 Хорошие' },
  { id: 'nodata', label: '⚪ Мало данных' },
];
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back()">← Главный экран</button>
  </div>
  <section class="weak-hero">
    <h1>🎯 Слабые темы</h1>
    <p>Темы, которые стоит повторить. Свежие ответы влияют на оценку сильнее старых.</p>
  </section>
  <div class="weak-summary">
    <div><b>{{ model.summary.weak }}</b><small>слабые</small></div>
    <div><b>{{ model.summary.unstable }}</b><small>нестабильные</small></div>
    <div><b>{{ model.summary.good + model.summary.mastered }}</b><small>хорошо / освоено</small></div>
    <div><b>{{ model.summary.nodata }}</b><small>мало данных</small></div>
    <div><b>{{ model.summary.activeErrors }}</b><small>активные ошибки</small></div>
  </div>
  <GradeFilters :grade="model.grade" @change="actions.grade" />
  <div class="error-filter-row" role="group" aria-label="Состояние темы">
    <button
      v-for="status in statuses" :key="status.id"
      type="button" class="error-filter" :class="{ active: model.status === status.id }"
      :aria-pressed="model.status === status.id" @click="actions.status(status.id)"
    >{{ status.label }}</button>
  </div>
  <div v-if="model.canMix" class="weak-start-box">
    <b>🎯 Тренировать слабые темы</b>
    <div class="actions" style="justify-content:flex-start;margin-top:7px">
      <button type="button" class="btn primary" @click="actions.mix(5)">5 заданий</button>
      <button type="button" class="btn soft" @click="actions.mix(10)">10 заданий</button>
    </div>
    <small style="color:var(--muted)">В смешанном блоке чередуются слабые и нестабильные темы, для которых есть задания.</small>
  </div>
  <div v-else class="report-empty">
    🎉 <b>Сейчас выраженных слабых тем с готовыми генераторами нет.</b>
  </div>
  <div class="weak-grid">
    <div v-if="!model.topics.length" class="report-empty">По выбранному фильтру тем нет.</div>
    <section v-for="topic in model.topics" :key="topic.key" class="weak-card">
      <h3>{{ topic.title }}</h3>
      <div class="weak-sub">{{ topic.grade }} класс • {{ topic.group }}</div>
      <div class="weak-percent">{{ topic.masteryPercent === null ? '—' : topic.masteryPercent + '%' }}</div>
      <div v-if="topic.preliminary" class="weak-preliminary">
        Предварительная оценка, заданий для расчёта пока {{ topic.meaningful }}.
      </div>
      <span class="weak-status" :class="topic.status">{{ topic.statusLabel }}</span>
      <div class="weak-stats">
        <span>✅ С первой: <b>{{ topic.firstTry }}</b></span>
        <span>🟡 Исправлено: <b>{{ topic.corrected }}</b></span>
        <span>❌ Неверно: <b>{{ topic.wrong }}</b></span>
        <span>⏭ Пропущено: <b>{{ topic.skipped }}</b></span>
        <span>🧠 Активных ошибок: <b>{{ topic.activeErrors }}</b></span>
        <span>🧠 Отработано ошибок: <b>{{ topic.resolvedErrors }}</b></span>
        <span>Ступеней: <b>{{ topic.completedStages }}/3</b></span>
        <span>Лучшая ступень: <b>{{ topic.bestStage }}</b></span>
      </div>
      <div class="weak-sub">
        Последняя работа: <b>{{ topic.activityDate }}</b>
        <template v-if="topic.lastStage"> • последняя сложность: <b>{{ topic.lastStage }}</b></template>
      </div>
      <div class="weak-actions">
        <button type="button" class="btn primary" @click="actions.train(topic.key)">Тренировать тему</button>
        <button v-if="topic.activeErrors" type="button" class="btn soft" @click="actions.errors(topic.key)">
          🧠 Ошибки ({{ topic.activeErrors }})
        </button>
      </div>
    </section>
  </div>
</template>
