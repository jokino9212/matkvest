<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <h2 class="mk872-help-heading" tabindex="-1">
    {{ model.title }}
    <button type="button" class="mk872-help-trigger" title="Справка" :aria-label="'Справка: ' + model.topic"
            @click="actions.help($event.currentTarget)">ⓘ</button>
  </h2>
  <button type="button" class="x" aria-label="Закрыть окно" @click="actions.close">×</button>
</template>
