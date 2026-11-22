<script setup>
import { computed } from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
});

const progress = computed(() => {
  const level = props.model.progress;
  return {
    current: level.currentLevel,
    next: level.currentLevel + 1,
    xp: Math.floor(level.xpIntoLevel),
    total: level.xpNeededForLevel,
    remaining: Math.ceil(level.xpRemaining),
    percent: level.progressPercent,
  };
});
</script>

<template>
  <div class="profile-preview profile-cosmetic-card" :class="model.backgroundClass">
    <span class="avatar-badge large" :class="[model.avatar.frame, { 'has-raster-avatar': model.avatar.raster }]"
          :data-frame-rarity="model.avatar.rarity" :data-mk-avatar-id="model.avatar.id">
      <span v-if="model.avatar.effectClass !== null" class="avatar-effect-layer" :class="model.avatar.effectClass"></span>
      <span class="avatar-core" v-html="model.avatar.core"></span>
      <span v-if="model.avatar.pet" class="pet-mini" v-html="model.avatar.pet"></span>
    </span>
    <div class="profile-preview-info">
      <b class="nickname-style" :class="model.nameClass" :title="model.name">{{ model.name }}</b>
      <div v-if="model.title" class="profile-title-line">🏷️ {{ model.title }}</div>
      <div v-else class="profile-title-line empty">Без титула</div>
      <small :class="{ 'profile-dark-copy': model.dark }">
        Уровень {{ progress.current }} • собрано {{ model.owned }} предметов<br>
        <b>Рамка:</b> {{ model.frame }} • <b>Питомец:</b> {{ model.pet }} • <b>Фон:</b> {{ model.background }}<br>
        <b>аура:</b> {{ model.effect }}
      </small>
      <div class="mk872-xp-progress" role="progressbar" aria-valuemin="0"
           :aria-valuemax="progress.total" :aria-valuenow="progress.xp"
           :aria-label="`Уровень ${progress.current}: ${progress.xp} из ${progress.total} XP до уровня ${progress.next}; осталось ${progress.remaining} XP`">
        <div class="mk872-xp-head">
          <span>Уровень {{ progress.current }} → {{ progress.next }}</span><span>{{ Math.round(progress.percent) }}%</span>
        </div>
        <div class="mk872-xp-track"><span class="mk872-xp-fill" :style="{ width: progress.percent + '%' }"></span></div>
        <div class="mk872-xp-foot">{{ progress.xp }} / {{ progress.total }} XP · до ур. {{ progress.next }}: {{ progress.remaining }} XP</div>
      </div>
      <span v-if="model.badges.length" class="profile-badges compact">
        <span v-for="badge in model.badges" :key="badge.id" class="profile-badge-chip" :title="badge.name" v-html="badge.icon"></span>
      </span>
      <span v-else class="profile-badge-empty">значки не выбраны</span>
      <div class="profile-sticker-line">
        <b style="font-size:12px">Любимые:</b>
        <span v-if="model.stickers.length" class="favorite-stickers large">
          <span v-for="sticker in model.stickers" :key="sticker.id" class="favorite-sticker" :title="sticker.name" v-html="sticker.icon"></span>
        </span>
        <span v-else class="favorite-empty">стикеры не выбраны</span>
      </div>
    </div>
    <div class="shop-balance">🪙 {{ model.coins }}</div>
  </div>
</template>
