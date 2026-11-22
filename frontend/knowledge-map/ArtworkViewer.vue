<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="mk872-viewer-card" role="document">
    <button type="button" class="mk872-viewer-close" aria-label="Закрыть просмотр" @click="actions.close">×</button>
    <div id="mk872ViewerVisual">
      <div class="mk30-visual" :class="model.kind === 'pet' ? 'mk30-pet' : 'mk30-avatar'"
        inert v-html="model.artwork"></div>
    </div>
    <div id="mk872ViewerTitle" class="mk872-viewer-title">{{ model.title }}</div>
    <div class="mk872-viewer-hint">Нажмите вне окна или Esc, чтобы закрыть</div>
  </div>
</template>
