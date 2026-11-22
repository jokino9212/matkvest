<script setup>
import { computed } from 'vue';

const props = defineProps({
  topic: { type: Object, required: true },
  statusLabel: { type: String, required: true },
  activityDate: { type: String, default: '' },
});
defineEmits(['open']);

const mastery = computed(() => {
  const topic = props.topic;
  if (topic.displayStatus === 'unavailable') return 'Тема ещё не доступна';
  if (topic.masteryPercent === null) {
    return topic.displayStatus === 'notstarted' ? 'Не начато' : 'Мало данных';
  }
  return `Освоение: ${topic.masteryPercent}%${topic.preliminary ? ' • предварительно' : ''}`;
});
const progress = computed(() => Math.max(0, Math.min(100, props.topic.masteryPercent)));
const lastActivity = computed(() => {
  const topic = props.topic;
  if (topic.displayStatus === 'unavailable') return 'Учебный генератор будет подключён позже';
  if (props.activityDate) return 'Последняя работа: ' + props.activityDate;
  return topic.started ? 'Есть прогресс, дата неизвестна' : 'Ещё не проходил';
});
</script>

<template>
  <button class="knowledge-card" :class="topic.displayStatus" type="button" @click="$emit('open', topic.key)">
    <div class="knowledge-card-title">{{ statusLabel }}<br>{{ topic.title }}</div>
    <div class="knowledge-card-sub">{{ topic.group }}</div>
    <div class="knowledge-card-mastery">{{ mastery }}</div>
    <div v-if="topic.masteryPercent !== null" class="knowledge-progress-track">
      <span :style="{ width: progress + '%' }"></span>
    </div>
    <div v-if="topic.stages.length" class="knowledge-stages">
      <span
        v-for="stage in topic.stages"
        :key="stage.index"
        class="knowledge-stage"
        :class="{ passed: stage.passed }"
        :title="stage.name + ': ' + stage.best + '/' + stage.total"
      >{{ stage.ico }} {{ stage.passed ? '✅' : '○' }}</span>
    </div>
    <div v-if="topic.activeErrors" class="knowledge-errors">🧠 Требует отработки: {{ topic.activeErrors }}</div>
    <div class="knowledge-last">{{ lastActivity }}</div>
  </button>
</template>
