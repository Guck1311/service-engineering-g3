import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * Whether the browser has a network connection, as a reactive ref.
 *
 * Registers window listeners when the component is mounted and REMOVES them when
 * it is unmounted. Vue cleans up its own watchers automatically, but it does not
 * know about listeners added to `window`; forgetting this leaks a listener for
 * every component instance ever created.
 */
export function useOnlineStatus(): Readonly<Ref<boolean>> {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  const update = () => {
    online.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    update()
  })

  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return online
}
