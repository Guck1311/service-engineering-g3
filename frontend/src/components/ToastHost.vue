<script setup lang="ts">
import { useNotificationsStore, type NotificationKind } from '@/stores/notifications'

const notifications = useNotificationsStore()

const STYLE: Record<NotificationKind, { icon: string; color: string; title: string }> = {
  success: { icon: 'bi-check-circle-fill', color: 'text-success', title: 'Done' },
  info: { icon: 'bi-info-circle-fill', color: 'text-info', title: 'Info' },
  warning: { icon: 'bi-exclamation-triangle-fill', color: 'text-warning', title: 'Warning' },
  error: { icon: 'bi-x-octagon-fill', color: 'text-danger', title: 'Error' },
}
</script>

<template>
  <!-- Fixed in the bottom-right corner, above the page content. -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <TransitionGroup name="toast">
      <!-- Bootstrap's toast markup with class "show"; Vue decides when it exists.
           role=alert makes screen readers announce errors immediately. -->
      <div
        v-for="n in notifications.notifications"
        :key="n.id"
        class="toast show"
        :role="n.kind === 'error' ? 'alert' : 'status'"
        :aria-live="n.kind === 'error' ? 'assertive' : 'polite'"
        aria-atomic="true"
      >
        <div class="toast-header">
          <i
            :class="['bi', STYLE[n.kind].icon, STYLE[n.kind].color, 'me-2']"
            aria-hidden="true"
          ></i>
          <strong class="me-auto">{{ STYLE[n.kind].title }}</strong>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="notifications.dismiss(n.id)"
          ></button>
        </div>
        <div class="toast-body">
          {{ n.message }}
          <ul v-if="n.details.length" class="mb-0 mt-1 small">
            <li v-for="detail in n.details" :key="detail">{{ detail }}</li>
          </ul>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}
</style>
