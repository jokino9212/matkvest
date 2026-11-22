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
  <div class="block-result">
    <h3>Результат: {{ model.correct }} / {{ model.total }}</h3>
    <ReportStats :stats="model.stats" />
    <div v-if="model.topics.length" class="level-box" style="text-align:left">
      <b>По темам</b>
      <div v-for="topic in model.topics" :key="topic.key" class="control-topic-result">
        <div><b>{{ topic.title }}</b><small>{{ topic.status }}</small></div>
        <b>{{ topic.correct }}/{{ topic.total }}</b>
        <small>
          <template v-if="topic.corrected">🟡 {{ topic.corrected }} исправлено<br></template>
          <template v-if="topic.wrong">❌ {{ topic.wrong }} неверно<br></template>
          <template v-if="topic.skipped">⏭ {{ topic.skipped }} пропущено</template>
        </small>
      </div>
    </div>
    <div v-if="model.attention.length" class="teacher-danger" style="margin-top:10px">
      <b>Стоит повторить:</b> {{ model.attention.join(' • ') }}
    </div>
    <p>Ответы сохранены в журнале и учтены в Карте знаний.</p>
    <div class="actions">
      <button type="button" class="btn soft" @click="actions.review()">📋 Разбор попытки</button>
      <button type="button" class="btn soft" @click="actions.repeat()">Повторить контрольное</button>
      <button type="button" class="btn soft" @click="actions.map()">📊 Карта знаний</button>
      <button v-if="model.attention.length" type="button" class="btn soft" @click="actions.weak()">🎯 Слабые темы</button>
      <button v-if="model.activeErrors" type="button" class="btn soft" @click="actions.errors()">🧠 Работа над ошибками</button>
      <button type="button" class="btn soft" @click="actions.home()">Главный экран</button>
    </div>
  </div>
</template>
