<script setup>
import ReportHeader from './ReportHeader.vue';
import ReportStats from './ReportStats.vue';

defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="lesson">
    <b>Ученик: {{ model.name }}</b><br>
    {{ model.grade }} класс • {{ model.group }}<br>
    {{ model.status }} • освоение: <b>{{ model.mastery }}</b>
  </div>
  <ReportStats :stats="model.stats" />
  <div class="actions">
    <button type="button" class="btn soft" @click="actions.close">Закрыть</button>
  </div>
</template>
