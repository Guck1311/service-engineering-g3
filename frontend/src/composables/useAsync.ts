import { computed, ref, shallowRef, type Ref } from 'vue'
import { ApiError } from '@/api/api-error'

export interface UseAsync<T, A extends unknown[]> {
  /** Result of the last successful call (undefined before the first one). */
  data: Readonly<Ref<T | undefined>>
  /** Error of the last call, or null. */
  error: Readonly<Ref<ApiError | null>>
  /** True while a call is running. */
  loading: Readonly<Ref<boolean>>
  /** Starts the call. Never throws: on failure it returns undefined and sets `error`. */
  run: (...args: A) => Promise<T | undefined>
}

/**
 * Composable: reusable, stateful logic for components.
 *
 * Wraps an async function (usually a service call) and exposes its state as
 * reactive refs, so a component only has to render `loading`, `error` and `data`:
 *
 *   const { data: item, loading, error, run } = useAsync(musicItemsService.get)
 *   onMounted(() => run(props.id))
 *
 * Each component that calls useAsync() gets its own, independent state.
 */
export function useAsync<T, A extends unknown[]>(fn: (...args: A) => Promise<T>): UseAsync<T, A> {
  // shallowRef: the API result is replaced as a whole, never mutated deeply,
  // so Vue doesn't need to make every nested object reactive.
  const data = shallowRef<T | undefined>()
  const error = shallowRef<ApiError | null>(null)
  const loading = ref(false)

  // Counts calls. If calls overlap (e.g. typing in a search field), only the
  // LATEST one may update the state; an older response arriving later is ignored.
  let latestCall = 0

  async function run(...args: A): Promise<T | undefined> {
    const call = ++latestCall
    loading.value = true
    error.value = null
    try {
      const result = await fn(...args)
      if (call === latestCall) data.value = result
      return result
    } catch (e) {
      if (call === latestCall) error.value = ApiError.from(e)
      return undefined
    } finally {
      if (call === latestCall) loading.value = false
    }
  }

  // computed() without a setter: components can read the state but only change it
  // through run(). (readonly() would also work, but makes the data DEEPLY readonly,
  // so a MusicItem could not be passed to functions expecting a MusicItem.)
  return {
    data: computed(() => data.value),
    error: computed(() => error.value),
    loading: computed(() => loading.value),
    run,
  }
}
