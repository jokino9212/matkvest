<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({ model: Object, actions: Object });
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="lesson"><b>12 заданий</b> вперемешку из тем по обыкновенным дробям.
    Вопросы внутри попытки не повторяются, результат попадёт в общий журнал ученика.
  </div>
  <div class="actions">
    <button type="button" class="btn primary" @click="actions.start">Начать микс</button>
  </div>
</template>
