<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="mk870-top">
    <h2 id="mk870PanelTitle">Панель разработчика</h2>
    <button type="button" class="btn soft" data-dev-action="close" @click="actions.close">Закрыть</button>
  </div>
  <template v-if="model.confirmation">
    <div class="mk870-status">
      <h3>{{ model.confirmation.title }}</h3>
      <p>{{ model.confirmation.description }}</p>
    </div>
    <div class="mk870-actions">
      <button type="button" class="btn soft" data-dev-action="cancel" @click="actions.cancel">Отмена</button>
      <button type="button" class="btn primary" data-dev-action="confirm" @click="actions.confirm">{{ model.confirmation.label }}</button>
    </div>
  </template>
  <template v-else>
    <div class="mk870-field">
      <label for="mk870Select">Профиль:</label>
      <select id="mk870Select" :value="model.name" @change="actions.select($event.target.value)">
        <option v-for="profile in model.profiles" :key="profile.name" :value="profile.name">{{ profile.label }}</option>
      </select>
      <button type="button" class="btn soft" data-dev-action="create" @click="actions.run('create')">Создать тестового ученика</button>
    </div>
    <div class="mk870-status">
      <b>{{ model.name }}</b> • {{ model.test ? 'TEST' : 'Обычный' }}
      <div>Монеты: <b>{{ model.coins }}</b> • XP: <b>{{ model.xp }}</b> • уровень: <b>{{ model.level }}</b></div>
      <div>Предметов: <b>{{ model.items }}</b> • выбранный герой: <b>{{ model.avatar }}</b></div>
    </div>
    <div v-if="!model.test" class="mk870-group">Изменение монет, опыта и предметов доступно только тестовым ученикам.</div>
    <section v-for="group in model.groups" :key="group.title" class="mk870-group">
      <h3>{{ group.title }}</h3>
      <template v-for="(row, index) in group.rows" :key="index">
        <form v-if="row.field" class="mk870-field" novalidate @submit.prevent="actions.run(row.field.action, $event.target.elements.amount.value)">
          <input :id="row.field.id" name="amount" type="number" step="1" min="0" :aria-label="row.field.label" :placeholder="row.field.label">
          <button type="submit" class="btn soft" :data-dev-action="row.field.action">{{ row.field.button }}</button>
        </form>
        <div v-else class="mk870-actions">
          <button v-for="button in row.buttons" :key="button.action" type="button" class="btn soft"
            :data-dev-action="button.action" @click="actions.run(button.action)">{{ button.label }}</button>
        </div>
      </template>
      <small v-if="group.note">{{ group.note }}</small>
    </section>
    <section id="mk872LegacyPanel" class="mk872-legacy-info">
      <b>Старые предметы</b>
      <div>Архивных аватаров во владении: {{ model.archive }}</div>
      <small>История старых аватаров доступна в «Моей коллекции».</small>
      <button type="button" class="btn soft" data-dev-action="archive" @click="actions.run('archive')">Открыть архив</button>
    </section>
  </template>
  <div id="mk870PanelError" class="mk870-error" role="status">{{ model.status }}</div>
</template>
