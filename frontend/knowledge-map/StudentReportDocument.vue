<script setup>
import StudentReportKpis from './StudentReportKpis.vue';
import StudentReportRows from './StudentReportRows.vue';

defineProps({ model: { type: Object, required: true } });
</script>

<template>
  <article class="student-report-document">
    <header class="report-head">
      <div>
        <div class="report-brand">МАТКВЕСТ</div>
        <h1>Отчёт об учебном прогрессе</h1>
        <div class="report-head-meta">
          <span class="report-student-name">Ученик: {{ model.name }}</span>
          <span>Период активности: <b data-report-period>{{ model.periodLabel }}</b></span>
          <span>Сформировано: {{ model.generated }}</span>
        </div>
      </div>
      <div class="report-current-badge">Текущее состояние + активность за период</div>
    </header>

    <section class="report-section">
      <h2>Общая сводка</h2>
      <div class="report-summary-grid"><StudentReportKpis :items="model.summary" /></div>
      <h3>Активность за период</h3>
      <div class="report-summary-grid"><StudentReportKpis :items="model.activity" /></div>
      <div class="report-period-note">{{ model.periodNote }}</div>
    </section>

    <section v-if="model.analytics" class="report-section">
      <h2>🧭 Аналитика ученика</h2>
      <div class="report-summary-grid"><StudentReportKpis :items="model.analytics.stats" /></div>
      <div class="report-analytics-grid" style="margin-top:10px">
        <div v-for="box in model.analytics.boxes" :key="box.title" class="report-analytics-box" :class="{ wide: box.wide }">
          <h3>{{ box.title }}</h3>
          <template v-if="box.groups?.length">
            <div v-for="group in box.groups" :key="group.title" class="student-report-fact-group">
              <b v-if="group.title">{{ group.title }}</b>
              <div class="report-fact-line"><span v-for="fact in group.facts" :key="fact">{{ fact }}</span></div>
            </div>
          </template>
          <StudentReportRows v-else :rows="box.rows" :empty="box.empty" />
        </div>
      </div>
    </section>

    <section v-if="model.plan" class="report-section">
      <h2>🧩 Текущий план тренировки</h2>
      <StudentReportKpis :items="model.plan.stats" />
      <div class="report-plan-compact" style="margin-top:8px">
        <div v-for="row in model.plan.rows" :key="row.id" class="report-plan-row"><span>{{ row.label }}</span><b>{{ row.status }}</b></div>
        <div v-if="!model.plan.rows.length" class="report-empty">План пока пуст.</div>
      </div>
    </section>

    <section class="report-section" data-report-section="courses">
      <h2>📚 Прогресс курса</h2>
      <div class="report-two-col">
        <div v-for="course in model.courses" :key="course.grade" class="report-course-card" :data-report-course="course.grade">
          <div class="report-course-head">
            <b><span aria-hidden="true" style="display:contents" v-html="course.icon"></span> {{ course.grade }} класс</b>
            <strong>{{ course.status }}</strong>
          </div>
          <template v-if="!course.catalogOnly">
            <div class="report-progress"><span :style="{ width: course.percent + '%' }"></span></div>
            <div class="report-stage-line"><span v-for="stage in course.stages" :key="stage">{{ stage }}</span></div>
            <div style="margin-top:7px">
              <div v-for="section in course.sections" :key="section.title" class="report-section-line">
                <span>{{ section.title }}</span><b>{{ section.value }}</b>
              </div>
              <div v-if="course.note" class="report-period-note">{{ course.note }}</div>
            </div>
          </template>
          <div v-else class="report-empty">{{ course.note }}</div>
        </div>
      </div>
    </section>

    <section class="report-section" data-report-section="knowledge">
      <h2>📊 Карта знаний</h2>
      <div v-for="grade in model.knowledge" :key="grade.grade" class="student-report-knowledge-grade" :data-report-knowledge="grade.grade">
        <template v-if="grade.started">
          <div class="report-grade-title">
            <h3><span aria-hidden="true" style="display:contents" v-html="grade.icon"></span> {{ grade.grade }} класс</h3>
            <span class="report-not-started">{{ grade.caption }}</span>
          </div>
          <div class="report-knowledge-grid">
            <div v-for="topic in grade.topics" :key="topic.id" class="report-topic-chip" :class="topic.tone">
              <b>{{ topic.title }}</b><small>{{ topic.description }}</small>
            </div>
          </div>
        </template>
        <div v-else class="report-empty">{{ grade.empty }}</div>
      </div>
    </section>

    <section class="report-section">
      <div class="report-two-col">
        <div><h2>🎯 Что стоит повторить</h2><StudentReportRows :rows="model.weak" empty="✅ Сейчас выраженных слабых тем нет." /></div>
        <div><h2>✅ Хорошо освоено</h2><StudentReportRows :rows="model.strong" empty="Пока недостаточно данных, чтобы выделить уверенно освоенные темы." /></div>
      </div>
    </section>
    <section class="report-section">
      <h2>🧠 Работа над ошибками</h2>
      <div class="report-summary-grid"><StudentReportKpis :items="model.errors.stats" /></div>
      <template v-if="model.errors.active.length">
        <h3>Активные по темам</h3><StudentReportRows :rows="model.errors.active" />
      </template>
      <h3>Последние ошибки за период</h3>
      <StudentReportRows :rows="model.errors.recent" empty="В выбранном периоде значимых ошибок нет." />
    </section>
    <section v-for="section in model.lists" :key="section.id" class="report-section" :data-report-section="section.id">
      <h2>{{ section.title }}</h2>
      <div v-if="section.stats?.length" class="report-summary-grid" style="margin-bottom:8px">
        <StudentReportKpis :items="section.stats" />
      </div>
      <StudentReportRows :rows="section.rows" :empty="section.empty" />
    </section>
    <section class="report-section">
      <h2>📝 Итог</h2>
      <div class="report-note">{{ model.conclusion }}</div>
      <div class="report-two-col" style="margin-top:10px"><StudentReportKpis :items="model.totals" /></div>
    </section>
    <footer class="report-print-foot">Отчёт сформирован локально из сохранённых данных профиля.</footer>
  </article>
</template>
