<script setup>
import ReportHeader from './ReportHeader.vue';
import ProfilePreview from './ProfilePreview.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
</script>

<template>
  <div class="mk871-profiles-screen">
    <ReportHeader :title="model.title" @close="actions.close" />
    <ProfilePreview :model="model.preview" />
    <div class="actions">
      <button type="button" class="btn primary" @click="actions.shop">🛍️ Магазин</button>
      <button type="button" class="btn soft" @click="actions.collection">🎒 Моя коллекция</button>
      <button type="button" class="btn soft mk854-edit-name-btn" @click="actions.edit">✏️ Изменить имя</button>
    </div>
    <div class="profile-list">
      <div v-for="profile in model.profiles" :key="profile.name" class="profile-row" :class="{ current: profile.active }">
        <div class="profile-row-main">
          <div class="profile-row-avatar" style="display: contents" v-html="profile.avatar"></div>
          <div>
            <b class="nickname-style" :class="profile.nameClass" :title="profile.name">{{ profile.name }}</b>
            <div v-if="profile.title" class="leader-title">{{ profile.title }}</div>
            <div class="profile-info">
              <span>ур. {{ profile.level }}</span><span>{{ profile.xp }} XP</span><span>🪙 {{ profile.coins }}</span>
              <span>🔥 рекорд {{ profile.bestStreak }}</span><span>🎒 {{ profile.items }}</span>
            </div>
            <div style="display: contents" v-html="profile.details"></div>
            <div class="profile-sticker-line" v-html="profile.stickers"></div>
          </div>
        </div>
        <button type="button" class="btn soft" @click="actions.select(profile.index)">
          {{ profile.active ? 'Текущий' : 'Выбрать' }}
        </button>
      </div>
    </div>
    <form class="profile-create" @submit.prevent="actions.create">
      <input id="newProfileName" maxlength="24" placeholder="Имя ученика" aria-label="Имя ученика">
      <button type="submit" class="btn primary">Создать</button>
    </form>
  </div>
</template>
