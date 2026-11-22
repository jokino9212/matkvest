<script setup>
defineProps({
  done: { type: Number, required: true },
  total: { type: Number, required: true },
});
</script>

<template>
  <div class="v71-section-progress">
    <span class="v71-progress-count">Пройдено {{ done }} из {{ total }} тем</span>
    <span
      class="v71-progress-track" role="progressbar" aria-valuemin="0"
      :aria-label="'Пройдено ' + done + ' из ' + total + ' тем'"
      :aria-valuemax="total" :aria-valuenow="done"
    ><span class="v71-progress-fill" :style="{ width: (total ? Math.round(100 * done / total) : 0) + '%' }"></span></span>
  </div>
</template>
