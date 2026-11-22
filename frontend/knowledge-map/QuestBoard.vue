<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="quest-screen">
    <div class="home-back-row">
      <button type="button" class="home-back-btn" @click="actions.back">← Главный экран</button>
    </div>
    <section class="quest-hero">
      <h1>🔥 Квесты</h1>
      <p>Прогресс квеста считается с момента его выдачи.</p>
    </section>
    <div class="quest-board-summary">
      <div v-for="stat in model.stats" :key="stat.label"><b>{{ stat.value }}</b><small>{{ stat.label }}</small></div>
    </div>
    <div class="quest-grid">
      <section v-for="card in model.cards" :key="card.id" class="quest-card" :class="{ completed: card.ready }"
        :data-quest-id="card.id">
        <div class="quest-card-head">
          <div class="quest-icon" aria-hidden="true">{{ card.icon }}</div>
          <div>
            <h3>{{ card.title }}</h3>
            <div class="quest-meta">
              <span class="quest-pill">{{ card.category }}</span>
              <span class="quest-pill" :class="card.difficulty">{{ card.difficultyLabel }}</span>
            </div>
          </div>
        </div>
        <div class="quest-desc">{{ card.desc }}</div>
        <div class="quest-progress-line"><span>{{ card.ready ? 'Готово' : 'Прогресс' }}</span><b>{{ card.progressLabel }}</b></div>
        <div class="quest-progress-track" role="progressbar" :aria-label="card.title"
          aria-valuemin="0" :aria-valuemax="card.target" :aria-valuenow="card.progress" :aria-valuetext="card.progressLabel">
          <span :style="{ width: card.percent + '%' }"></span>
        </div>
        <div class="quest-reward">Награда: {{ card.reward }}</div>
        <div v-if="card.ready" class="quest-ready">🎁 Цель выполнена — забери награду</div>
        <div class="quest-actions">
          <button v-if="card.ready" type="button" class="btn primary" @click="actions.claim(card.id)">🎁 Получить награду</button>
          <button v-else type="button" class="btn soft" :disabled="model.rerollUsed"
            @click="actions.replace(card.id)">🔄 Заменить</button>
        </div>
      </section>
      <div v-if="!model.cards.length" class="quest-empty">Подходящие квесты пока не найдены.</div>
    </div>
    <div class="quest-note">{{ model.rerollNote }}</div>
    <details class="quest-history">
      <summary>История выполненных квестов</summary>
      <div v-if="model.history.length" class="quest-history-list">
        <div v-for="entry in model.history" :key="entry.id" class="quest-history-row">
          <div><b>✅ {{ entry.title }}</b><small>{{ entry.date }}</small></div><span>{{ entry.reward }}</span>
        </div>
      </div>
      <div v-else class="quest-empty">История появится после получения первой награды.</div>
    </details>
  </div>
</template>
