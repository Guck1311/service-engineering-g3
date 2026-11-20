import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/api-error'
import { useAsync } from '../useAsync'

/** A promise that the test resolves or rejects by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('tracks loading and stores the result', async () => {
    const d = deferred<string>()
    const { data, loading, error, run } = useAsync(() => d.promise)

    expect(loading.value).toBe(false)
    const running = run()
    expect(loading.value).toBe(true)

    d.resolve('Abbey Road')
    expect(await running).toBe('Abbey Road')
    expect(data.value).toBe('Abbey Road')
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('stores errors as ApiError instead of throwing', async () => {
    const { data, error, loading, run } = useAsync(() =>
      Promise.reject(new ApiError('Music item 999 not found', 'http', 404)),
    )

    expect(await run()).toBeUndefined()
    expect(error.value).toMatchObject({ status: 404, message: 'Music item 999 not found' })
    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)
  })

  it('passes arguments through', async () => {
    const { data, run } = useAsync((a: number, b: number) => Promise.resolve(a + b))
    await run(2, 3)
    expect(data.value).toBe(5)
  })

  it('ignores an older response that arrives after a newer one', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const { data, loading, run } = useAsync((p: Promise<string>) => p)

    const first = run(slow.promise) // e.g. search "ab"
    const second = run(fast.promise) // e.g. search "abbey"

    fast.resolve('result for "abbey"')
    await second
    slow.resolve('result for "ab"') // arrives late
    await first

    expect(data.value).toBe('result for "abbey"')
    expect(loading.value).toBe(false)
  })
})
