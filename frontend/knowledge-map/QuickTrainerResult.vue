<script setup>
import TrainingPlanReturn from './TrainingPlanReturn.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

function preventRepeatedEnter(event) {
  if (event.repeat) event.preventDefault();
}
</script>

<template>
  <div class="quick-summary" @keydown.enter="preventRepeatedEnter">
    <div class="quick-summary-card"><h2 tabindex="-1">Тренировка завершена!</h2><p>{{ model.title }} • {{ model.selection }}</p></div>
    <div class="quick-summary-grid">
      <div v-for="stat in model.stats" :key="stat.label" class="quick-summary-stat"><b>{{ stat.value }}</b><span>{{ stat.label }}</span></div>
    </div>
    <div class="quick-summary-reward"><span>+{{ model.xp }} XP</span><span>+{{ model.coins }} 🪙</span></div>
    <div class="quick-review-summary">
      <h3>Стоит повторить</h3>
      <div v-if="model.facts.length" class="quick-review-facts">
        <span v-for="fact in model.facts" :key="fact" class="quick-review-fact">{{ fact }}</span>
      </div>
      <div v-else class="quick-review-ok">Отлично — в этой тренировке ошибок не было.</div>
    </div>
    <div class="quick-summary-actions">
      <button type="button" class="btn primary" @click="actions.again">Ещё раз</button>
      <button type="button" class="btn soft" @click="actions.home">На главную</button>
      <TrainingPlanReturn v-if="model.returnToPlan" :model="{ note: false }" :actions="actions" />
    </div>
  </div>
</template>
