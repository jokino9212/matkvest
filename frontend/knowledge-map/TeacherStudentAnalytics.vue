<script setup>
defineProps({
  analytics: { type: Object, required: true },
  plan: { type: Object, required: true },
  run: { type: Function, required: true },
});
</script>

<template>
  <section class="training-plan-card" aria-labelledby="teacher-training-plan-title">
    <div class="training-plan-head">
      <div>
        <h2 id="teacher-training-plan-title">🧩 План тренировки</h2>
        <p>{{ plan.description }}</p>
      </div>
      <span v-if="plan.status" class="training-plan-status" :class="{ done: plan.done }">{{ plan.status }}</span>
    </div>
    <div v-if="plan.progress.total" class="training-plan-progress" role="progressbar"
      aria-label="Выполнено блоков плана" :aria-valuemin="0" :aria-valuenow="plan.progress.done"
      :aria-valuemax="plan.progress.total">
      <div class="training-plan-track"><span :style="{ width: plan.progress.pct + '%' }"></span></div>
      <div class="training-plan-count">{{ plan.progress.done }}/{{ plan.progress.total }}</div>
    </div>
    <div v-else-if="plan.status" class="training-plan-empty">Пока недостаточно данных для подбора блоков.</div>
    <div class="training-plan-editor-actions">
      <button v-for="(action, index) in plan.actions" :key="action.type" type="button"
        class="btn" :class="index === 0 ? 'primary' : 'soft'" @click="run(action)">{{ action.label }}</button>
    </div>
  </section>

  <div class="teacher-analytics-grid">
    <section class="teacher-analytics-card wide">
      <h2>Сейчас</h2>
      <div class="teacher-analytics-kpis">
        <div v-for="stat in analytics.stats" :key="stat.id" class="teacher-analytics-kpi" :data-teacher-analytics-stat="stat.id">
          <b>{{ stat.value }}</b><small>{{ stat.label }}</small>
        </div>
      </div>
    </section>

    <section v-for="section in analytics.sections" :key="section.id" class="teacher-analytics-card"
      :data-teacher-analytics-section="section.id">
      <h2>{{ section.title }}</h2>
      <div v-if="section.entries.length" class="teacher-analytics-list">
        <div v-for="entry in section.entries" :key="entry.id"
          :class="[entry.facts ? 'teacher-analytics-group' : 'teacher-analytics-row', entry.tone]">
          <div v-if="!entry.facts">
            <b>{{ entry.title }}</b><small v-if="entry.description">{{ entry.description }}</small>
          </div>
          <template v-else>
            <b>{{ entry.title }}</b><small v-if="entry.description">{{ entry.description }}</small>
            <div class="teacher-analytics-facts">
              <span v-for="fact in entry.facts" :key="fact.id" class="teacher-analytics-fact" :title="fact.hint">{{ fact.label }}</span>
            </div>
            <small v-if="entry.note">{{ entry.note }}</small>
          </template>
          <span v-if="entry.badge" class="teacher-analytics-badge">{{ entry.badge }}</span>
          <div v-if="entry.facts && entry.actions?.length" class="teacher-analytics-actions">
            <button v-for="action in entry.actions" :key="action.mode" type="button" class="btn soft"
              @click="run(action)">{{ action.label }}</button>
          </div>
          <button v-if="entry.action" type="button" class="btn soft" @click="run(entry.action)">{{ entry.action.label }}</button>
        </div>
      </div>
      <div v-else class="teacher-analytics-empty">{{ section.empty }}</div>
    </section>

    <section class="teacher-analytics-card wide">
      <h2>🕘 Последние тренировки</h2>
      <div v-if="analytics.training.length" class="teacher-training-list">
        <div v-for="(training, index) in analytics.training" :key="index" class="teacher-training-row">
          <div>{{ training.date }}</div>
          <div><b>{{ training.title }}</b><small>{{ training.description }}</small></div>
          <div class="teacher-training-score">{{ training.score }}</div>
        </div>
      </div>
      <div v-else class="teacher-analytics-empty">Здесь появятся результаты реальных быстрых тренировок.</div>
    </section>

    <section class="teacher-analytics-card wide" data-teacher-analytics-section="recommendations">
      <h2>💡 Что сделать на следующем занятии</h2>
      <div v-if="analytics.recommendations.length" class="teacher-analytics-list">
        <div v-for="(entry, index) in analytics.recommendations" :key="index" class="teacher-recommendation">
          <div class="teacher-recommendation-index">{{ index + 1 }}</div>
          <div><b>{{ entry.title }}</b><small>{{ entry.reason }}</small></div>
          <button type="button" class="btn soft" @click="run(entry.action)">{{ entry.action.label }}</button>
        </div>
      </div>
      <div v-else class="teacher-analytics-empty">{{ analytics.recommendationEmpty }}</div>
    </section>
  </div>
</template>
