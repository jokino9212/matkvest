<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <template v-if="model.picker">
    Раздел магазина
    <select class="mk-ux91-category-select" aria-label="Раздел магазина" :value="model.active"
      @change="actions.open($event.target.value, true)">
      <option v-for="tab in model.tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
    </select>
  </template>
  <template v-else>
    <button v-for="tab in model.tabs" :key="tab.id" type="button" class="shop-tab"
      :class="{ active: tab.id === model.active, 'mk19e-wallet-tab': tab.id === 'wallet' }"
      :data-store-category="tab.id" :aria-current="tab.id === model.active ? 'page' : null"
      @click="actions.open(tab.id, false)">{{ tab.label }}</button>
  </template>
</template>
