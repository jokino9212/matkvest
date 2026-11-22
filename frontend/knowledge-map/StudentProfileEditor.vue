<script setup>
import { computed, ref } from 'vue';
import ReportHeader from './ReportHeader.vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

const name = ref(props.model.name);
const style = ref(props.model.style);
const nameClass = computed(() => props.model.styles.find(option => option.id === style.value)?.cls);
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />
  <div class="mk854-edit-preview">
    <div style="display: contents" v-html="model.avatar"></div>
    <div id="mk854EditPreview" class="mk854-edit-preview-name">
      <span class="nickname-style" :class="nameClass">{{ name.trim() || 'Имя' }}</span>
    </div>
  </div>
  <form @submit.prevent="actions.save(name, style)">
    <div class="mk854-edit-field">
      <label for="mk854NicknameInput">Отображаемое имя — 2–24 символа</label>
      <input id="mk854NicknameInput" v-model="name" class="mk854-edit-input" maxlength="24">
    </div>
    <div class="mk854-edit-field">
      <label id="mk854StyleLabel">Оформление имени</label>
      <div id="mk854StyleGrid" class="mk854-style-grid" role="group" aria-labelledby="mk854StyleLabel">
        <button
          v-for="option in model.styles" :key="option.id" :data-style="option.id"
          type="button" class="mk854-style-btn" :class="{ active: style === option.id }"
          :aria-pressed="option.locked ? null : style === option.id"
          @click="option.locked ? actions.shop() : style = option.id"
        >
          <span class="nickname-style" :class="option.cls">{{ option.label }}</span>
          <span v-if="option.premium" class="mk855-lock-note">
            {{ option.locked ? '🔒 Купить в магазине' : '✓ в коллекции' }}
          </span>
        </button>
      </div>
    </div>
    <div id="mk854EditError" class="mk854-edit-error" role="status"></div>
    <div class="mk854-edit-actions">
      <button type="button" class="btn soft" @click="actions.close">Отмена</button>
      <button type="submit" class="btn primary">Сохранить</button>
    </div>
  </form>
</template>
