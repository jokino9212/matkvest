<script setup>
import TeacherStudentAnalytics from './TeacherStudentAnalytics.vue';
import TeacherCourseProgress from './TeacherCourseProgress.vue';
import TeacherStudentMilestones from './TeacherStudentMilestones.vue';

defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.back">← Все ученики</button>
  </div>
  <section class="teacher-hero">
    <div class="teacher-detail-head">
      <div class="teacher-person">
        <span style="display:contents" v-html="model.avatar"></span>
        <div>
          <h1>{{ model.name }}</h1>
          <div v-if="model.title" class="teacher-profile-title">🏷️ {{ model.title }}</div>
          <span style="display:contents" v-html="model.badges"></span>
          <div class="meta">
            Уровень {{ model.level }} • {{ model.xp }} XP • 🪙 {{ model.coins }}<br>
            Решено: {{ model.solved }} • Лучшая серия: {{ model.bestStreak }}<br>
            Последняя учебная активность: <b>{{ model.activity }}</b>
          </div>
        </div>
      </div>
      <button type="button" class="btn soft" @click="actions.close">🔒 Закрыть режим</button>
    </div>
  </section>
  <div class="teacher-period-row" role="group" aria-label="Период статистики ученика">
    <button v-for="{ id, label } in model.periods" :key="id" type="button" class="teacher-filter"
      :class="{ active: id === model.period }" :aria-pressed="id === model.period"
      @click="actions.period(id)">{{ label }}</button>
  </div>
  <TeacherStudentAnalytics :analytics="model.analytics" :plan="model.plan" :run="actions.analytics" />
  <div class="teacher-detail-grid">
    <section v-for="group in model.courses" :key="group.id" class="teacher-panel"
      :data-teacher-course-g1="group.id === 1 ? '1' : null" :data-teacher-course-g2="group.id === 2 ? '1' : null">
      <TeacherCourseProgress v-for="course in group.courses" :key="course.grade" :course="course" />
    </section>
    <section class="teacher-panel">
      <h2>🧠 Работа над ошибками</h2>
      <div class="teacher-kpis">
        <div class="teacher-kpi"><b>{{ model.errors.active }}</b><small>активно</small></div>
        <div class="teacher-kpi"><b>{{ model.errors.resolved }}</b><small>отработано</small></div>
      </div>
      <div class="actions" style="justify-content:flex-start">
        <button type="button" class="btn soft" @click="actions.errors">Посмотреть ошибки</button>
      </div>
    </section>
    <TeacherStudentMilestones :milestones="model.milestones" />
    <section class="teacher-panel wide">
      <h2>Статистика ответов по школьным заданиям</h2>
      <div class="teacher-kpis">
        <div v-for="{ label, value } in model.responseStats" :key="label" class="teacher-kpi">
          <b>{{ value }}</b><small>{{ label }}</small>
        </div>
      </div>
      <div class="teacher-lock-note">В выборке: {{ model.responseCount }} заданий. Пустой Enter и повторные проверки не считаются отдельными заданиями.</div>
    </section>
    <section class="teacher-panel">
      <h2>🕘 Последние школьные работы</h2>
      <div class="teacher-work-list">
        <div v-for="(work, index) in model.works" :key="index" class="teacher-work-row">
          <div><b>{{ work.title }}</b><small>{{ work.info }}</small></div>
          <span class="teacher-work-score">{{ work.score }}</span>
        </div>
        <div v-if="!model.works.length" class="teacher-empty">В выбранном периоде завершённых попыток нет.</div>
      </div>
    </section>
    <section class="teacher-panel">
      <h2>Последние ошибки школьных тем</h2>
      <div class="teacher-error-list">
        <div v-for="(error, index) in model.recentErrors" :key="index" class="teacher-error-row">
          <b>{{ error.label }} • {{ error.title }}</b><small>{{ error.info }}</small>
        </div>
        <div v-if="!model.recentErrors.length" class="teacher-empty">В выбранном периоде ошибок нет.</div>
      </div>
    </section>
  </div>
  <div class="actions">
    <button type="button" class="btn soft" @click="actions.journal">📋 Журнал</button>
    <button type="button" class="btn soft" @click="actions.topics">🎯 Слабые темы</button>
    <button type="button" class="btn soft" @click="actions.errors">🧠 Ошибки</button>
    <button type="button" class="btn soft" @click="actions.report">📄 Отчёт</button>
    <button type="button" class="btn soft" @click="actions.knowledge">📊 Карта знаний</button>
    <button type="button" class="btn primary" @click="actions.student">Открыть как ученик</button>
  </div>
  <section class="teacher-danger-zone">
    <h3>Опасная зона</h3>
    <p>Удаление полностью уберёт только этого локального ученика. Перед удалением рекомендуется сделать резервную копию.</p>
    <button type="button" class="btn teacher-danger-btn" @click="actions.remove">🗑 Удалить ученика</button>
  </section>
</template>
