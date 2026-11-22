<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="achievement-summary">
    <div v-for="stat in model.stats" :key="stat.label"><b>{{ stat.value }}</b><small>{{ stat.label }}</small></div>
  </div>
  <div v-if="model.nearest.length" class="achievement-nearest">
    <b>🎯 Ближайшие достижения</b>
    <div class="achievement-nearest-grid">
      <div v-for="item in model.nearest" :key="item.id" class="achievement-nearest-item">
        <b>{{ item.title }}</b>
        <small style="display:block;color:var(--muted);margin-top:3px">{{ item.label }}</small>
        <div class="achievement-progress"><span :style="{ width: item.percent + '%' }"></span></div>
      </div>
    </div>
  </div>
  <div class="achievement-toolbar">
    <button v-for="filter in model.views" :key="filter.id" type="button" class="achievement-filter"
      :class="{ active: filter.id === model.view }" :aria-pressed="filter.id === model.view"
      @click="actions.view(filter.id)">{{ filter.label }}</button>
    <select class="achievement-select" aria-label="Категория достижений" :value="model.category"
      @change="actions.category($event.target.value)">
      <option v-for="option in model.categories" :key="option.id" :value="option.id">{{ option.label }}</option>
    </select>
    <select class="achievement-select" aria-label="Сортировка достижений" :value="model.sort"
      @change="actions.sort($event.target.value)">
      <option v-for="option in model.sorts" :key="option.id" :value="option.id">{{ option.label }}</option>
    </select>
  </div>
  <div class="lesson">{{ model.note }}</div>
  <div v-if="!model.groups.length" class="teacher-empty" role="status">По выбранному фильтру достижений нет.</div>
  <template v-for="group in model.groups" :key="group.id">
    <h3 v-if="group.heading" class="achievement-category">{{ group.heading }}</h3>
    <div class="achievement-grid">
      <div v-for="card in group.cards" :key="card.id" class="achievement-card" :class="{ done: card.owned }"
        :aria-label="card.title + '. ' + card.status">
        <div class="achievement-icon" v-html="card.icon"></div>
        <div class="achievement-info">
          <div class="achievement-title-row">
            <b>{{ card.title }}</b>
            <span class="achievement-status" :class="{ done: card.owned }">{{ card.status }}</span>
          </div>
          <span class="achievement-rarity" :class="card.rarity">{{ card.rarityLabel }}</span>
          <small>{{ card.description }}</small>
          <div v-if="card.condition" class="achievement-condition" :class="{ done: card.owned }">{{ card.progressLabel }}</div>
          <template v-else>
            <div class="achievement-progress" :aria-label="'Прогресс ' + card.percent + '%'">
              <span :style="{ width: card.percent + '%' }"></span>
            </div>
            <div class="achievement-progress-label">{{ card.progressLabel }}</div>
          </template>
          <div class="achievement-reward">
            <span class="achievement-reward-label">{{ card.owned ? 'Получено:' : 'Награда:' }}</span>
            <span style="display:contents" v-html="card.reward"></span>
          </div>
          <div v-if="card.date" class="achievement-date">Дата: {{ card.date }}</div>
        </div>
      </div>
    </div>
  </template>
</template>
