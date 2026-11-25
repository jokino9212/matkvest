<script setup>
import ReportHeader from './ReportHeader.vue';
import TrainingProgress from './TrainingProgress.vue';
import ColumnExercise from './ColumnExercise.vue';
import TableExercise from './TableExercise.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <section :id="model.rootId">
    <div class="column-cloud-head">
      <TrainingProgress :model="model.progress" style="flex: 1" />
    </div>
    <p class="column-cloud-status" role="status" aria-live="polite"></p>
    <template v-if="model.finished">
      <div class="pilot-summary column-cloud-result">
        <template v-if="model.summary">
          С первой попытки {{ model.summary.correct }} из {{ model.progress.total }}.
          Исправлено {{ model.summary.corrected }}. Пропущено {{ model.summary.skipped }}.
          {{ model.summary.passed ? 'Этап пройден.' : 'Этап пока не пройден.' }}
          <template v-if="model.summary.pending"> Результат сохранён. Синхронизируем, когда появится интернет.</template>
          <template v-else-if="model.summary.alreadySynced"> Этот блок уже учтён.</template>
          <template v-else> Начислено {{ model.summary.xp }} XP и {{ model.summary.coins }} монет.</template>
          <p v-if="model.summary.achievement === 'g4EquationsMaster'">
            Достижение «Мастер уравнений», титул «Повелитель уравнений» и значок «Уравнения».
          </p>
        </template>
        <template v-else>Тренировка закрыта без награды.</template>
      </div>
    </template>
    <div v-else :id="model.questionId" class="school-question" @input="actions.input" @click="actions.input">
      <ColumnExercise v-if="model.column" :model="model.exercise" :actions="actions" />
      <TableExercise v-else :model="model.exercise" :actions="actions" />
    </div>
    <div class="pilot-actions column-cloud-actions">
      <button v-if="model.finished" type="button" class="btn soft" @click="actions.back">К этапам</button>
      <button v-else type="button" class="btn soft" @click="actions.abandon">{{ model.pauseOnly ? 'Сохранить и выйти' : 'Завершить без награды' }}</button>
    </div>
  </section>
</template>
