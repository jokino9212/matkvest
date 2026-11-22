<script setup>
defineProps({ model: Object, actions: Object });
</script>

<template>
  <div class="mk872-col-head"><h3>📦 Архивные предметы</h3><small>{{ model.count }} обнаружено</small></div>
  <section v-for="group in model.groups" :key="group.type" :class="group.className">
    <div v-if="group.type === 'avatars'" class="mk873-archive-intro">
      <b>📦 Архивные предметы</b><div>{{ group.description }}</div>
    </div>
    <template v-else><h3>{{ group.title }}</h3><p>{{ group.description }}</p></template>
    <div v-if="group.items.length" class="mk872-col-grid">
      <div v-for="item in group.items" :key="item.id" class="mk872-col-card mk873-archive-card">
        <div class="mk872-col-art"><span class="shop-icon" style="height:100%;width:100%;margin:0" v-html="item.icon"></span></div>
        <strong>{{ item.name }}</strong><span class="mk872-col-meta">{{ group.label }}</span>
        <div class="mk873-archive-price">{{ item.detail }}</div>
        <button v-if="item.button" type="button" class="mk872-col-action mk873-archive-action"
          :class="{ primary: item.primary }" :disabled="!item.action" @click="actions.run(item.action, item.id)"
        >{{ item.button }}</button>
      </div>
    </div>
    <div v-else class="mk872-col-empty">{{ group.empty }}</div>
    <div v-if="group.type === 'avatars'" class="mk873-archive-help">
      <p>Нет подтверждения старой покупки? Сохраните заявку и передайте её владельцу проекта вместе с резервной копией, если она есть. Этот файл не начисляет монеты.</p>
      <button type="button" class="btn soft" @click="actions.run('claim')">📄 Заявка на проверку</button>
    </div>
  </section>
</template>
