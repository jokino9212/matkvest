<script setup>
import ReportHeader from './ReportHeader.vue';
import TrainingHistoryRows from './TrainingHistoryRows.vue';

defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="lesson">
    Только реальные тренировки — без пропусков и календарных штрафов.
    Всего: <b>{{ model.sessions }}</b>, заданий: <b>{{ model.questions }}</b>, общая точность: <b>{{ model.accuracy }}%</b>.
  </div>
  <TrainingHistoryRows v-if="model.rows.length" :rows="model.rows" />
  <div v-else class="training-history-empty">Здесь появятся результаты тренировок.</div>
</template>
