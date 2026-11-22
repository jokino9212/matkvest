<script setup>
defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back">← {{ model.name }}</button>
  </div>
  <section :class="model.kind === 'topics' ? 'weak-hero' : 'errorwork-hero'">
    <h1>{{ model.title }}</h1>
    <p>{{ model.description }}</p>
  </section>
  <div :class="model.kind === 'topics' ? 'weak-summary' : 'error-summary'">
    <div v-for="item in model.summary" :key="item.id" :data-teacher-review-stat="item.id">
      <b>{{ item.value }}</b><small>{{ item.label }}</small>
    </div>
  </div>

  <div v-if="model.kind === 'topics'" class="weak-grid">
    <section v-for="row in model.rows" :key="row.key" class="weak-card" :data-teacher-topic="row.key">
      <h3>{{ row.status }} • {{ row.title }}</h3>
      <div class="weak-sub">{{ row.grade }} класс • {{ row.group }}</div>
      <div class="weak-percent">{{ row.mastery }}</div>
      <div v-if="row.preliminary" class="weak-preliminary">Предварительная оценка</div>
      <div class="weak-stats">
        <span v-for="item in row.stats" :key="item.id">{{ item.label }}: <b>{{ item.value }}</b></span>
      </div>
      <div class="weak-actions">
        <button type="button" class="btn soft" @click="actions.detail(row.key)">Подробнее</button>
      </div>
    </section>
    <div v-if="!model.rows.length" class="teacher-empty" role="status">{{ model.empty }}</div>
  </div>

  <template v-else>
    <div class="error-groups">
      <section v-for="row in model.rows" :key="row.id" class="error-group" :data-teacher-error-topic="row.topicKey">
        <div>
          <h3>{{ row.title }}</h3>
          <small>{{ row.grade }} класс • {{ row.description }}</small>
          <span class="error-state" :class="row.active ? 'red' : 'green'">
            {{ row.active ? '🔴 Требует отработки' : '✅ Отработано' }}
          </span>
        </div>
        <button v-if="row.topicKey" type="button" class="btn soft" @click="actions.detail(row.topicKey)">Подробнее</button>
      </section>
      <div v-if="!model.rows.length" class="teacher-empty" role="status">{{ model.empty }}</div>
    </div>
    <div class="lesson">Чтобы запустить тренировку ошибок, открой профиль ученика.</div>
    <div class="actions">
      <button type="button" class="btn primary" @click="actions.student">Открыть как ученик</button>
    </div>
  </template>
</template>
