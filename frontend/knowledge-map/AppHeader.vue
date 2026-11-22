<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});
const destinations = [
  { action: 'shop', label: 'Магазин', icon: 'shop' },
  { action: 'data', label: 'Данные', icon: 'data' },
  { action: 'journal', label: 'Журнал', icon: 'journal', pill: 'report' },
  { action: 'leaders', label: 'Лидеры', icon: 'trophy', pill: 'leader' },
];
const header = ref(null);
const toggle = ref(null);
const compact = window.matchMedia('(max-width: 1120px)');
const menuOpen = ref(compact.matches && Boolean(props.model.menuOpen));
const xp = computed(() => props.model.progress);
const done = computed(() => Math.floor(xp.value.xpIntoLevel));
const remaining = computed(() => Math.ceil(xp.value.xpRemaining));
const nextLevel = computed(() => xp.value.currentLevel + 1);
const xpLabel = computed(() =>
  `Уровень ${xp.value.currentLevel}: ${done.value} из ${xp.value.xpNeededForLevel} XP до уровня ${nextLevel.value}, осталось ${remaining.value} XP`
);

function closeMenu(restoreFocus = false) {
  if (!menuOpen.value) return;
  menuOpen.value = false;
  if (restoreFocus) toggle.value?.focus({ preventScroll: true });
}
function run(action, fromMenu = false) {
  closeMenu(fromMenu);
  props.actions[action]();
}
function onOutside(event) {
  if (!header.value?.contains(event.target)) closeMenu();
}
function onEscape(event) {
  if (event.key !== 'Escape' || !menuOpen.value) return;
  event.preventDefault();
  closeMenu(true);
}
function onResize(event) {
  if (!event.matches) closeMenu();
}
function onRouteChange() {
  closeMenu();
}

onMounted(() => {
  document.addEventListener('click', onOutside);
  document.addEventListener('focusin', onOutside);
  document.addEventListener('keydown', onEscape);
  compact.addEventListener('change', onResize);
  window.addEventListener('popstate', onRouteChange);
});
onUnmounted(() => {
  document.removeEventListener('click', onOutside);
  document.removeEventListener('focusin', onOutside);
  document.removeEventListener('keydown', onEscape);
  compact.removeEventListener('change', onResize);
  window.removeEventListener('popstate', onRouteChange);
});
</script>

<template>
  <header ref="header" class="top">
    <button
      type="button" class="brand mk872-brand-home" data-header-action="home"
      aria-label="МатКвест — на главную" title="На главную" @click="run('home')"
    ><span id="brandLogo" class="logo">M</span><span id="brandTitle">МатКвест</span></button>
    <div class="stats" :data-mk-ui19-menu="menuOpen ? 'open' : 'closed'">
      <button type="button" class="pill profile-pill" data-header-action="profile" @click="run('profile')">
        <span id="playerAvatar" aria-hidden="true" v-html="model.avatar"></span>
        <span id="playerName" class="nickname-style" :class="model.nameClass" :title="model.name">{{ model.name }}</span>
      </button>
      <div
        id="mk872TopLevelProgress" class="mk872-xp-progress compact mk872-top-progress"
        role="progressbar" :aria-label="xpLabel" aria-valuemin="0"
        :aria-valuemax="xp.xpNeededForLevel" :aria-valuenow="done"
      >
        <div class="mk872-xp-head"><span>Уровень <span id="level">{{ xp.currentLevel }}</span> → {{ nextLevel }}</span><span>{{ Math.round(xp.progressPercent) }}%</span></div>
        <div class="mk872-xp-track"><span class="mk872-xp-fill" :style="{ width: xp.progressPercent + '%' }"></span></div>
        <div class="mk872-xp-foot">{{ done }} / {{ xp.xpNeededForLevel }} XP · до ур. {{ nextLevel }}: {{ remaining }} XP</div>
      </div>
      <button
        type="button" class="pill mk19e-coin-shortcut" data-header-action="wallet"
        aria-label="Открыть кошелёк и посмотреть монеты" title="Открыть кошелёк" @click="run('wallet')"
      ><span class="ui-glyph ui-coin" aria-hidden="true"></span> <span id="coins">{{ model.coins }}</span></button>
      <button
        ref="toggle" type="button" class="mk-ui19-nav-toggle" data-header-action="menu"
        aria-controls="mk-ui19-navigation" :aria-expanded="menuOpen"
        :aria-label="menuOpen ? 'Закрыть меню разделов' : 'Открыть меню разделов'" @click="menuOpen = !menuOpen"
      ><span class="mk-ui19-hamburger" aria-hidden="true"><i></i><i></i><i></i></span><span>Меню</span></button>
      <nav id="mk-ui19-navigation" class="mk-ui19-nav-wrap" aria-label="Разделы МатКвеста">
        <button
          v-for="destination in destinations" :key="destination.action" type="button" class="pill"
          :class="(destination.pill || destination.action) + '-pill'" :data-header-action="destination.action"
          @click="run(destination.action, true)"
        ><span :class="['ui-glyph', 'ui-' + destination.icon]" aria-hidden="true"></span> {{ destination.label }}</button>
        <div class="pill mk-ui19-secondary-resource"><span class="ui-glyph ui-fire" aria-hidden="true"></span> <span id="streak">{{ model.streak }}</span></div>
      </nav>
    </div>
  </header>
</template>
