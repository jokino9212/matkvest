<script setup>
defineProps({ rows: { type: Array, required: true } });
</script>

<template>
  <div class="training-history-list">
    <div v-for="row in rows" :key="row.id" class="training-history-row">
      <div class="training-history-date">{{ row.date }}</div>
      <div class="training-history-main"><b>{{ row.title }}</b><small>{{ row.summary }}</small></div>
      <div class="training-history-accuracy">{{ row.accuracy }}%</div>
    </div>
  </div>
</template>
