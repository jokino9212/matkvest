<script setup>
import { useTemplateRef } from 'vue';
import StudentReportDocument from './StudentReportDocument.vue';

defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
const periodControls = useTemplateRef('periodControls');
</script>

<template>
  <section v-if="model.missing" class="student-report-screen report-no-print">
    <div class="report-empty">
      <h1>{{ model.title }}</h1>
      <p>{{ model.message }}</p>
      <div class="report-actions">
        <button type="button" class="btn primary" @click="actions.back">К списку учеников</button>
      </div>
    </div>
  </section>
  <div v-else class="student-report-screen">
    <div class="home-back-row report-no-print">
      <button type="button" class="home-back-btn" @click="actions.back">← К ученику</button>
    </div>
    <div id="studentReportControls" ref="periodControls" class="student-report-toolbar report-no-print">
      <div class="student-report-presets" role="group" aria-label="Период отчёта">
        <button v-for="option in model.periods" :key="option.id" type="button" class="teacher-filter"
          :class="{ active: option.id === model.period }" :aria-pressed="option.id === model.period"
          @click="actions.period(option.id)">{{ option.label }}</button>
      </div>
      <form class="student-report-custom" @submit.prevent="actions.apply">
        <label>От <input type="date" aria-label="Начало периода" :value="model.draft.from"
          aria-describedby="studentReportError" :aria-invalid="model.error ? 'true' : null"
          @input="actions.date('from', $event.target.value)"></label>
        <label>До <input type="date" aria-label="Конец периода" :value="model.draft.to"
          aria-describedby="studentReportError" :aria-invalid="model.error ? 'true' : null"
          @input="actions.date('to', $event.target.value)"></label>
        <button type="submit" class="btn soft" :aria-pressed="model.period === 'custom'">Свой период</button>
      </form>
      <div id="studentReportError" class="student-report-error" role="alert">{{ model.error }}</div>
    </div>
    <StudentReportDocument :model="model.document" />
    <div class="report-actions report-no-print">
      <button type="button" class="btn primary" @click="actions.print">🖨️ Печать / PDF</button>
      <button type="button" class="btn soft" @click="periodControls?.scrollIntoView({behavior:'smooth'})">Изменить период</button>
      <button type="button" class="btn soft" @click="actions.back">← К ученику</button>
    </div>
  </div>
</template>
