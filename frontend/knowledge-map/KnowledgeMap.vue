<script setup>
import { computed } from 'vue';
import TopicCard from './TopicCard.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

const grades = Array.from({ length: 8 }, (_, index) => index + 1);
const filters = [
  ['all', 'Все'],
  ['weak', '🔴 Слабые'],
  ['unstable', '🟡 Нестабильные'],
  ['strong', '🟢 Освоенные'],
  ['notstarted', '⚪ Не начато / мало данных'],
];
const sorts = [['course', 'По курсу'], ['attention', 'Требуют внимания']];
const counters = [
  ['mastered', '✅ освоено'],
  ['good', '🟢 хорошо'],
  ['unstable', '🟡 нестабильно'],
  ['weak', '🔴 слабые'],
  ['lowData', '⚪ мало данных'],
  ['notStarted', '⚪ не начато'],
  ['unavailable', '⏳ скоро'],
];
const course = computed(() => props.model.data.courseProgress);
const progress = computed(() => Math.max(0, Math.min(100, Number(course.value.percent) || 0)));
const summary = computed(() => counters.filter(([key]) => key !== 'unavailable' || props.model.data.summary[key]));
</script>

<template>
  <div class="home-back-row">
    <button class="home-back-btn" type="button" @click="actions.back()">← {{ model.backLabel }}</button>
  </div>
  <section class="knowledge-hero">
    <h1>📊 Карта знаний</h1>
    <p>Ученик: <b>{{ model.name }}</b></p>
  </section>

  <div class="knowledge-toolbar" role="group" aria-label="Класс и поиск">
    <button
      v-for="grade in grades"
      :key="grade"
      class="knowledge-grade"
      :class="{ active: model.grade === grade }"
      :aria-pressed="model.grade === grade"
      type="button"
      @click="actions.grade(grade)"
    ><span aria-hidden="true" v-html="actions.gradeIcon(grade)"></span> {{ grade }} класс</button>
    <input
      id="knowledgeSearch"
      class="knowledge-search"
      type="search"
      aria-label="Найти тему"
      placeholder="🔎 Найти тему"
      :value="model.search"
      @input="actions.search($event.target.value)"
    >
  </div>
  <div class="knowledge-toolbar" role="group" aria-label="Статус освоения">
    <button
      v-for="[value, label] in filters"
      :key="value"
      class="knowledge-filter"
      :class="{ active: model.status === value }"
      :aria-pressed="model.status === value"
      type="button"
      @click="actions.status(value)"
    >{{ label }}</button>
  </div>
  <div class="knowledge-toolbar" role="group" aria-label="Порядок тем">
    <button
      v-for="[value, label] in sorts"
      :key="value"
      class="knowledge-sort"
      :class="{ active: model.sort === value }"
      :aria-pressed="model.sort === value"
      type="button"
      @click="actions.sort(value)"
    >{{ label }}</button>
  </div>

  <div class="knowledge-course-summary">
    <div v-if="course.catalogOnly">
      <span>Состояние {{ model.grade }} класса</span><br>
      <b>Каталог подготовлен</b>
      <small>{{ course.catalogTopics }} тем — генераторы добавляются поэтапно</small>
    </div>
    <div v-else>
      <span>Пройдено курса</span><br>
      <b>{{ course.percent }}%</b>
      <small>{{ course.done }}/{{ course.total }} обязательных ступеней</small>
      <div class="teacher-progress-track"><span :style="{ width: progress + '%' }"></span></div>
    </div>
    <div>
      <span>Среднее освоение изученных тем</span><br>
      <b>{{ model.data.averageMastery === null ? '—' : model.data.averageMastery + '%' }}</b>
      <small>{{ model.data.averageMastery === null ? 'Пока мало данных' : 'Не начатые темы в среднее не входят' }}</small>
    </div>
  </div>

  <div class="knowledge-summary">
    <div v-for="[key, label] in summary" :key="key">
      <b>{{ model.data.summary[key] }}</b>
      <small>{{ label }}</small>
    </div>
  </div>
  <div class="knowledge-legend">
    <span>⏳ Скоро</span>
    <span>⚪ Не начато / мало данных</span>
    <span>🔴 Слабая тема</span>
    <span>🟡 Нестабильно</span>
    <span>🟢 Хорошо</span>
    <span>✅ Освоено</span>
  </div>

  <section v-for="section in model.sections" :key="section.id" class="knowledge-section">
    <div class="knowledge-section-head">
      <div>
        <h2>{{ section.title }}</h2>
        <small>{{ section.desc || '' }}</small>
      </div>
      <small>{{ section.topics.length }} тем</small>
    </div>
    <div class="knowledge-grid">
      <TopicCard
        v-for="topic in section.topics"
        :key="topic.key"
        :topic="topic"
        :status-label="actions.topicStatus(topic)"
        :activity-date="topic.lastActivityAt ? actions.formatDate(topic.lastActivityAt) : ''"
        @open="actions.open"
      />
    </div>
  </section>
  <div v-if="!model.sections.length" class="knowledge-empty">По выбранному фильтру тем нет.</div>
</template>
