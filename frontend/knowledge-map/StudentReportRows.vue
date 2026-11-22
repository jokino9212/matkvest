<script setup>
defineProps({ rows: { type: Array, required: true }, empty: String });
</script>

<template>
  <div v-if="rows.length" class="report-list">
    <div v-for="(row, index) in rows" :key="index" class="report-row" :class="row.tone">
      <div>
        <b>{{ row.title }}</b>
        <small v-if="row.description">{{ row.description }}</small>
        <div v-if="row.details?.length" class="report-control-topics">
          <div v-for="detail in row.details" :key="detail.title"><span>{{ detail.title }}</span><b>{{ detail.score }}</b></div>
        </div>
      </div>
      <span v-if="row.score !== undefined" :class="row.scoreClass || 'report-score'">{{ row.score }}</span>
    </div>
  </div>
  <div v-else class="report-empty">{{ empty }}</div>
</template>
