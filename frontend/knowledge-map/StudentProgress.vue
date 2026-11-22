<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div id="mk19fProgress" class="mk19f-modal">
    <section class="mk19f-xp-summary">
      <div class="mk19f-xp-top"><strong>Игровой уровень {{ model.level }} → {{ model.level + 1 }}</strong><span class="mk19f-xp-percent">{{ model.xp.percent }}%</span></div>
      <span class="mk19f-progress-track" role="progressbar" :aria-label="model.xp.label" aria-valuemin="0" :aria-valuemax="model.xp.total" :aria-valuenow="model.xp.done">
        <span class="mk19f-progress-fill" :style="{ width: model.xp.percent + '%' }"></span>
      </span>
      <div class="mk19f-xp-bottom">{{ model.xp.detail }}</div>
    </section>
    <section class="mk19f-overall">
      <div><strong>{{ model.overall }}</strong><div class="mk19f-small">По доступным темам всех восьми классов</div></div>
      <strong>{{ model.percent }}%</strong>
    </section>
    <div class="mk19f-grade-grid">
      <article v-for="grade in model.grades" :key="grade.grade" class="mk19f-grade-row">
        <div class="mk19f-grade-head"><strong>{{ grade.grade }} класс</strong><b>{{ grade.percent }}%</b></div>
        <span class="mk19f-progress-track" role="progressbar" :aria-label="grade.label" aria-valuemin="0" :aria-valuemax="grade.total" :aria-valuenow="grade.done">
          <span class="mk19f-progress-fill" :style="{ width: grade.percent + '%' }"></span>
        </span>
        <div class="mk19f-row-detail">{{ grade.detail }}</div>
        <div class="mk19f-row-modes">Разминка {{ grade.warmup }} · Тренировка {{ grade.training }} · Мастерство {{ grade.master }}</div>
        <button type="button" @click="actions.openGrade(grade.grade)">Открыть {{ grade.grade }} класс</button>
      </article>
    </div>
    <p class="mk19f-footnote">{{ model.note }}</p>
  </div>
</template>
