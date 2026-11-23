import type { Decorator } from '@storybook/vue3-vite'
import ToastHost from '@/components/ToastHost.vue'

/**
 * Renders the toast container next to the story, as App.vue does in the app.
 * Needed wherever a story ends in a toast: success messages, or errors that the
 * global error handler (plugins/error-handling.ts) turns into toasts.
 */
export const withToasts: Decorator = (story) => ({
  components: { story, ToastHost },
  template: '<story /><ToastHost />',
})

/** Dark navbar background for components that live in the navbar. */
export const onNavbar: Decorator = (story) => ({
  components: { story },
  template: '<div class="bg-primary p-3 rounded d-inline-block"><story /></div>',
})
