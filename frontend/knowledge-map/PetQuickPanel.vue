<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="mk19g-pet-head">
    <button
      v-if="model.artwork" type="button" class="mk19g-pet-icon"
      :aria-label="'Увеличить: ' + model.name" v-html="model.artwork"
    ></button>
    <div v-else class="mk19g-pet-icon" aria-hidden="true">—</div>
    <div class="mk19g-pet-info">
      <div class="mk19g-pet-eyebrow">Питомец в профиле</div>
      <div class="mk19g-pet-name">{{ model.name }}</div>
      <div class="mk19g-pet-rarity">{{ model.rarity }}</div>
    </div>
    <span class="mk19g-pet-collection-count" :aria-label="'Получено питомцев: ' + model.collected + ' из ' + model.total">
      {{ model.collected }} / {{ model.total }}
    </span>
  </div>
  <div class="mk19g-pet-switch-title">Быстрый выбор из своей коллекции</div>
  <div class="mk19g-pet-actions" role="group" aria-label="Выбрать имеющегося питомца">
    <button
      v-for="pet in model.choices" :key="pet.id" type="button" class="mk19g-pet-choice"
      :data-pet-choice="pet.id" :disabled="pet.selected" :aria-pressed="pet.selected" @click="actions.choose(pet.id)"
    >{{ pet.name }}{{ pet.selected ? ' ✓' : '' }}</button>
  </div>
  <span v-if="!model.collected" class="mk19g-pet-empty">Покупки и награды за достижения появятся здесь.</span>
  <button v-if="model.fromCollection" type="button" class="mk19g-pet-market" @click="actions.market">
    Посмотреть всех питомцев
  </button>
</template>
