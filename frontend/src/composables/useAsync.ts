import {ref, shallowRef, type Ref} from 'vue';

/** Reactive state of an asynchronous operation. */
export interface AsyncState<T, A extends unknown[]> {
  /** Result of the last successful run, `undefined` before that. */
  data: Ref<T | undefined>;
  /** Whether a run is in progress. */
  loading: Ref<boolean>;
  /** Error of the last run, `null` if it succeeded. */
  error: Ref<unknown>;
  /** Runs the operation; resolves to `undefined` if it failed. */
  run: (...args: A) => Promise<T | undefined>;
}

/**
 * Wraps an async function (usually a service call) with `loading`, `error`
 * and `data` refs, so views don't repeat the same try/catch/finally.
 *
 * If several runs overlap (e.g. fast filter changes), only the result of
 * the latest run is kept.
 *
 * @param fn - The operation to run.
 * @returns Reactive state and a `run` function.
 *
 * @example
 * ```ts
 * const {data: item, loading, error, run} = useAsync(musicItemsService.get);
 * onMounted(() => run(42));
 * ```
 */
export function useAsync<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): AsyncState<T, A> {
  const data = shallowRef<T>();
  const loading = ref(false);
  const error = shallowRef<unknown>(null);
  let latestRun = 0;

  async function run(...args: A): Promise<T | undefined> {
    const runId = ++latestRun;
    loading.value = true;
    error.value = null;
    try {
      const result = await fn(...args);
      if (runId === latestRun) data.value = result;
      return result;
    } catch (e) {
      if (runId === latestRun) error.value = e;
      return undefined;
    } finally {
      if (runId === latestRun) loading.value = false;
    }
  }

  return {data, loading, error, run};
}
