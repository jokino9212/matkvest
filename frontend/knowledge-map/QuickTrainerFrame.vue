<script setup>
import TrainingPlanReturn from './TrainingPlanReturn.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div v-if="model.returnToPlan" class="training-plan-returnbar">
    <TrainingPlanReturn :model="{ note: true }" :actions="actions" />
  </div>
  <div class="quick-screen">
    <div class="home-back-row">
      <button type="button" class="home-back-btn" @click="actions.home">← Главный экран</button>
    </div>
    <section class="quick-hero">
      <h1>{{ model.title }}</h1>
      <p>{{ model.description }}</p>
    </section>
    <div id="quickTopline" class="quick-topline" :class="{ 'is-hidden': !model.training }">
      <span class="quick-chip">⭐ XP: <b id="quickXP">{{ model.xp }}</b></span>
      <span class="quick-chip">🪙 Монеты: <b id="quickCoins">{{ model.coins }}</b></span>
      <span class="quick-chip">Режим: <b id="quickRangeLabel">{{ model.range }}</b></span>
    </div>
    <div data-quick-panel-outlet style="display: contents"></div>
  </div>
</template>
