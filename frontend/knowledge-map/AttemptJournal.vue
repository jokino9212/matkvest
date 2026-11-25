<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <section v-if="model.serverReadOnly" data-mk95-server>
    <p>Подтверждённые записи выбранного ученика (до 50).</p>
    <div v-if="!model.rows.length" class="report-empty">Пока нет попыток.</div>
    <div class="report-list">
      <article v-for="row in model.rows" :key="row.id" class="report-card">
        <div><b>{{ row.title }}</b><div class="meta">{{ row.status }} · {{ row.date }} · {{ row.source }}</div></div>
        <div class="report-score">{{ row.score }}</div>
      </article>
    </div>
    <p v-if="model.more">Есть более ранние записи. Постраничная загрузка будет подключена отдельно.</p>
  </section>
  <template v-else-if="model.rows.length">
    <div class="lesson">В журнале хранятся последние <b>50 завершённых или прерванных попыток</b>.</div>
    <div class="report-list">
      <button v-for="(row, index) in model.rows" :key="index" type="button" class="report-card" @click="actions.review(index)">
        <div>
          <b>{{ row.title }}<template v-if="row.stage && row.stage !== row.title"> — {{ row.stage }}</template></b>
          <div class="meta">
            {{ row.status }} • {{ row.date }} • {{ row.duration }}<br>
            Заданий в разборе: {{ row.itemCount }}{{ row.hasCurrent ? ' + текущее' : '' }}
          </div>
        </div>
        <div class="report-score" :class="row.scoreClass">{{ row.score }}</div>
      </button>
    </div>
  </template>
  <div v-else class="report-empty">Здесь появится разбор после первой попытки.</div>
  <div v-if="actions.back" class="actions">
    <button type="button" class="btn soft" @click="actions.back()">← К ученику</button>
  </div>
</template>
