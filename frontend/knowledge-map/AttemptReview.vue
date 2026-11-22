<script setup>
import ReportHeader from './ReportHeader.vue';
import ReportStats from './ReportStats.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div v-if="model.active" class="report-active">🟡 Блок ещё выполняется. Здесь показаны уже сохранённые ответы.</div>
  <div class="lesson"><b>{{ model.stage }}</b> • {{ model.date }} • {{ model.duration }}<br>{{ model.status }}</div>
  <ReportStats :stats="model.stats" />
  <div class="review-items">
    <div v-if="!model.items.length" class="report-empty">Пока нет отвеченных заданий.</div>
    <div v-for="(item, index) in model.items" :key="index" class="review-item" :class="item.statusClass">
      <div class="review-item-head">
        <div class="review-number">{{ index + 1 }}. {{ item.label }}</div>
        <div class="review-status">{{ item.status }}</div>
      </div>
      <div v-if="item.sourceTitle" class="source-note"><b>Источник:</b> {{ item.sourceTitle }}</div>
      <div class="review-problem" v-html="item.promptHtml"></div>
      <div class="review-answer-grid">
        <div class="review-answer"><b>Ответ ученика</b><div v-html="item.studentHtml"></div></div>
        <div class="review-answer"><b>Правильный ответ</b><div v-html="item.correctHtml"></div></div>
      </div>
      <div v-if="item.explanationHtml" class="check-details"><b>Разбор:</b> <span v-html="item.explanationHtml"></span></div>
      <div v-if="item.checks.length" class="check-list">
        <div v-for="(check, checkIndex) in item.checks" :key="checkIndex" class="check-row" :class="check.correct ? 'good' : 'bad'">
          <b>{{ check.correct ? 'Итоговая проверка' : 'Проверка ' + (checkIndex + 1) }}:</b>
          {{ check.correct ? 'верно' : 'неверно' }}
          <template v-if="check.answer !== undefined && String(check.answer) !== ''">
            • ответ ученика: <b>{{ check.answer }}</b>
          </template>
          <div v-if="check.details?.length" class="check-details">
            <template v-for="(detail, detailIndex) in check.details" :key="detailIndex">
              <br v-if="detailIndex">{{ detail }}
            </template>
          </div>
        </div>
        <div v-if="item.hiddenRepeats" class="meta" style="margin-top:5px">Повторные одинаковые нажатия скрыты: {{ item.hiddenRepeats }}</div>
      </div>
      <div v-if="item.remediationDate" class="remediation-note">🧠 Отработано {{ item.remediationDate }}</div>
      <div class="meta" style="margin-top:7px">Время: {{ item.duration }}</div>
    </div>
  </div>
  <div class="actions">
    <button v-if="actions.result" type="button" class="btn soft" @click="actions.result()">← К итогам</button>
    <button type="button" class="btn soft" @click="actions.journal()">← К журналу</button>
  </div>
</template>
