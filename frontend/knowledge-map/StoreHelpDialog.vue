<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mk872-help-top">
    <h3 id="mk872-help-title">{{ model.title }}</h3>
    <button type="button" class="mk872-help-close" aria-label="Закрыть справку" @click="actions.close()">×</button>
  </div>
  <div class="mk872-help-content" v-html="model.content"></div>
</template>
