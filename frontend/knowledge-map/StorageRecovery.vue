<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div role="alert">{{ model.warning }}</div>
  <div id="mk-v877-storage-recovery-actions">
    <button type="button" @click="actions.download">{{ model.download }}</button>
    <button type="button" @click="actions.restore">{{ model.restore }}</button>
  </div>
</template>
