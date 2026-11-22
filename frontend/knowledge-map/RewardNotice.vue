<script setup>
defineProps({
  model: { type: Object, required: true },
});
</script>

<template>
  <div id="rewardPop" class="reward-pop" :class="{ show: model.visible }" role="status" aria-atomic="true">
    <span :key="model.id" :aria-hidden="!model.visible">{{ model.text }}</span>
  </div>
</template>
