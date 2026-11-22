<script setup>
defineProps({ milestones: { type: Object, required: true } });
</script>

<template>
  <section class="teacher-panel" data-teacher-milestone="control">
    <h2>🔁 Контрольные повторения</h2>
    <template v-if="milestones.control">
      <div class="teacher-section-row"><span>Последнее</span><b>{{ milestones.control.score }}</b></div>
      <div class="teacher-lock-note">{{ milestones.control.detail }}</div>
    </template>
    <div v-else class="teacher-empty">Контрольных повторений пока нет.</div>
    <div class="teacher-lock-note">Запуск доступен из профиля ученика.</div>
  </section>
  <section class="teacher-panel" data-teacher-milestone="achievements">
    <h2>🏆 Достижения</h2>
    <div class="teacher-kpis">
      <div v-for="stat in milestones.achievements.stats" :key="stat.label" class="teacher-kpi">
        <b>{{ stat.value }}</b><small>{{ stat.label }}</small>
      </div>
    </div>
    <div class="teacher-work-list" style="margin-top:9px">
      <div v-for="item in milestones.achievements.latest" :key="item.id" class="teacher-work-row">
        <div><b>{{ item.title }}</b><small>{{ item.date }}</small></div>
        <span class="achievement-rarity" :class="item.rarity">{{ item.rarityLabel }}</span>
      </div>
      <div v-if="!milestones.achievements.latest.length" class="teacher-empty">Пока достижений нет.</div>
    </div>
  </section>
  <section class="teacher-panel" data-teacher-milestone="quests">
    <h2>🔥 Квесты</h2>
    <div class="teacher-kpis">
      <div v-for="stat in milestones.quests" :key="stat.label" class="teacher-kpi">
        <b>{{ stat.value }}</b><small>{{ stat.label }}</small>
      </div>
    </div>
  </section>
</template>
