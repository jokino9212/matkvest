<script setup>
defineProps({ grade: { type: [String, Number], required: true } });
defineEmits(['change']);
</script>

<template>
  <div class="error-filter-row" role="group" aria-label="Класс">
    <button
      type="button" class="error-filter" :class="{ active: grade === 'all' }"
      :aria-pressed="grade === 'all'" @click="$emit('change', 'all')"
    >Все</button>
    <button
      v-for="number in 8" :key="number"
      type="button" class="error-filter" :class="{ active: Number(grade) === number }"
      :aria-pressed="Number(grade) === number" @click="$emit('change', number)"
    >{{ number }} класс</button>
  </div>
</template>
