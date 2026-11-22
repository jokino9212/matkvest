<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mtop">
    <h2 class="mk872-help-heading">🏆 Таблица лидеров
      <button type="button" class="mk872-help-trigger" title="Справка" aria-label="Справка: leader"
        @click="actions.help($event.currentTarget)">ⓘ</button>
    </h2>
    <button type="button" class="x" aria-label="Закрыть окно" @click="actions.close">×</button>
  </div>
  <div style="overflow:auto">
    <table class="leader-table">
      <thead>
        <tr>
          <th scope="col">#</th><th scope="col">Ученик</th><th scope="col">Уровень</th>
          <th scope="col">XP</th><th scope="col">Монеты</th>
          <th scope="col" title="Стоимость принадлежащих вещей по ценам каталога">Коллекция 🪙</th>
          <th scope="col">🔥 рекорд</th><th scope="col">Решено</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in model.rows" :key="row.name" :class="{ 'leader-current': row.current }">
          <td>{{ row.rank }}</td>
          <td>
            <div class="leader-identity">
              <span class="leader-avatar-html" v-html="row.avatar"></span>
              <div>
                <b class="nickname-style" :class="row.nicknameClass" :title="row.name">{{ row.name }}</b>
                <span v-if="row.test" class="mk870-leader-test-badge">Тестовый</span>
                <div v-if="row.title" class="leader-title">{{ row.title }}</div>
                <span style="display:contents" v-html="row.badges"></span>
                <div class="leader-stickers" v-html="row.stickers"></div>
                <div class="leader-mobile-level">ур. {{ row.level }}</div>
              </div>
            </div>
          </td>
          <td>ур. {{ row.level }}<span style="display:contents" v-html="row.progress"></span></td>
          <td>{{ row.xp }}</td>
          <td>{{ row.coins }}</td>
          <td class="mk30-worth" title="Стоимость всех принадлежащих предметов">{{ row.worth }}</td>
          <td>{{ row.bestStreak }}</td>
          <td>{{ row.solved }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
