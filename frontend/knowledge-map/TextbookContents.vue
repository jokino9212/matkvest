<script>
const collapsedGrades = new Set();
</script>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  grade: { type: Number, required: true },
  parts: { type: Array, required: true },
  query: { type: String, required: true },
  matchingRows: { type: Set, required: true },
});
const emit = defineEmits(['open']);
const collapsed = ref(collapsedGrades.has(props.grade));
const openChapters = ref(new Set());
const closedDuringSearch = ref(new Set());

function setCollapsed(value) {
  collapsed.value = value;
  if (value) collapsedGrades.add(props.grade);
  else collapsedGrades.delete(props.grade);
}

watch(() => props.query, query => {
  closedDuringSearch.value.clear();
  if (query) setCollapsed(false);
});

const rowVisible = row => !props.query || props.matchingRows.has(row);
const sectionVisible = section => section.rows.some(rowVisible);
const chapterVisible = chapter => chapter.sections.some(sectionVisible);
const isOpen = id => props.query ? !closedDuringSearch.value.has(id) : openChapters.value.has(id);

function toggleChapter(id) {
  const state = props.query ? closedDuringSearch.value : openChapters.value;
  if (state.has(id)) state.delete(id);
  else state.add(id);
}
</script>

<template>
  <section
    :id="'mk-g' + grade + '-textbook-nav'" class="mk-g5-toc"
    :class="{ 'mk-g5-toc-collapsed': collapsed }" :aria-labelledby="'mk-g' + grade + '-toc-heading'"
  >
    <div class="mk-g5-toc-head">
      <h2 :id="'mk-g' + grade + '-toc-heading'">Темы {{ grade }} класса</h2>
      <div class="mk-g5-toc-actions">
        <button
          type="button" class="mk-g5-toc-toggle" :aria-controls="'mk-g' + grade + '-toc-parts'"
          :aria-expanded="!collapsed" @click="setCollapsed(!collapsed)"
        >{{ collapsed ? 'Показать разделы' : 'К карточкам' }}</button>
      </div>
    </div>
    <div :id="'mk-g' + grade + '-toc-parts'" class="mk-g5-toc-body" :hidden="collapsed">
      <div
        v-for="part in parts" :key="part.id" class="mk-g5-toc-part"
        :hidden="!part.chapters.some(chapterVisible)"
      >
        <h3 class="mk-g5-toc-part-heading">{{ part.title }}</h3>
        <details
          v-for="chapter in part.chapters" :key="chapter.id" class="mk-g5-toc-chapter"
          :hidden="!chapterVisible(chapter)" :open="isOpen(chapter.id)"
        >
          <summary @click.prevent="toggleChapter(chapter.id)">
            <span v-if="chapter.ordinal" class="mk-g5-toc-num">{{ chapter.ordinal }}</span>
            <span>{{ chapter.title }}</span>
          </summary>
          <ol class="mk-g5-toc-list" :start="chapter.start">
            <template v-for="section in chapter.sections" :key="section.id">
              <li v-if="section.title" class="mk-g7-toc-section" :hidden="!sectionVisible(section)">
                {{ section.title }}
              </li>
              <li
                v-for="row in section.rows" :key="row.id" :value="row.number"
                :data-paragraph="row.number" :hidden="!rowVisible(row)"
              >
                <div
                  v-for="link in row.links" :key="link.id"
                  :class="{ 'mk-g5-toc-extra': link.secondary }" :style="link.secondary ? null : 'display: contents'"
                >
                  <button type="button" class="mk-g5-toc-link" :data-topic-id="link.id" @click="emit('open', link.id)">
                    <span class="mk-g5-toc-item-number" aria-hidden="true">{{ link.secondary ? '↳' : row.number ?? '•' }}</span>
                    <span class="mk-g5-toc-item-title">
                      {{ link.title }}
                      <small v-if="link.subtitle" class="mk-g6-toc-topic-name">{{ link.subtitle }}</small>
                    </span>
                  </button>
                </div>
                <strong v-if="row.missing" :class="grade === 5 ? 'mk-g5-toc-missing' : 'mk-g6-toc-unavailable'">
                  {{ row.missing }}
                </strong>
                <small v-if="row.status" class="mk-g6-toc-status">{{ row.status }}</small>
              </li>
            </template>
          </ol>
        </details>
      </div>
    </div>
  </section>
</template>
