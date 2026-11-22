<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mk865-sale-head">
    <div><h2 id="mk865SaleTitle">{{ model.title }}</h2><p v-if="model.subtitle">{{ model.subtitle }}</p></div>
    <button type="button" class="mk865-sale-close" aria-label="Закрыть окно продажи" @click="actions.close()">×</button>
  </div>
  <div v-if="model.mission" class="mk865-mission-box" :class="{ completed: model.mission.completed }">
    <b>{{ model.mission.title }}</b>
    <div style="margin-top:4px">{{ model.mission.topic }}</div>
    <div class="mk865-mission-progress" role="progressbar" aria-label="Выполнено заданий для выгодной продажи"
      :aria-valuenow="model.mission.progress" :aria-valuemax="model.mission.total">
      <span :style="{ width: model.mission.percent + '%' }"></span>
    </div>
    <small>{{ model.mission.progress }}/{{ model.mission.total }} правильных заданий • возврат {{ model.mission.refund }} 🪙</small>
  </div>
  <div v-if="model.refunds" class="mk865-refund-grid">
    <div v-for="option in model.refunds" :key="option.label" class="mk865-refund-card" :class="{ good: option.good }">
      <small>{{ option.label }}</small><b>+{{ option.coins }} 🪙</b><small>{{ option.detail }}</small>
    </div>
  </div>
  <div v-if="model.notice" class="lesson">{{ model.notice }}</div>
  <div v-if="model.topics?.length" class="mk865-topic-grid">
    <button v-for="(topic, index) in model.topics" :key="topic.key" type="button" class="mk865-topic"
      @click="actions.choose(index)">
      <b>{{ topic.grade }} класс • {{ topic.title }}</b><small>{{ topic.detail }}</small>
      <span class="mk865-reason">{{ topic.reason }}</span>
    </button>
  </div>
  <div v-for="(row, index) in model.buttons" :key="index" class="mk865-inline-actions">
    <button v-for="(button, column) in row" :key="column" type="button" class="btn"
      :class="button.primary ? 'primary' : 'soft'" :disabled="button.disabled"
      @click="actions.run(index, column)">{{ button.label }}</button>
  </div>
</template>
