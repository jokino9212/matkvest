<script setup>
defineProps({ model: { type: Object, required: true } });
</script>

<template>
  <span>📦 Стоимость коллекции</span>
  <strong>{{ model.amount }} 🪙</strong>
  <small>Все принадлежащие предметы по ценам каталога</small>
</template>
