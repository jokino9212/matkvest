<script setup>
import AnswerChoices from './AnswerChoices.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="quizq" v-html="model.prompt"></div>
  <div v-if="model.visual" style="display:contents" v-html="model.visual"></div>
  <AnswerChoices v-if="model.choices.length" :choices="model.choices" @choose="actions.choose" @keydown.enter="actions.keydown" />
  <div v-else-if="model.fraction" class="quiz-input-wrap stage18-frac-wrap" @keydown.enter="actions.keydown">
    <div class="quiz-input-label stage18-frac-title">{{ model.inputLabel }}</div>
    <div class="stage18-frac-entry">
      <label v-if="model.fraction.whole" class="stage18-frac-part">
        <span class="stage18-frac-label">
          Целая часть<template v-if="!model.fraction.locked"><br>(если есть)</template>
        </span>
        <input
          :id="model.fraction.whole.id" :class="model.fraction.whole.className" autocomplete="off"
          :inputmode="model.fraction.whole.inputMode" :aria-label="model.fraction.whole.accessibleLabel"
          :value="model.fraction.whole.value" :disabled="model.fraction.whole.disabled"
        >
      </label>
      <div class="stage18-frac-part">
        <div v-if="!model.fraction.locked" class="stage18-frac-label">Дробная часть</div>
        <div class="stage18-frac-stack">
          <template v-for="(field, index) in model.fraction.parts" :key="field.id">
            <div v-if="index" class="stage18-frac-bar" role="presentation"></div>
            <label v-if="model.fraction.locked" class="stage18-frac-part">
              <span class="stage18-frac-label">{{ field.accessibleLabel }}</span>
              <input
                :id="field.id" :class="field.className" autocomplete="off" :inputmode="field.inputMode"
                :aria-label="field.accessibleLabel" :aria-readonly="field.readOnly || null"
                :value="field.value" :disabled="field.disabled" :readonly="field.readOnly"
              >
            </label>
            <input
              v-else :id="field.id" :class="field.className" autocomplete="off" :inputmode="field.inputMode"
              :aria-label="field.accessibleLabel" :value="field.value" :disabled="field.disabled"
            >
          </template>
        </div>
      </div>
    </div>
    <div class="stage18-frac-note">{{ model.hint }}</div>
  </div>
  <div v-else class="quiz-input-wrap" @keydown.enter="actions.keydown">
    <div v-if="model.fields.length > 1" class="quiz-input-label">{{ model.inputLabel }}</div>
    <label v-else class="quiz-input-label" :for="model.fields[0].id">{{ model.inputLabel }}</label>
    <div v-if="model.fields.length > 1" class="coordinate-input-grid">
      <label v-for="field in model.fields" :key="field.id" class="coordinate-input-field">
        <span>{{ field.label }}</span>
        <input
          :id="field.id" :class="field.className" autocomplete="off" :inputmode="field.inputMode"
          :aria-label="field.accessibleLabel" :value="field.value" :disabled="field.disabled"
        >
      </label>
    </div>
    <div v-else class="quiz-input-line">
      <input
        :id="model.fields[0].id" :class="model.fields[0].className" autocomplete="off" :inputmode="model.fields[0].inputMode"
        :value="model.fields[0].value" :disabled="model.fields[0].disabled"
      >
      <span v-if="model.suffix" class="quiz-input-suffix">{{ model.suffix }}</span>
    </div>
    <small class="quiz-input-hint">{{ model.hint }}</small>
  </div>
  <div id="qfb" class="feedback" v-html="model.feedback"></div>
  <div class="actions" @keydown.enter="actions.keydown">
    <button v-if="model.check !== null" id="quizCheck" type="button" class="btn primary" :style="model.check" @click="actions.check">Проверить</button>
    <button id="quizNext" type="button" :class="model.next.className" :style="model.next.style" @click="actions.next">{{ model.next.label }}</button>
    <button id="quizSkip" type="button" class="btn soft" :style="model.skipStyle" @click="actions.skip">⏭ Пропустить задание</button>
  </div>
</template>
