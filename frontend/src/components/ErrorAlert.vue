<script setup lang="ts">
import type { ApiError } from '@/api/api-error'

/** Shows an ApiError with its validation details and an optional retry button. */
defineProps<{ error: ApiError; retryable?: boolean }>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="alert alert-danger d-flex align-items-start gap-2" role="alert">
    <i class="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true"></i>
    <div class="flex-grow-1">
      <div>{{ error.message }}</div>
      <ul v-if="error.details.length" class="mb-0 mt-1 small">
        <li v-for="detail in error.details" :key="detail">{{ detail }}</li>
      </ul>
    </div>
    <button
      v-if="retryable"
      type="button"
      class="btn btn-sm btn-outline-danger"
      @click="emit('retry')"
    >
      <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Retry
    </button>
  </div>
</template>
