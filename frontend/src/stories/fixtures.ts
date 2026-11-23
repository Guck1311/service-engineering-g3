import type { CollectionEntry, MusicItem, Page, Reaction, User } from '@/api/types'

/**
 * Example data for the stories. It mirrors the backend's seed data
 * (backend/src/seed/seed.service.ts), so the stories look like the real app.
 */

export const users: User[] = [
  { id: 1, name: 'Admin', role: 'ADMIN' },
  { id: 2, name: 'Anna', role: 'USER' },
  { id: 3, name: 'Ben', role: 'USER' },
]

export const [admin, anna, ben] = users as [User, User, User]

const CREATED = '2026-10-01T09:00:00.000Z'

function item(fields: Partial<MusicItem> & Pick<MusicItem, 'id' | 'type' | 'title'>): MusicItem {
  return {
    artist: null,
    genre: null,
    releaseYear: null,
    durationSeconds: null,
    externalUrl: null,
    averageRating: null,
    ratingCount: 0,
    trackCount: null,
    createdAt: CREATED,
    updatedAt: CREATED,
    ...fields,
  }
}

export const comeTogether = item({
  id: 1,
  type: 'TRACK',
  title: 'Come Together',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 259,
})
export const something = item({
  id: 2,
  type: 'TRACK',
  title: 'Something',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 182,
})
export const hereComesTheSun = item({
  id: 3,
  type: 'TRACK',
  title: 'Here Comes the Sun',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 185,
})
export const getLucky = item({
  id: 4,
  type: 'TRACK',
  title: 'Get Lucky',
  artist: 'Daft Punk',
  genre: 'Electronic',
  releaseYear: 2013,
  durationSeconds: 369,
})
export const bohemianRhapsody = item({
  id: 5,
  type: 'TRACK',
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  genre: 'Rock',
  releaseYear: 1975,
  durationSeconds: 354,
  averageRating: 5,
  ratingCount: 1,
})
export const abbeyRoad = item({
  id: 6,
  type: 'ALBUM',
  title: 'Abbey Road',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  trackCount: 3,
  durationSeconds: 626,
  externalUrl: 'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN',
  averageRating: 4.5,
  ratingCount: 2,
})
export const roadTrip = item({
  id: 7,
  type: 'PLAYLIST',
  title: 'Road Trip',
  trackCount: 2,
  durationSeconds: 723,
})

export const musicItems: MusicItem[] = [
  comeTogether,
  something,
  hereComesTheSun,
  getLucky,
  bohemianRhapsody,
  abbeyRoad,
  roadTrip,
]

export function entry(
  musicItem: MusicItem,
  reaction: Reaction = 'NONE',
  favourite = false,
  user: User = anna,
): CollectionEntry {
  return { user, musicItem, reaction, favourite, addedAt: '2026-11-02T18:30:00.000Z' }
}

/** Anna's collection in the seed data. */
export const annasCollection: CollectionEntry[] = [entry(abbeyRoad, 'LIKE', true), entry(getLucky)]

/** Wraps a list as one page of a list endpoint. */
export function page<T>(data: T[], total = data.length, pageNumber = 1, limit = 12): Page<T> {
  return { data, meta: { page: pageNumber, limit, total } }
}
