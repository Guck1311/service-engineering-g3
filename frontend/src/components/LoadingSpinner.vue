<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Loading…' })
</script>

<template>
  <div class="d-flex align-items-center justify-content-center gap-2 py-4 text-body-secondary">
    <div
      class="spinner-border spinner-border-sm text-primary"
      role="status"
      aria-hidden="true"
    ></div>
    <span>{{ label }}</span>
  </div>
</template>
