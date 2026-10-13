<script setup lang="ts">
/**
 * Shows a failed request as a Bootstrap alert with an optional retry button.
 * Used by views when loading data fails.
 */
import {computed} from 'vue';
import {errorMessage} from '@/stores/notifications';

const props = defineProps<{
  /** The caught error. */
  error: unknown;
  /** Show a "Try again" button. */
  retryable?: boolean;
}>();

const emit = defineEmits<{
  /** The user clicked "Try again". */
  retry: [];
}>();

const message = computed(() => errorMessage(props.error));
</script>

<template>
  <div class="alert alert-danger d-flex align-items-center gap-3" role="alert">
    <i class="bi bi-exclamation-triangle-fill fs-4" aria-hidden="true" />
    <div class="flex-grow-1">{{ message }}</div>
    <button
      v-if="retryable"
      type="button"
      class="btn btn-sm btn-outline-danger"
      @click="emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
