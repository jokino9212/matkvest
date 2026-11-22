<script setup>
defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

function submit(event, actions) {
  const input = event.currentTarget.elements.code;
  const code = input.value;
  input.value = '';
  actions.submit(code);
}
</script>

<template>
  <h2 id="devAccessHeading">Код разработчика</h2>
  <form id="devAccessForm" autocomplete="off" @submit.prevent="submit($event, actions)">
    <input id="devAccessInput" name="code" type="password" aria-label="Код разработчика"
      :aria-invalid="Boolean(model.error)" aria-describedby="devAccessError" autocomplete="off" required>
    <div id="devAccessError" class="dev-error" role="alert">{{ model.error }}</div>
    <div class="dev-actions">
      <button id="devAccessCancel" type="button" class="btn soft" @click="actions.close">Отмена</button>
      <button type="submit" class="btn primary">Войти</button>
    </div>
  </form>
</template>
