import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/api-error'

export type NotificationKind = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  id: number
  kind: NotificationKind
  message: string
  /** Extra lines, e.g. the individual messages of a validation error. */
  details: string[]
}

/** How long a toast stays visible (ms). Errors stay longer: they need to be read. */
const DURATION: Record<NotificationKind, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 8000,
}

const MAX_VISIBLE = 4

/**
 * Converts anything that was thrown into a text for the user.
 * ApiErrors already carry a readable message; anything else is a bug in the
 * frontend, and its technical message (e.g. "Cannot read properties of undefined")
 * means nothing to the user.
 */
export function describeError(error: unknown): { message: string; details: string[] } {
  if (error instanceof ApiError) return { message: error.message, details: error.details }
  return { message: 'Something went wrong. Please try again.', details: [] }
}

/** Toast notifications, shown by <ToastHost> in the app shell. */
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  let nextId = 1
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function dismiss(id: number) {
    clearTimeout(timers.get(id))
    timers.delete(id)
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function push(kind: NotificationKind, message: string, details: string[] = []): number {
    // The same message is already visible (e.g. several requests failed at once):
    // restart its timer instead of stacking identical toasts.
    const duplicate = notifications.value.find((n) => n.kind === kind && n.message === message)
    if (duplicate) dismiss(duplicate.id)

    const notification: Notification = { id: nextId++, kind, message, details }
    notifications.value = [...notifications.value, notification].slice(-MAX_VISIBLE)
    timers.set(
      notification.id,
      setTimeout(() => dismiss(notification.id), DURATION[kind]),
    )
    return notification.id
  }

  const success = (message: string) => push('success', message)
  const info = (message: string) => push('info', message)
  const warning = (message: string) => push('warning', message)

  /** Shows any thrown value as an error toast. Canceled requests are not errors. */
  function error(err: unknown): number | undefined {
    if (err instanceof ApiError && err.kind === 'canceled') return undefined
    const { message, details } = describeError(err)
    return push('error', message, details)
  }

  return { notifications, push, success, info, warning, error, dismiss }
})
