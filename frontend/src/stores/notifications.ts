import {defineStore} from 'pinia';
import {ref} from 'vue';
import {ApiError} from '@/api/http';

/** Visual style of a toast, mapped to Bootstrap's contextual colours. */
export type ToastVariant = 'success' | 'danger' | 'info';

/** One toast message shown in the corner of the screen. */
export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

/** How long a toast stays visible, in milliseconds. */
const TOAST_DURATION_MS = 5000;

/**
 * Global toast messages for feedback after user actions.
 *
 * Any component can push a message; `ToastHost` renders them. This keeps
 * error and success feedback consistent across the app.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  /**
   * Shows a toast that hides itself after a few seconds.
   *
   * @param variant - Colour of the toast.
   * @param message - Text to show.
   */
  function push(variant: ToastVariant, message: string): void {
    const id = nextId++;
    toasts.value.push({id, variant, message});
    setTimeout(() => dismiss(id), TOAST_DURATION_MS);
  }

  /**
   * Hides a toast.
   *
   * @param id - Id of the toast.
   */
  function dismiss(id: number): void {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
  }

  /** Shows a green success toast. */
  function success(message: string): void {
    push('success', message);
  }

  /**
   * Shows a red error toast. For an {@link ApiError} the backend's message
   * is shown; for anything else a generic text.
   *
   * @param error - The caught error.
   */
  function error(error: unknown): void {
    push('danger', errorMessage(error));
  }

  return {toasts, push, dismiss, success, error};
});

/**
 * Converts any caught value into a message for the user.
 *
 * @param error - The caught error.
 * @returns The backend's message for an {@link ApiError}, else a generic text.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
