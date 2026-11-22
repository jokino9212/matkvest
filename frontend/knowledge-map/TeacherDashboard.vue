<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.close">← Главный экран</button>
  </div>
  <section class="teacher-hero">
    <div class="teacher-detail-head">
      <div>
        <h1>👨‍🏫 Панель преподавателя</h1>
        <p>Показатели рассчитаны по сохранённым профилям учеников.</p>
      </div>
      <button type="button" class="btn soft" @click="actions.close">🔒 Закрыть режим преподавателя</button>
    </div>
  </section>
  <div id="teacherDashboardBody">
    <div class="teacher-summary">
      <div v-for="{ label, value } in model.stats" :key="label"><b>{{ value }}</b><small>{{ label }}</small></div>
    </div>
    <div class="teacher-toolbar">
      <input id="teacherSearchInput" type="search" class="teacher-search" aria-label="Найти ученика"
        placeholder="🔎 Найти ученика" :value="model.search" @input="actions.search($event.target.value)">
      <select class="teacher-select" aria-label="Сортировать учеников" :value="model.sort"
        @change="actions.sort($event.target.value)">
        <option v-for="{ id, label } in model.sorts" :key="id" :value="id">{{ label }}</option>
      </select>
    </div>
    <div class="teacher-filter-row" role="group" aria-label="Фильтры учеников">
      <button v-for="{ id, label } in model.filters" :key="id" type="button" class="teacher-filter"
        :class="{ active: id === model.filter }" :aria-pressed="id === model.filter"
        @click="actions.filter(id)">{{ label }}</button>
    </div>
    <div class="actions" style="justify-content:flex-start">
      <button type="button" class="btn soft" @click="actions.profiles">+ Новый ученик</button>
      <button type="button" class="btn soft" @click="actions.backup">💾 Резервная копия</button>
    </div>
    <div v-if="model.hasStudents" class="teacher-student-grid">
      <section v-for="row in model.rows" :key="row.profileId" class="teacher-student-card">
        <div class="teacher-student-head">
          <div class="teacher-student-id">
            <span style="display:contents" v-html="row.avatar"></span>
            <div><h3>{{ row.name }}</h3><small>Уровень {{ row.level }} • {{ row.xp }} XP</small></div>
          </div>
          <span class="teacher-attention" :class="{ 'teacher-calm': !row.attention }">
            {{ row.attention ? '⚠️ Требует внимания' : '✅ Спокойно' }}
          </span>
        </div>
        <div class="teacher-progress-lines">
          <div v-for="grade in row.grades" :key="grade.number" class="teacher-progress-line">
            <span><span style="display:contents" v-html="grade.icon"></span> {{ grade.number }} класс</span>
            <div class="teacher-progress-track"><span :style="{ width: grade.percent + '%' }"></span></div>
            <b>{{ grade.label }}</b>
          </div>
        </div>
        <div class="teacher-card-metrics">
          <span>🔴 Слабых: {{ row.weakCount }}</span><span>🟡 Нестабильных: {{ row.unstableCount }}</span>
          <span>🧠 Ошибок: {{ row.activeErrors }}</span><span v-if="row.recentSkipped">⏭ Пропусков: {{ row.recentSkipped }}</span>
        </div>
        <div class="teacher-card-foot">
          <span>{{ row.lastActivity }}</span>
          <button type="button" class="btn soft" @click="actions.open(row.profileId)">Открыть</button>
        </div>
      </section>
      <div v-if="!model.rows.length" class="teacher-empty" role="status">По выбранному фильтру учеников нет.</div>
    </div>
    <div v-else class="teacher-empty">
      <b>Пока нет учеников.</b>
      <div class="actions"><button type="button" class="btn primary" @click="actions.profiles">+ Создать ученика</button></div>
    </div>
  </div>
</template>
