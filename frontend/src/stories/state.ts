import type { CollectionEntry, User } from '@/api/types'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'
import { anna, users } from './fixtures'

/**
 * Helpers that put the Pinia stores into a given state before a story renders.
 * Every story gets a fresh Pinia (see .storybook/preview.ts), so nothing leaks
 * from one story into the next.
 */

/** The user list is loaded and `user` is selected (like after the app started). */
export function actAs(user: User = anna) {
  const session = useSessionStore()
  session.users = users
  session.switchUser(user.id)
}

/** The current user's collection is loaded with these entries. */
export function withCollection(entries: CollectionEntry[] = []) {
  const collection = useCollectionStore()
  collection.entries = entries
  collection.loaded = true
}
