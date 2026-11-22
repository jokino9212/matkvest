<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <button id="appVersionBadge" type="button" :title="model.title || null" @click="actions.activate">
    {{ model.label }}
  </button>
</template>
