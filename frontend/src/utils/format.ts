// Pure formatting functions: no Vue, no state; used by several components.

/** 259 -> "4:19", 3723 -> "1:02:03", null -> "-" */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** ISO string from the API -> "19 Nov 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** ISO string from the API -> "19 Nov 2026, 18:43" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** 1 -> "1 track", 17 -> "17 tracks" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Short facts of a music item for cards and lists: ["1969", "Rock", "3 tracks", "47:03"]. */
export function itemFacts(item: {
  releaseYear: number | null
  genre: string | null
  trackCount: number | null
  durationSeconds: number | null
}): string[] {
  const facts: string[] = []
  if (item.releaseYear) facts.push(String(item.releaseYear))
  if (item.genre) facts.push(item.genre)
  if (item.trackCount !== null) facts.push(pluralize(item.trackCount, 'track'))
  if (item.durationSeconds) facts.push(formatDuration(item.durationSeconds))
  return facts
}
