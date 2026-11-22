<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <section class="mk861-chest-card">
    <div class="mk861-chest-head">
      <div class="mk861-chest-icon" aria-hidden="true">🎁</div>
      <div>
        <h2 class="mk872-help-heading">Сундук удачи
          <button type="button" class="mk872-help-trigger" title="Справка" aria-label="Справка: chest"
            @click="actions.help($event.currentTarget)">ⓘ</button>
        </h2>
        <div class="mk861-price">{{ model.price }} 🪙</div>
      </div>
    </div>
    <div class="mk861-probs" aria-label="Вероятности до открытия">
      <div v-for="tier in model.tiers" :key="tier.id" class="mk861-prob" :class="tier.id">
        <b>{{ tier.label }}</b><span>{{ tier.chance }}</span>
      </div>
    </div>
    <div class="mk861-guarantees">
      <div v-for="item in model.guarantees" :key="item.text" :class="{ hot: item.hot }">{{ item.text }}</div>
    </div>
    <div class="mk861-pool-progress"><span v-for="tier in model.tiers" :key="tier.id">{{ tier.progress }}</span></div>
    <div class="mk861-chest-actions">
      <button type="button" class="btn primary" :disabled="model.disabled" @click="actions.open()">Открыть за {{ model.price }} 🪙</button>
      <span v-if="model.reason" class="mk861-disabled-note">{{ model.reason }}</span>
    </div>
  </section>
  <section class="mk861-history">
    <h3>Последние открытия</h3>
    <div v-if="model.history.length" class="mk861-history-list">
      <div v-for="(entry, index) in model.history" :key="index" class="mk861-history-row">
        <span>{{ entry.icon }}</span><b>{{ entry.name }}</b><small>{{ entry.date }}</small>
      </div>
    </div>
    <div v-else class="teacher-empty">Сундук ещё не открывали.</div>
  </section>
</template>
