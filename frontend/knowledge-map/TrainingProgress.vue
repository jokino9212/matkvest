<script setup>
import { computed } from 'vue';

const props = defineProps({ model: { type: Object, required: true } });
const progress = computed(() => props.model.total ? Math.round(100 * props.model.done / props.model.total) : 0);
</script>

<template>
  <div class="block-head">
    <span>
      {{ model.icon }} {{ model.stage }}
      <span v-if="model.petIcon" class="study-pet" :title="'Твой питомец: ' + model.petName" v-html="model.petIcon"></span>
    </span>
    <div class="block-progress-wrap">
      <div id="blockProgressText" class="block-progress-text"><span>{{ model.countText ?? `Выполнено ${model.done} / ${model.total}` }}</span></div>
      <div
        class="block-progress-track" role="progressbar" aria-label="Выполнено заданий"
        aria-valuemin="0" :aria-valuemax="model.total" :aria-valuenow="model.done"
      ><span id="blockProgressBar" :style="{ width: progress + '%' }"></span></div>
    </div>
    <span id="blockCorrectCount">✅ {{ model.correct }}</span>
  </div>
</template>
