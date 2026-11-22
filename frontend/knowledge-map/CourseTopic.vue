<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div v-if="model.operations" class="lesson">
    В письменных вычислениях цифры одинаковых разрядов стоят друг под другом.
    Выбери действие, чтобы открыть объяснение и тренировку.
  </div>
  <div v-else class="lesson" :class="model.lessonClass">
    <div v-if="model.theory" v-html="model.theory"></div>
    <template v-else>Тема состоит из трёх ступеней. Следующая открывается после прохождения предыдущей.</template>
    <p v-if="model.column"><small>Клетки переноса и отметки занимания можно оставлять пустыми.</small></p>
  </div>
  <div v-if="model.operations" class="operation-grid">
    <button
      v-for="operation in model.operations" :key="operation.id"
      type="button" class="operation-card" @click="actions.operation(operation.id)"
    >
      <strong>{{ operation.icon }} {{ operation.name }}</strong>
      <small>Разминка → Тренировка → Мастер</small>
      <span class="topic-progress">{{ operation.done }}/3 этапа</span>
    </button>
  </div>
  <template v-else>
    <div class="stage-grid">
      <button
        v-for="stage in model.stages" :key="stage.index"
        type="button" class="stage-card" :class="{ locked: !stage.unlocked }" :disabled="!stage.unlocked"
        @click="actions.start(stage.index)"
      >
        <span class="stage-lock">{{ stage.passed ? '✅' : stage.unlocked ? '' : '🔒' }}</span>
        <span class="stage-ico">{{ stage.icon }}</span>
        <strong>{{ stage.index + 1 }}. {{ stage.name }}</strong>
        <small>{{ stage.count }} {{ model.column ? 'примеров' : 'заданий' }} • пройти: {{ stage.requirement }}<br>{{ stage.description }}</small>
        <div class="stage-best">{{ stage.best ? 'Лучший результат: ' + stage.best + '/' + stage.count : 'Ещё не пройден' }}</div>
      </button>
    </div>
    <div class="subtle">Пройдено этапов: <b>{{ model.done }}/3</b>. Лучший результат сохраняется в профиле ученика.</div>
  </template>
</template>
