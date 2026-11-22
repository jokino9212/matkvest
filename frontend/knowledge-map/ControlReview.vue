<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back()">← Главный экран</button>
  </div>
  <section class="control-hero">
    <h1>🔁 Контрольное повторение</h1>
    <p>Проверка по уже изученным темам. Результаты попадут в журнал и Карту знаний.</p>
  </section>
  <div class="control-setup">
    <section class="control-box">
      <h3>Выбери класс</h3>
      <div class="control-choice-row" role="group" aria-label="Класс">
        <button
          v-for="choice in model.grades" :key="choice.id"
          type="button" class="control-choice" :class="{ active: model.grade === choice.id }"
          :aria-pressed="model.grade === choice.id" :disabled="choice.disabled"
          @click="actions.grade(choice.id)"
        >
          <span v-if="choice.icon" aria-hidden="true" v-html="choice.icon"></span>
          {{ choice.label }}
        </button>
      </div>
      <div class="control-summary-line">
        Изучено тем: <b>{{ model.studiedCount }}</b>
        <template v-if="model.groups.length"><br>Разделы: {{ model.groups.join(' • ') }}</template>
      </div>
    </section>
    <section class="control-box">
      <h3>Размер блока</h3>
      <div class="control-choice-row" role="group" aria-label="Размер блока">
        <button
          v-for="size in [10, 15, 20]" :key="size"
          type="button" class="control-choice" :class="{ active: model.count === size }"
          :aria-pressed="model.count === size" @click="actions.count(size)"
        >{{ size }} заданий</button>
      </div>
      <div class="control-summary-line">Слабые и нестабильные темы встречаются немного чаще.</div>
    </section>
  </div>
  <div v-if="model.studiedCount" class="actions">
    <button type="button" class="btn primary" @click="actions.start()">Начать {{ model.count }} заданий</button>
  </div>
  <div v-else class="report-empty">{{ model.emptyText }}</div>
</template>
