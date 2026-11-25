<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mk19e-wallet-head">
    <div><span class="mk19e-overline">Доступные монеты</span><div class="mk19e-balance">{{ model.balance }}</div>
      <small>Сумма на счёте прямо сейчас</small></div>
    <span class="mk19e-id">{{ model.profile }}</span>
  </div>
  <template v-if="model.serverReadOnly"><p>Подтверждённый сервером баланс. Сведения о продажах, покупках и возможных возвратах пока не предоставляются сервером.</p></template>
  <template v-else>
  <section>
    <h3 class="mk19e-section-title">Мои покупки и возвраты</h3>
    <div class="mk19e-wallet-grid">
      <div v-for="cell in model.totals" :key="cell.label" class="mk19e-wallet-cell">
        <span class="mk19e-label">{{ cell.label }}</span><strong>{{ cell.value }}</strong><small>{{ cell.detail }}</small>
      </div>
    </div>
  </section>
  <section class="mk19e-potential">
    <div class="mk19e-potential-line"><span>Если продать доступные предметы сейчас</span><b>+{{ model.realizable }}</b></div>
    <p>{{ model.potentialDetails }}</p>
    <div class="mk19e-potential-line" style="margin-top:9px;border-top:1px solid #dce9df;padding-top:10px">
      <span>Баланс + возможные возвраты</span><b>{{ model.potential }}</b>
    </div>
  </section>
  <section>
    <h3 class="mk19e-section-title">Сундуки</h3>
    <div class="mk19e-facts">
      <div v-for="fact in model.chests" :key="fact.label" class="mk19e-fact">{{ fact.label }}<b>{{ fact.value }}</b></div>
    </div>
  </section>
  <section>
    <h3 class="mk19e-section-title">Последние продажи</h3>
    <div v-if="model.sales.length" class="mk19e-transactions">
      <div v-for="(sale, index) in model.sales" :key="index" class="mk19e-transaction">
        <div><div class="mk19e-transaction-name">{{ sale.name }}</div><small>{{ sale.detail }}</small></div>
        <span class="mk19e-transaction-value">+{{ sale.refund }}</span>
      </div>
    </div>
    <div v-else class="mk19e-wallet-cell mk19e-info">Пока нет сохранённых записей о продажах.</div>
  </section>
  <details class="mk19e-info"><summary>Как считаются суммы</summary><p>{{ model.explanation }}</p></details>
  </template>
  <div class="mk19e-shortcuts">
    <button class="btn soft" type="button" @click="actions.shop()">В магазин</button>
    <button class="btn soft" type="button" @click="actions.collection()">Моя коллекция</button>
  </div>
</template>
