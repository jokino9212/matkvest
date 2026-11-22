<script setup>
const props = defineProps({
  cells: { type: Array, required: true },
  actions: { type: Object, required: true },
});

function handleKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (!event.repeat) props.actions.primary();
  } else {
    props.actions.moveCell(event, event.currentTarget);
  }
}
</script>

<template>
  <template v-for="(cell, index) in cells" :key="index">
    <input
      v-if="cell.field" :class="cell.className" maxlength="1" :inputmode="cell.dot ? null : 'numeric'"
      :data-row="cell.row" :data-col="cell.col" :data-exp="cell.expected" :aria-label="cell.label"
      :value="cell.value" :disabled="cell.disabled" :readonly="cell.readOnly"
      @click="cell.dot && !$event.currentTarget.readOnly && actions.toggleDot($event.currentTarget)"
      @input="actions.inputCell($event.currentTarget)" @keydown="handleKey"
    >
    <div v-else :class="cell.className" :title="cell.title">{{ cell.text }}</div>
  </template>
</template>
