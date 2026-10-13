<script setup lang="ts">
/**
 * Renders the toasts from the notifications store in the bottom-right
 * corner, using Bootstrap's toast classes.
 */
import {useNotificationsStore} from '@/stores/notifications';

const notifications = useNotificationsStore();
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <TransitionGroup name="toast">
      <div
        v-for="toast in notifications.toasts"
        :key="toast.id"
        class="toast show align-items-center border-0"
        :class="`text-bg-${toast.variant}`"
        role="status"
        aria-live="polite"
      >
        <div class="d-flex">
          <div class="toast-body">{{ toast.message }}</div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            aria-label="Close"
            @click="notifications.dismiss(toast.id)"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
