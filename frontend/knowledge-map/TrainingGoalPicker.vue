<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="lesson">{{ model.description }}</div>
  <div class="goal-picker-grid">
    <button v-for="option in model.options" :key="option.index" type="button" class="goal-option" @click="actions.choose(option.index)">
      <b>{{ option.title }}</b><small>{{ option.description }}</small>
      <span class="goal-reward">Награда: +{{ option.xp }} XP · +{{ option.coins }} 🪙</span>
    </button>
  </div>
</template>
