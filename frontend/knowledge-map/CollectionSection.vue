<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="mk872-col-head">
    <h3>{{ model.title }}</h3><small>{{ model.owned }} из {{ model.total }}</small>
  </div>
  <div v-if="model.items.length" class="mk872-col-grid">
    <div v-for="item in model.items" :key="item.id" class="mk872-col-card" :class="{ selected: item.selected }">
      <div style="display: contents" v-html="item.art"></div>
      <strong>{{ item.title }}</strong>
      <span class="mk872-col-meta" :class="item.rarityClass">{{ item.meta }}</span>
      <button
        v-if="item.button" type="button" class="mk872-col-action" :class="{ primary: !item.selected }"
        :disabled="item.disabled" @click="actions.choose(item.id)"
      >{{ item.button }}</button>
    </div>
  </div>
  <div v-else class="mk872-col-empty">
    Пока ничего нет в коллекции.
    <div class="mk872-col-help">Посмотри доступные предметы в магазине.</div>
  </div>
</template>
