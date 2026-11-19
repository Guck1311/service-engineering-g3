import type { CreateMusicItem, MusicItem, MusicItemType } from '@/api/types'

/**
 * Logic of the admin form, without Vue: what the form holds, how it is checked
 * and how it becomes a request body. The component only binds inputs to it.
 *
 * Number inputs with v-model.number give '' when empty, hence `number | ''`.
 */
export interface MusicItemFormState {
  type: MusicItemType
  title: string
  artist: string
  genre: string
  releaseYear: number | ''
  minutes: number | ''
  seconds: number | ''
  trackCount: number | ''
  externalUrl: string
}

export type MusicItemFormErrors = Partial<Record<keyof MusicItemFormState | 'duration', string>>

export function formFromItem(item?: MusicItem): MusicItemFormState {
  const duration = item?.durationSeconds ?? null
  return {
    type: item?.type ?? 'TRACK',
    title: item?.title ?? '',
    artist: item?.artist ?? '',
    genre: item?.genre ?? '',
    releaseYear: item?.releaseYear ?? '',
    minutes: duration === null ? '' : Math.floor(duration / 60),
    seconds: duration === null ? '' : duration % 60,
    trackCount: item?.trackCount ?? '',
    externalUrl: item?.externalUrl ?? '',
  }
}

function isIntegerIn(value: number | '', min: number, max = Number.MAX_SAFE_INTEGER): boolean {
  return value === '' || (Number.isInteger(value) && value >= min && value <= max)
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Same rules as the backend's CreateMusicItemDto, checked before sending so the
 * user gets feedback next to the field. The backend still validates (the client
 * can always be bypassed).
 */
export function validateForm(form: MusicItemFormState): MusicItemFormErrors {
  const errors: MusicItemFormErrors = {}
  if (!form.title.trim()) errors.title = 'Title is required.'
  else if (form.title.length > 200) errors.title = 'At most 200 characters.'
  if (form.artist.length > 200) errors.artist = 'At most 200 characters.'
  if (form.genre.length > 100) errors.genre = 'At most 100 characters.'
  if (!isIntegerIn(form.releaseYear, 1000, 9999))
    errors.releaseYear = 'A year between 1000 and 9999.'
  if (!isIntegerIn(form.minutes, 0) || !isIntegerIn(form.seconds, 0, 59)) {
    errors.duration = 'Whole minutes, and seconds from 0 to 59.'
  } else if (form.minutes !== '' || form.seconds !== '') {
    if (Number(form.minutes) * 60 + Number(form.seconds) < 1) errors.duration = 'At least 1 second.'
  }
  if (form.type !== 'TRACK' && !isIntegerIn(form.trackCount, 0)) {
    errors.trackCount = 'A whole number, 0 or more.'
  }
  if (form.externalUrl.trim() && !isHttpUrl(form.externalUrl.trim())) {
    errors.externalUrl = 'A full http(s) link, e.g. https://open.spotify.com/…'
  }
  return errors
}

/** Builds the request body: empty optional fields are left out, trackCount only for albums/playlists. */
export function toPayload(form: MusicItemFormState): CreateMusicItem {
  const payload: CreateMusicItem = { type: form.type, title: form.title.trim() }
  if (form.artist.trim()) payload.artist = form.artist.trim()
  if (form.genre.trim()) payload.genre = form.genre.trim()
  if (form.releaseYear !== '') payload.releaseYear = form.releaseYear
  if (form.minutes !== '' || form.seconds !== '') {
    payload.durationSeconds = Number(form.minutes) * 60 + Number(form.seconds)
  }
  if (form.type !== 'TRACK' && form.trackCount !== '') payload.trackCount = form.trackCount
  if (form.externalUrl.trim()) payload.externalUrl = form.externalUrl.trim()
  return payload
}
