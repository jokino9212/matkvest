<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <section class="mk872-training-panel" role="alertdialog" aria-modal="true"
    aria-labelledby="mk872-training-heading" aria-describedby="mk872-training-description">
    <h2 id="mk872-training-heading">{{ model.title }}</h2>
    <p id="mk872-training-description">{{ model.message }}</p>
    <div class="mk872-training-actions">
      <button v-for="(label, index) in model.labels" :key="label" type="button" class="btn"
        :class="index === 0 ? 'primary' : 'soft'" @click="actions.choose(index)">{{ label }}</button>
    </div>
  </section>
</template>
