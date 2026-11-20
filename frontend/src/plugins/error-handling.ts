import type { App, Plugin } from 'vue'
import type { Router } from 'vue-router'
import { ApiError } from '@/api/api-error'
import { useNotificationsStore } from '@/stores/notifications'

/** Text of the error Vite/browsers raise when a lazy-loaded chunk cannot be downloaded. */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|Loading chunk/i.test(
      error.message,
    )
  )
}

function report(error: unknown, context: string) {
  // Expected API failures are already readable; anything else is a bug: log it fully.
  if (!(error instanceof ApiError)) console.error(`[${context}]`, error)
  useNotificationsStore().error(error)
}

/**
 * Installs the app-wide error handling. A Vue plugin: an object with install(),
 * used via app.use(errorHandling, { router }) like Pinia or the router.
 *
 * 1. app.config.errorHandler   errors inside Vue: event handlers (also rejected
 *                               promises they return), lifecycle hooks, watchers, render
 * 2. router.onError            a lazy-loaded page could not be downloaded
 * 3. 'unhandledrejection'      promises that failed outside Vue's reach
 */
export const errorHandling: Plugin<[{ router?: Router }?]> = {
  install(app: App, options = {}) {
    // 1. Vue's global error handler. Components don't need try/catch for action
    //    errors: e.g. @click="collection.add(id)" rejecting with a 409 ends up here.
    app.config.errorHandler = (error, _instance, info) => {
      report(error, `vue: ${info}`)
    }

    // 2. After a new deployment, old chunk file names no longer exist on the server.
    options.router?.onError((error) => {
      if (isChunkLoadError(error)) {
        useNotificationsStore().warning(
          'This page could not be loaded, probably because a new version was deployed. Please reload the page.',
        )
      } else {
        report(error, 'router')
      }
    })

    // 3. Safety net for promises without a handler (e.g. `void someAsyncCall()`).
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault() // handled here; don't log it a second time
        report(event.reason, 'unhandled promise')
      })
    }
  },
}
