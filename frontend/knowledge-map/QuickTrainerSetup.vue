<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

function preventRepeatedEnter(event) {
  if (event.repeat) event.preventDefault();
}
</script>

<template>
  <div class="quick-reference" @keydown.enter="preventRepeatedEnter">
    <div class="quick-reference-head">
      <div class="quick-reference-icon" v-html="model.icon"></div>
      <div>
        <h2>{{ model.title }}</h2>
        <p>Посмотри на таблицу, выбери нужный диапазон и начинай тренировку.</p>
      </div>
    </div>
    <p class="quick-reference-note">Полный диапазон: {{ model.range }}</p>
    <div style="display: contents" v-html="model.reference"></div>
    <div class="quick-config">
      <div class="quick-config-head"><h3>Что потренируем?</h3><small id="quickSelectionText">{{ model.selection }}</small></div>
      <div class="quick-choice-row">
        <button
          v-for="option in model.choices" :key="option.action" type="button"
          :data-quick-setup="option.action" @click="actions.run(option.action)"
          class="quick-choice" :class="{ active: option.active, all: option.all }" :aria-pressed="option.active"
        >{{ option.label }}</button>
      </div>
      <div class="quick-smart-wrap">
        <div class="quick-smart-title">Режим</div>
        <div class="quick-smart-row">
          <button
            v-for="option in model.smart" :key="option.action" type="button"
            :data-quick-setup="option.action" @click="actions.run(option.action)"
            class="quick-smart-btn" :class="{ active: option.active }" :aria-pressed="option.active"
          >{{ option.label }}</button>
        </div>
        <div class="quick-smart-note">«Повторить» — примеры, которым нужна практика. «Ошибки» — только те, где уже были ошибки.</div>
      </div>
      <div class="quick-personal">{{ model.personal }}</div>
      <div id="quickSmartMessage" role="status">
        <div v-if="model.smartMessage" class="quick-smart-empty">
          <span>{{ model.smartMessage }}</span>
          <button type="button" class="btn soft" data-quick-setup="train-all" @click="actions.run('train-all')">Тренировать все</button>
        </div>
      </div>
    </div>
    <div class="quick-reference-actions">
      <button type="button" class="btn soft" data-quick-setup="home" @click="actions.run('home')">← На главную</button>
      <button type="button" id="quickStartBtn" class="btn primary" data-quick-setup="start" @click="actions.run('start')">Начать тренировку</button>
    </div>
  </div>
</template>
