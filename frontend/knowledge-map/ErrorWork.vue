<script setup>
import GradeFilters from './GradeFilters.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

const statuses = [
  { id: 'active', label: 'Нужно отработать' },
  { id: 'resolved', label: 'Отработано' },
  { id: 'all', label: 'Все статусы' },
];
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back()">← Главный экран</button>
  </div>
  <section class="errorwork-hero">
    <h1>🧠 Работа над ошибками</h1>
    <p>Реши новые задания того же типа и примерно той же сложности. Старые ответы остаются в журнале.</p>
  </section>
  <div class="error-summary">
    <div><b>{{ model.summary.active }}</b><small>нужно отработать</small></div>
    <div><b>{{ model.summary.resolved }}</b><small>отработано</small></div>
    <div v-for="grade in [3, 4, 5, 6, 7, 8]" :key="grade">
      <b>{{ model.summary['g' + grade + 'Active'] }}</b><small>{{ grade }} класс</small>
    </div>
  </div>
  <GradeFilters :grade="model.grade" @change="actions.grade" />
  <div class="error-filter-row" role="group" aria-label="Статус ошибки">
    <button
      v-for="status in statuses" :key="status.id"
      type="button" class="error-filter" :class="{ active: model.status === status.id }"
      :aria-pressed="model.status === status.id" @click="actions.status(status.id)"
    >{{ status.label }}</button>
  </div>
  <div v-if="model.topicTitle" class="error-start-box">
    <b>Фильтр темы:</b> {{ model.topicTitle }}
    <button type="button" class="btn soft" style="margin-left:8px" @click="actions.clearTopic()">Показать все темы</button>
  </div>
  <div v-if="model.activeCount" class="error-start-box">
    <b>🧠 Начать работу над ошибками</b>
    <div class="actions" style="justify-content:flex-start;margin-top:5px">
      <button type="button" class="btn primary" @click="actions.start(5)">5 заданий</button>
      <button type="button" class="btn soft" @click="actions.start(10)">10 заданий</button>
      <button type="button" class="btn soft" @click="actions.start(15)">
        Все доступные{{ model.activeCount > 15 ? ' (макс. 15)' : '' }}
      </button>
    </div>
    <small style="color:var(--muted)">Сначала идут неверные ответы, затем исправленные. Блок включает до выбранного числа доступных ошибок.</small>
  </div>
  <div v-if="!model.groups.length" class="report-empty">
    <template v-if="model.status === 'active' && model.summary.active === 0">
      🎉 <b>Всё отработано!</b><br>Сейчас у ученика нет ошибок, которые требуют повторения.
    </template>
    <template v-else>По выбранному фильтру записей нет.</template>
    <div class="actions">
      <button type="button" class="btn soft" @click="actions.back()">К классам</button>
      <button type="button" class="btn soft" @click="actions.journal()">📋 Журнал</button>
    </div>
  </div>
  <div class="error-groups">
    <div v-for="group in model.groups" :key="group.key" class="error-group">
      <div>
        <h3>{{ group.title }}</h3>
        <small>{{ group.detail }}</small>
        <span v-if="group.wrong" class="error-state red">🔴 Нужно отработать: {{ group.wrong }}</span>
        <span v-else-if="group.repeat" class="error-state yellow">🟡 Требует повторения: {{ group.repeat }}</span>
        <span v-else class="error-state green">✅ Отработано: {{ group.resolved }}</span>
      </div>
      <button
        v-if="group.wrong || group.repeat"
        type="button" class="btn soft" @click="actions.start(5, group.key)"
      >{{ group.wrong ? 'Тренировать' : 'Повторить' }}</button>
    </div>
  </div>
</template>
