<script setup>
import ReportHeader from './ReportHeader.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="block-result">
    <div class="block-stars">{{ '★'.repeat(model.stars) }}{{ '☆'.repeat(3 - model.stars) }}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:2px">3 ★ — без ошибок · 2 ★ — от 80% · 1 ★ — от 60%</div>
    <h3>Верно с первой: {{ model.correct }} из {{ model.total }}</h3>
    <div class="level-box" style="margin:8px 0 12px">
      <b>✅ С первой:</b> {{ model.firstTry }} • <b>🟡 Исправлено:</b> {{ model.corrected }} •
      <b>❌ Осталось неверно:</b> {{ model.wrong }} • <b>⏭ Пропущено:</b> {{ model.skipped }}
    </div>
    <p>{{ model.message }}</p>
    <div style="font-size:12px;color:var(--muted);margin:-4px 0 10px">
      Пропуск занимает одно задание в блоке. В журнале пропуски и ошибки отмечены отдельно.
    </div>
    <div v-if="model.bonusXP" class="level-box">
      <b>Бонус за первое прохождение:</b> +{{ model.bonusXP }} XP и +{{ model.bonusCoins }} 🪙
    </div>
    <div class="actions">
      <button type="button" class="btn soft" @click="actions.review()">📋 Разбор попытки</button>
      <button type="button" class="btn soft" @click="actions.repeat()">Повторить блок</button>
      <button v-if="actions.next" type="button" class="btn primary next-ready" @click="actions.next()">Следующая ступень →</button>
      <button type="button" class="btn soft" @click="actions.close()">К темам</button>
    </div>
  </div>
</template>
