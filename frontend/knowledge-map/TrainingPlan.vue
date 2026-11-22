<script setup>
defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
</script>

<template>
  <div class="training-plan-screen">
    <div class="home-back-row"><button type="button" class="home-back-btn" @click="actions.back()">{{ model.backLabel }}</button></div>
    <section class="training-plan-hero">
      <div class="training-plan-head">
        <div><h1>{{ model.title }}</h1><p>{{ model.description }}</p></div>
        <span class="training-plan-status" :class="{ done: model.done }">{{ model.status }}</span>
      </div>
      <div v-if="model.progress.total" class="training-plan-progress">
        <div class="training-plan-track" role="progressbar" aria-label="Выполнено блоков плана" aria-valuemin="0" :aria-valuemax="model.progress.total" :aria-valuenow="model.progress.done">
          <span :style="{ width: model.progress.pct + '%' }"></span>
        </div>
        <div class="training-plan-count">{{ model.progress.done }}/{{ model.progress.total }}</div>
      </div>
    </section>
    <div v-if="model.items.length" class="training-plan-list">
      <div v-for="item in model.items" :key="item.id" class="training-plan-item" :class="{ done: item.done, current: item.current }">
        <div class="training-plan-index">{{ item.done ? '✓' : item.number }}</div>
        <div>
          <h3>{{ item.title }}</h3>
          <p><b v-if="model.editor">Почему стоит повторить: </b>{{ item.reason }}</p>
          <div class="training-plan-item-meta">
            <span class="training-plan-chip">{{ item.type }}</span>
            <span v-if="item.status" class="training-plan-chip">{{ item.status }}</span>
          </div>
        </div>
        <div class="training-plan-actions">
          <button v-for="button in item.buttons" :key="button.key" type="button" :class="button.className" :disabled="button.disabled" @click="actions[button.key](item.id)">{{ button.label }}</button>
        </div>
      </div>
    </div>
    <div v-else class="training-plan-empty">{{ model.empty }}</div>
    <div v-if="model.buttons.length" class="training-plan-editor-actions">
      <button v-for="button in model.buttons" :key="button.key" type="button" :class="button.className" @click="actions[button.key]()">{{ button.label }}</button>
    </div>
    <div v-if="model.note" class="training-plan-note">{{ model.note }}</div>
  </div>
</template>
