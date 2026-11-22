<script setup>
import { computed, ref } from 'vue';
import CourseSectionProgress from './CourseSectionProgress.vue';
import TextbookContents from './TextbookContents.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
const search = ref('');
const searchInput = ref(null);
const normalize = text => text.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const query = computed(() => normalize(search.value));
const words = computed(() => query.value.split(' ').filter(Boolean));
const byParagraph = computed(() => props.model.grade >= 6 && /^\d+$/.test(query.value));
const subjects = computed(() => props.model.subjects || [{ id: 'all', sections: props.model.sections }]);
const sections = computed(() => subjects.value.flatMap(subject => subject.sections));
const matchingRows = computed(() => {
  if (!words.value.length || !props.model.contents) return new Set();
  const grade = props.model.grade;
  const numberOnly = grade > 3 && grade !== 5 && /^\d+$/.test(query.value);
  const rows = props.model.contents.parts.flatMap(part =>
    part.chapters.flatMap(chapter => chapter.sections.flatMap(section => section.rows))
  );
  return new Set(rows.filter(row => {
    if (numberOnly) return row.number === Number(query.value);
    return words.value.every(word => grade >= 7 && /^\d+$/.test(word)
      ? row.number === Number(word)
      : row.searchable.includes(word));
  }));
});
const contentsMatches = computed(() => new Set([...matchingRows.value].flatMap(row => row.ids)));
function matches(topic, section) {
  const id = props.model.grade === 4 ? 'g4:' + topic.id : topic.id;
  if (contentsMatches.value.has(id)) return true;
  if (byParagraph.value) return false;
  const text = normalize([topic.title, topic.subtitle, topic.subject, topic.aliases, section.title].join(' '));
  return words.value.every(word => text.includes(word));
}
const sectionMatches = section => !words.value.length || section.topics.some(topic => matches(topic, section));
const total = computed(() => sections.value.reduce((sum, section) => sum + section.topics.length, 0));
const shown = computed(() => sections.value.reduce((sum, section) =>
  sum + section.topics.filter(topic => matches(topic, section)).length, 0
));
function clearSearch() {
  search.value = '';
  searchInput.value?.focus();
}
function openContentsTopic(id) {
  search.value = '';
  props.actions.open(props.model.grade === 4 ? id.slice(3) : id);
}
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back()">← Главный экран</button>
  </div>
  <section class="grade-hero">
    <div><h1>Математика {{ model.grade }} класса</h1><p>{{ model.description }}</p></div>
    <span class="grade-chip"><span v-html="model.icon" aria-hidden="true"></span> {{ model.grade }} класс</span>
  </section>
  <section id="mk19c4-topic-tools" aria-label="Поиск учебных тем">
    <div class="mk19c4-search-row">
      <div class="mk19c4-search-wrap">
        <input
          ref="searchInput" v-model="search" class="mk19c4-search-input" type="search"
          :id="'grade-' + model.grade + '-topic-search'" :name="'grade-' + model.grade + '-topic-search'"
          aria-label="Найти учебную тему" placeholder="Найти тему по названию…" autocomplete="off" spellcheck="false"
        >
      </div>
      <button type="button" class="mk19c4-clear" :disabled="!search" @click="clearSearch">Очистить</button>
    </div>
    <div class="mk19c4-count" role="status">
      {{ words.length ? 'Найдено тем: ' + shown + ' из ' + total : 'Всего тем: ' + total }}
    </div>
    <div class="mk19c4-empty" :data-visible="String(words.length > 0 && !shown)">
      Темы не найдены. Измени запрос или очисти поиск.
    </div>
  </section>
  <section id="mk19f-grade-strip" :data-grade="model.grade" aria-label="Учебный прогресс этого класса">
    <div class="mk19f-grade-copy">
      <div class="mk19f-grade-title">
        <strong>Учебный прогресс</strong>
        <span>{{ model.progress.done }} из {{ model.progress.total }} этапов · {{ model.progress.percent }}%</span>
      </div>
      <span
        class="mk19f-progress-track" role="progressbar" aria-valuemin="0"
        :aria-label="'Пройдено этапов в ' + model.grade + ' классе: ' + model.progress.done + ' из ' + model.progress.total"
        :aria-valuemax="model.progress.total" :aria-valuenow="model.progress.done"
      ><span class="mk19f-progress-fill" :style="{ width: model.progress.percent + '%' }"></span></span>
      <div class="mk19f-grade-note">
        Разминка: {{ model.progress.warmup }} · Тренировка: {{ model.progress.training }} · Мастерство: {{ model.progress.master }}
      </div>
    </div>
    <button type="button" class="mk19f-open-all" @click="actions.progress()">Весь прогресс</button>
  </section>
  <TextbookContents
    v-if="model.contents" :key="model.grade" :grade="model.grade" :parts="model.contents.parts"
    :query="query" :matching-rows="matchingRows" @open="openContentsTopic"
  />
  <component
    :is="subject.title ? 'section' : 'div'" v-for="subject in subjects"
    v-show="subject.sections.some(sectionMatches)" :key="subject.id"
    :class="subject.title ? 'g7-course' : null" :style="subject.title ? null : { display: 'contents' }"
    :aria-label="subject.title"
  >
    <div v-if="subject.title" class="grade-head"><div>
      <h2 :class="{ 'mk874-section-heading': subject.iconHtml }">
        <span v-if="subject.iconHtml" style="display:contents" v-html="subject.iconHtml"></span>
        <span :class="{ 'mk874-section-label': subject.iconHtml }">{{ subject.title }}</span>
      </h2>
      <p v-if="subject.description">{{ subject.description }}</p>
      <CourseSectionProgress :done="subject.done" :total="subject.total" />
    </div></div>
    <section
      v-for="section in subject.sections" v-show="sectionMatches(section)" :key="section.id"
      :class="[model.grade === 5 ? 'g5-group' : 'g6-group', section.className]" :aria-label="section.title"
    >
      <div class="grade-head"><div>
        <h2 :class="{ 'mk874-section-heading': section.iconHtml }">
          <span v-if="section.iconHtml" style="display:contents" v-html="section.iconHtml"></span>
          <span :class="{ 'mk874-section-label': section.iconHtml }">{{ section.title }}</span>
        </h2>
        <p v-if="section.description">{{ section.description }}</p>
        <CourseSectionProgress v-if="!section.trainers" :done="section.done" :total="section.topics.length" />
      </div></div>
      <div v-if="section.mix" class="g5-mix">
        <div><b>🎲 Микс по дробям</b><small>12 заданий из разделов обыкновенных дробей.</small></div>
        <button type="button" class="btn primary" @click="actions.mix()">Играть</button>
      </div>
      <div class="grid">
        <button
          v-for="topic in section.topics" v-show="matches(topic, section)" :key="topic.id"
          type="button" class="topic" :class="topic.className"
          :data-topic-id="model.grade === 4 ? 'g4:' + topic.id : topic.id" @click="actions.open(topic.id)"
        >
          <span v-if="topic.iconHtml" style="display:contents" v-html="topic.iconHtml"></span>
          <span v-else class="ico" aria-hidden="true">{{ topic.icon }}</span>
          <strong>{{ topic.title }}</strong><small>{{ topic.subtitle }}</small>
          <span v-if="topic.subject" class="g7-course-chip">{{ topic.subject }}</span>
          <span v-if="topic.pending" class="elementary-soon">Скоро</span>
          <span v-else class="topic-progress">{{ topic.progress }}</span>
        </button>
      </div>
    </section>
  </component>
</template>
