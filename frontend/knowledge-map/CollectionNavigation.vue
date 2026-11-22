<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <button
    v-for="section in model.sections" :key="section.id" type="button" class="mk872-col-count"
    :class="{ active: section.id === model.active }" :aria-pressed="section.id === model.active"
    :data-mk872-collection-tab="section.id" aria-controls="mk872CollectionContent"
    @click="actions.select(section.id)"
  ><b>{{ section.count }}</b><small>{{ section.label }}</small></button>
</template>
