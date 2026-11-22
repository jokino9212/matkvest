<script setup>
import { onMounted, useTemplateRef } from 'vue';
import ReportHeader from './ReportHeader.vue';

const props = defineProps({ model: Object, actions: Object });
const initialInput = useTemplateRef('initialInput');
const confirmInput = useTemplateRef('confirmInput');

onMounted(() => {
  if (props.model.mode !== 'reset') initialInput.value?.focus();
});
</script>

<template>
  <div class="teacher-pin-wrap">
    <div class="teacher-pin-card">
      <ReportHeader :title="model.title" @close="actions.close" />
      <form @submit.prevent="actions.submit">
        <template v-if="model.mode === 'setup'">
          <p><b>Создайте локальный PIN преподавателя</b> из 4–6 цифр.</p>
          <div class="teacher-lock-note">PIN защищает вход в кабинет на этом устройстве и хранится в браузере.</div>
          <input id="teacherPinNew" ref="initialInput" type="password" inputmode="numeric" maxlength="6"
            autocomplete="new-password" class="teacher-pin-input" aria-label="Новый PIN" placeholder="••••"
            @keydown.enter.prevent="confirmInput?.focus()">
          <input id="teacherPinConfirm" ref="confirmInput" type="password" inputmode="numeric" maxlength="6"
            autocomplete="new-password" class="teacher-pin-input" aria-label="Повторите PIN" placeholder="Повторите PIN">
        </template>
        <template v-else-if="model.mode === 'login'">
          <p>Введите локальный PIN преподавателя.</p>
          <input id="teacherPinLogin" ref="initialInput" type="password" inputmode="numeric" maxlength="6"
            autocomplete="current-password" class="teacher-pin-input" aria-label="PIN преподавателя" placeholder="••••">
        </template>
        <template v-else>
          <div class="teacher-danger">
            <b>При сбросе PIN сохранятся ученики и учебные данные.</b><br>
            Профили, прогресс, журнал, магазин и резервные данные сохранятся.
          </div>
          <p>Для подтверждения введите слово <b>СБРОСИТЬ</b>.</p>
          <input id="teacherResetWord" class="teacher-search" autocomplete="off"
            aria-label="Подтверждение сброса PIN" placeholder="СБРОСИТЬ">
        </template>
        <div id="teacherPinError" class="teacher-pin-error" role="alert"></div>
        <div class="actions">
          <button type="submit" class="btn primary">{{ model.submit }}</button>
          <button type="button" class="btn soft" @click="actions.secondary">{{ model.secondary }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
