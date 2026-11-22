<script setup>
import { computed } from 'vue';
import AnswerChoices from './AnswerChoices.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
const placeHeadings = computed(() => ['Тысячи', 'Сотни', 'Десятки', 'Единицы'].slice(
  -(props.model.placeValues?.[0]?.length || 4),
));

function submitOnEnter(event) {
  if (event.repeat) event.preventDefault();
  else if (event.target.id === 'fin') {
    event.preventDefault();
    props.actions.primary();
  }
}
</script>

<template>
  <div class="card" @keydown.enter="submitOnEnter">
    <div class="flash">{{ model.prompt ?? `${model.a} × ${model.b} = ?` }}</div>
    <div v-if="model.placeValues" class="mk-g5-comparison-table" style="overflow-x: auto; margin-bottom: 12px">
      <table style="width: 100%; text-align: center">
        <caption>Разряды двух натуральных чисел</caption>
        <thead>
          <tr><th scope="col">Число</th><th v-for="heading in placeHeadings" :key="heading" scope="col">{{ heading }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(digits, row) in model.placeValues" :key="row">
            <th scope="row">{{ row ? 'Второе' : 'Первое' }}</th>
            <td v-for="(digit, position) in digits" :key="position">{{ digit }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AnswerChoices
      v-if="model.choices" :choices="model.choices" container-class="school-numeric-choices"
      @choose="actions.pick"
    />
    <input
      id="fin" class="fin" inputmode="numeric" :maxlength="model.maxDigits ?? 3" aria-label="Ответ"
      :type="model.choices ? 'hidden' : 'text'" autocomplete="off"
      :data-row="model.answerCell === false ? null : 'answer'" :data-col="model.answerCell === false ? null : '0'"
      :value="model.answer" :disabled="model.disabled" :readonly="model.readOnly"
      :class="{ bad: model.wrong }"
    >
    <div class="actions">
      <button
        id="tablePrimary" v-show="!model.choices || model.nextReady" type="button" class="btn primary"
        :class="{ 'next-ready': model.nextReady }" @click="actions.primary"
      >
        {{ model.primaryLabel }}
      </button>
      <button
        v-show="!model.hideSkip" id="tableSkip" type="button" class="btn soft" @click="actions.skip"
      >{{ model.skipLabel ?? '⏭ Пропустить задание' }}</button>
    </div>
    <div v-if="model.feedbackHtml !== undefined" id="tfb" class="feedback" role="status" v-html="model.feedbackHtml"></div>
    <div v-else id="tfb" class="feedback" role="status">
      {{ model.feedback }}
      <ol v-if="model.solution?.length" class="school-solution">
        <li v-for="(step, index) in model.solution" :key="index">{{ step }}</li>
      </ol>
    </div>
  </div>
</template>
