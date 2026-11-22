<script setup>
defineProps({
  choices: { type: Array, required: true },
  containerClass: { type: String, default: 'answers' },
});
defineEmits(['choose']);
</script>

<template>
  <div :class="containerClass">
    <button
      v-for="(choice, index) in choices" :key="index"
      type="button" :class="choice.className" :disabled="choice.disabled"
      :aria-pressed="choice.selected"
      @click="$emit('choose', index)"
    ><span v-if="choice.labelHtml !== undefined" style="display: contents" v-html="choice.labelHtml"></span><template v-else>{{ choice.label }}</template></button>
  </div>
</template>
