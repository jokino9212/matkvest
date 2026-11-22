<script setup>
defineProps({ course: { type: Object, required: true } });
</script>

<template>
  <div :data-teacher-course-grade="course.grade">
    <h3><span aria-hidden="true" style="display:contents" v-html="course.icon"></span> {{ course.grade }} класс</h3>
    <div v-if="course.catalog" class="teacher-empty">
      <b>Каталог подготовлен — темы добавляются поэтапно.</b><br>
      {{ course.catalog }}
    </div>
    <template v-else>
      <div class="teacher-section-row">
        <span>Пройдено курса</span><b data-teacher-course-status>{{ course.status }}</b>
      </div>
      <div class="teacher-progress-track" role="progressbar" :aria-label="'Прогресс ' + course.grade + '-го класса'"
        aria-valuemin="0" aria-valuemax="100" :aria-valuenow="course.percent">
        <span :style="{ width: course.percent + '%' }"></span>
      </div>
      <div class="teacher-card-metrics" style="margin-top:9px">
        <span v-for="stage in course.stages" :key="stage.label">{{ stage.label }}: {{ stage.value }}</span>
      </div>
      <div v-if="course.sections.length || course.note" class="teacher-course-box" style="margin-top:10px">
        <template v-for="section in course.sections" :key="section.title">
          <div class="teacher-section-row">
            <span>{{ section.title }} <small v-if="section.availability" style="color:var(--muted)">{{ section.availability }}</small></span>
            <b>{{ section.status }}</b>
          </div>
          <div v-if="section.percent !== null" class="teacher-progress-track">
            <span :style="{ width: section.percent + '%' }"></span>
          </div>
        </template>
        <div v-if="course.note" class="teacher-lock-note">{{ course.note }}</div>
      </div>
    </template>
  </div>
</template>
