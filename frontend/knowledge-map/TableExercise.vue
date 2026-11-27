<script setup>
import { computed } from 'vue';
import AnswerChoices from './AnswerChoices.vue';
import QuestionNodes from './QuestionNodes.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
const placeHeadings = computed(() => ['Тысячи', 'Сотни', 'Десятки', 'Единицы'].slice(
  -(props.model.placeValues?.[0]?.length || 4),
));

function submitOnEnter(event) {
  if (event.repeat) event.preventDefault();
  else if (event.target.id === 'fin' || event.target.dataset.mk95Fraction) {
    event.preventDefault();
    props.actions.primary();
  }
}
</script>

<template>
  <div class="card" @keydown.enter="submitOnEnter">
    <div v-if="model.promptNodes" class="flash v307-visual-prompt"><QuestionNodes :nodes="model.promptNodes" /></div>
    <div v-else-if="model.safePrompt !== undefined" class="flash" v-html="model.safePrompt"></div>
    <div v-else class="flash">{{ model.prompt ?? `${model.a} × ${model.b} = ?` }}</div>
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
    <div v-if="model.fraction" class="actions" style="align-items:center;justify-content:center">
      <template v-if="model.fraction.kind === 'number'">
        <input class="fin" :class="{bad:model.fraction.number.wrong}" :aria-label="model.fraction.number.label" inputmode="numeric" maxlength="6" autocomplete="off" data-mk95-fraction="answer:0" :value="model.fraction.number.value" :readonly="model.readOnly" :disabled="model.disabled">
      </template>
      <template v-else>
        <input v-if="model.fraction.whole" class="stage18-frac-cell" :class="{bad:model.fraction.whole.wrong}" aria-label="Целая часть" inputmode="numeric" maxlength="6" autocomplete="off" data-mk95-fraction="fraction:0" :value="model.fraction.whole.value" :readonly="model.readOnly" :disabled="model.disabled">
        <span class="frac" style="display:inline-grid;text-align:center">
          <input class="stage18-frac-cell" :class="{bad:model.fraction.numerator.wrong}" aria-label="Числитель" inputmode="numeric" maxlength="6" autocomplete="off" data-mk95-fraction="fraction:1" :value="model.fraction.numerator.value" :readonly="model.readOnly" :disabled="model.disabled">
          <span class="den" style="border-top:2px solid currentColor;padding:5px" aria-label="Заданный знаменатель">{{ model.fraction.denominator }}</span>
        </span>
      </template>
    </div>
    <p v-if="model.fraction && model.fraction.kind !== 'number'" class="meta">Знаменатель уже указан и не меняется.</p>
    <input v-if="!model.fraction"
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
      <div v-if="model.solutionNodes" class="v307-visual-solution"><QuestionNodes :nodes="model.solutionNodes" /></div>
      <ol v-else-if="model.solution?.length" class="school-solution">
        <li v-for="(step, index) in model.solution" :key="index">{{ step }}</li>
      </ol>
    </div>
  </div>
</template>
