<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="quest-replace-dialog">
    <ReportHeader :title="model.title" @close="actions.close" />
    <div class="lesson"><b>{{ model.questTitle }}</b><br>{{ model.description }}</div>
    <div v-if="model.progress" class="teacher-danger"><b>Прогресс {{ model.progress }} будет потерян.</b></div>
    <div class="actions">
      <button type="button" class="btn primary" @click="actions.confirm">Заменить</button>
      <button type="button" class="btn soft" @click="actions.close">Отмена</button>
    </div>
  </div>
</template>
