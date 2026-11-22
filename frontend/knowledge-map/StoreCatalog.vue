<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div v-for="card in model.cards" :key="card.id" :class="card.className">
    <span v-if="card.status" class="shop-state-chip" :class="card.equipped ? 'equipped' : 'owned'">{{ card.status }}</span>
    <span v-if="card.level > 1" class="shop-lock">ур. {{ card.level }}</span>
    <div style="display: contents" v-html="card.icon"></div>
    <strong>{{ card.name }}</strong>
    <div :class="'rarity-' + card.rarity" style="font-size: 11px; font-weight: 900; margin-top: 3px">
      {{ card.rarityLabel }}
    </div>
    <small>{{ card.description }}</small>
    <div class="shop-price">{{ card.priceLabel }}</div>
    <div v-if="card.priceTier" class="shop-price-tier">{{ card.priceTier }}</div>
    <button
      type="button" class="btn" :class="card.button.action && card.button.primary ? 'primary' : 'soft'"
      :disabled="!card.button.action" @click="actions.run(card.button.action, card.id)"
    >{{ card.button.label }}</button>
    <button
      v-if="card.sale?.allowed" type="button" class="btn soft mk865-sale-btn" @click="actions.run('sell', card.id)"
    >🪙 Продать</button>
    <div v-if="card.sale?.text" class="mk865-sale-note" :class="card.sale.className">{{ card.sale.text }}</div>
  </div>
  <div v-if="!model.cards.length" class="report-empty" style="grid-column: 1 / -1">
    В этом фильтре пока нет предметов.
  </div>
</template>
