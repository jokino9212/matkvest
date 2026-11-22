<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="quick-live">
    <span class="quick-chip">Всего: <b id="quickAnswered">{{ model.answered }}</b></span>
    <span class="quick-chip">✅ Правильно: <b id="quickCorrect">{{ model.correct }}</b></span>
    <span class="quick-chip">🔥 Серия: <b id="quickSessionStreak">{{ model.streak }}</b></span>
  </div>
  <div class="quick-question" :class="{ words: model.words }" v-html="model.question"></div>
  <div class="quick-answers" @keydown.enter="actions.keydown">
    <button
      v-for="choice in model.choices" :key="choice.value" type="button" :class="choice.className"
      :data-quick-option="choice.value" :disabled="choice.disabled" @click="actions.choose(choice.value)"
    >{{ choice.value }}</button>
  </div>
  <div id="quickFeedback" :class="model.feedbackClass" role="status" v-html="model.feedback"></div>
  <div class="quick-next" @keydown.enter="actions.keydown">
    <button type="button" class="btn primary" id="quickNextBtn" :style="model.nextStyle" @click="actions.next">Следующий пример →</button>
  </div>
  <div class="quick-end-row" @keydown.enter="actions.keydown">
    <button type="button" class="btn soft quick-end-btn" @click="actions.finish">Завершить тренировку</button>
  </div>
</template>
