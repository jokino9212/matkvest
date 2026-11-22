<script setup>
import ReportHeader from './ReportHeader.vue';
import ReportStats from './ReportStats.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="block-result">
    <h3>{{ model.heading }}</h3>
    <ReportStats :stats="model.stats" />
    <div v-if="model.topics?.length" class="level-box" style="text-align:left">
      <div v-for="topic in model.topics" :key="topic.key">
        <b>{{ topic.title }}</b>: {{ topic.correct }}/{{ topic.total }}
      </div>
    </div>
    <p>{{ model.note }}</p>
    <div class="actions">
      <button type="button" class="btn soft" @click="actions.review()">📋 Разбор попытки</button>
      <button
        v-for="button in actions.buttons" :key="button.label" type="button" class="btn"
        :class="button.primary ? 'primary' : 'soft'" @click="button.run()"
      >{{ button.label }}</button>
      <button type="button" class="btn soft" @click="actions.home()">Главный экран</button>
    </div>
  </div>
</template>
