import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, pluralize } from '../format'

describe('formatDuration', () => {
  it.each([
    [259, '4:19'],
    [60, '1:00'],
    [5, '0:05'],
    [3723, '1:02:03'],
    [null, '-'],
    [undefined, '-'],
  ])('%s -> %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('formats an ISO timestamp', () => {
    expect(formatDate('2026-11-19T12:00:00.000Z')).toBe('19 Nov 2026')
  })
})

describe('pluralize', () => {
  it('uses the singular only for 1', () => {
    expect(pluralize(1, 'track')).toBe('1 track')
    expect(pluralize(0, 'track')).toBe('0 tracks')
    expect(pluralize(17, 'track')).toBe('17 tracks')
  })
})
