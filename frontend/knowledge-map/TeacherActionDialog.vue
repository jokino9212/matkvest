<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import ReportHeader from './ReportHeader.vue';

const props = defineProps({ model: { type: Object, required: true }, actions: { type: Object, required: true } });
const nameInput = useTemplateRef('nameInput');
const entered = ref(props.model.entered || '');
const error = ref(props.model.error || '');
const validName = computed(() => entered.value.trim() === props.model.name);

onMounted(() => nameInput.value?.focus({ preventScroll: true }));

function submitName() {
  if (!validName.value) {
    error.value = 'Введённое имя не совпадает с именем ученика.';
    return;
  }
  props.actions.confirm(entered.value);
}
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <form v-if="model.kind === 'name'" @submit.prevent="submitName">
    <div class="teacher-danger">
      <label for="teacherDeleteName"><b>Введите имя ученика, как показано ниже</b></label>
      <div class="teacher-delete-name">{{ model.name }}</div>
      <input id="teacherDeleteName" ref="nameInput" v-model="entered" class="teacher-delete-input"
        autocomplete="off" :aria-invalid="error ? 'true' : null" aria-describedby="teacherDeleteError"
        @input="error = ''" @keydown.enter.prevent="submitName">
      <div id="teacherDeleteError" class="teacher-pin-error" role="alert">{{ error }}</div>
    </div>
    <div class="actions">
      <button type="button" class="btn soft" @click="actions.close">Отмена</button>
      <button id="teacherDeleteFinalBtn" type="submit" class="btn teacher-danger-btn" :disabled="!validName">Удалить окончательно</button>
    </div>
  </form>
  <template v-else>
    <div v-if="model.kind === 'profile'" class="teacher-danger">
      <div class="teacher-delete-name">{{ model.name }}</div>
      <p>Будут окончательно удалены локальные данные этого ученика, включая прогресс, журнал, ошибки, XP, монеты, достижения и настройки профиля.</p>
      <p>Локальный PIN, настройки преподавателя и профили других учеников сохранятся.</p>
    </div>
    <div v-else-if="model.kind === 'plan'" class="lesson">
      В плане ученика <b>{{ model.name }}</b> есть выполненные пункты. Учебные результаты, награды и история сохранятся после удаления плана.
    </div>
    <div v-else class="lesson">
      МатКвест переключит активный профиль на <b>{{ model.name }}</b>, закроет режим преподавателя и откроет
      {{ model.destination || (model.kind === 'quick' ? 'тренажёр' : 'тему') }}
      <b>«{{ model.target }}»</b><template v-if="model.mode"> в режиме «{{ model.mode }}»</template>.
    </div>
    <div class="actions">
      <button v-if="model.kind === 'profile'" type="button" class="btn soft" @click="actions.backup">💾 Сделать резервную копию</button>
      <button type="button" class="btn soft" @click="actions.close">Отмена</button>
      <button type="button" class="btn" :class="model.kind === 'profile' || model.kind === 'plan' ? 'teacher-danger-btn' : 'primary'"
        @click="actions.confirm()">{{ model.confirmLabel }}</button>
    </div>
  </template>
</template>
