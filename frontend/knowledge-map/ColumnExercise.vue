<script setup>
import ColumnCells from './ColumnCells.vue';

defineProps({
  model: { type: Object, required: true },
  actions: { type: Object, required: true },
});

function preventRepeatedEnter(event) {
  if (event.repeat) event.preventDefault();
}
</script>

<template>
  <div class="card" @keydown.enter="preventRepeatedEnter">
    <div v-if="model.title" class="task-title" v-html="model.title"></div>
    <div v-if="model.help" class="carry-help" v-html="model.help"></div>
    <div v-if="model.division" class="div-layout" :style="model.division.style">
      <div class="div-rows">
        <div v-for="(row, index) in model.rows" :key="index" :class="row.className" :style="row.style">
          <ColumnCells :cells="row.cells" :actions="actions" />
        </div>
      </div>
      <div class="div-side">
        <div class="divisor-box">{{ model.division.divisor }}</div>
        <div class="quotient-inputs"><ColumnCells :cells="model.division.quotient" :actions="actions" /></div>
      </div>
    </div>
    <div v-else class="cwrap">
      <div class="cgrid" :style="model.gridStyle">
        <template v-for="(row, index) in model.rows" :key="index">
          <div v-if="row.className" :class="row.className" :style="row.style">
            <ColumnCells :cells="row.cells" :actions="actions" />
          </div>
          <ColumnCells v-else :cells="row.cells" :actions="actions" />
        </template>
      </div>
    </div>
    <div :class="model.noteClass" v-html="model.note"></div>
    <div class="actions">
      <button
        id="columnPrimary" type="button" :class="model.primaryClass"
        @click="actions.primary"
      >{{ model.primaryLabel }}</button>
      <button
        v-show="!model.hideSkip" id="columnSkip" type="button" class="btn soft" @click="actions.skip"
      >{{ model.skipLabel }}</button>
    </div>
    <div v-if="model.feedbackHtml !== undefined" id="fb" class="feedback" role="status" v-html="model.feedbackHtml"></div>
    <div v-else id="fb" class="feedback" role="status">{{ model.feedback }}</div>
  </div>
</template>
