<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mk861-reveal-stage">
    <div class="mk861-reveal-flash"></div><div class="mk861-reveal-chest" aria-hidden="true">🎁</div>
    <button type="button" class="mk861-skip" @click="actions.reveal()">Пропустить</button>
    <div class="mk861-result">
      <div class="rarity">{{ model.rarity }}</div><div class="mk861-result-icon" v-html="model.icon"></div>
      <h2>{{ model.title }}</h2><div>{{ model.body }}</div>
      <div class="mk861-result-actions">
        <button v-if="model.equip" type="button" class="btn primary" @click="actions.equip()">Надеть</button>
        <button type="button" class="btn soft" @click="actions.finish()">Готово</button>
      </div>
    </div>
  </div>
</template>
