<script setup lang="ts">
/** Centered Bootstrap spinner shown while data is loading. */
withDefaults(defineProps<{label?: string}>(), {label: 'Loading…'});
</script>

<template>
  <div class="d-flex justify-content-center align-items-center gap-2 py-5">
    <div class="spinner-border text-primary" role="status" aria-hidden="true" />
    <span class="text-body-secondary">{{ label }}</span>
  </div>
</template>
