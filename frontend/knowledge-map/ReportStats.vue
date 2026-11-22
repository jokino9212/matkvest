<script setup>
defineProps({ stats: { type: Array, required: true } });
</script>

<template>
  <div class="review-summary">
    <div v-for="{ label, value } in stats" :key="label" class="review-stat">
      <b>{{ value }}</b><small>{{ label }}</small>
    </div>
  </div>
</template>
