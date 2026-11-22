<script setup>
defineProps({ items: { type: Array, required: true } });
</script>

<template>
  <div v-for="item in items" :key="item.label" class="report-kpi" :data-report-g1="item.grade === 1 ? '1' : null"
    :data-report-g2="item.grade === 2 ? '1' : null" :data-report-metric="item.id">
    <b>{{ item.value }}</b><small>{{ item.label }}</small>
  </div>
</template>
