<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="shop-filter-bar" role="group" aria-label="Редкость предметов">
    <button v-for="filter in model.filters" :key="filter.id" type="button" class="shop-filter-btn"
      :class="{ active: filter.id === model.rarity }" :aria-pressed="filter.id === model.rarity"
      @click="actions.filter(filter.id)">
      {{ filter.label }}<span class="mk19d-filter-count" aria-hidden="true">{{ filter.count }}</span>
    </button>
  </div>
  <div class="mk19d-shop-summary" role="status">
    <span>Показано: <b>{{ model.shown }}</b> из {{ model.total }}</span><span>{{ model.range }}</span>
  </div>
  <label class="v71-sort-control">Сортировать:
    <select aria-label="Сортировка предметов" :value="model.mode" @change="actions.sort($event.target.value)">
      <option v-for="option in model.sortOptions" :key="option[0]" :value="option[0]">{{ option[1] }}</option>
    </select>
  </label>
</template>
