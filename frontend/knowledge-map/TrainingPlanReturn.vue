<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <span v-if="model.note">🧩 Этот блок открыт из плана тренировки.</span>
  <button type="button" class="btn soft" @click="actions.returnToPlan">← Вернуться к плану</button>
</template>
