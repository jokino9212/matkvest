<script setup>
import ReportHeader from './ReportHeader.vue';
import TrainingProgress from './TrainingProgress.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div v-if="model.lesson && model.lessonFirst" class="lesson" v-html="model.lesson"></div>
  <div id="schoolTrainingProgress" style="display: contents">
    <TrainingProgress :model="model.progress" />
  </div>
  <div v-if="model.lesson && !model.lessonFirst" class="lesson" v-html="model.lesson"></div>
  <div v-if="model.guide" class="column-guide" v-html="model.guide"></div>
</template>
