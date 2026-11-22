<script setup>
defineProps({ title: { type: String, required: true } });
defineEmits(['close']);
</script>

<template>
  <div class="mtop">
    <h2>{{ title }}</h2>
    <button type="button" class="x" aria-label="Закрыть окно" @click="$emit('close')">×</button>
  </div>
</template>
