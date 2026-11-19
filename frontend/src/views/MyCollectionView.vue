<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { CollectionEntry } from '@/api/types'
import ErrorAlert from '@/components/ErrorAlert.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MusicTypeBadge from '@/components/MusicTypeBadge.vue'
import ReactionControls from '@/components/ReactionControls.vue'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'
import { formatDate, itemFacts } from '@/utils/format'

// No data loading here: the collection store already holds the current user's
// collection and keeps it up to date (also after switching the user).
const collection = useCollectionStore()
const session = useSessionStore()

type Filter = 'ALL' | 'FAVOURITES' | 'LIKED' | 'DISLIKED'

const FILTERS: { value: Filter; label: string; matches: (e: CollectionEntry) => boolean }[] = [
  { value: 'ALL', label: 'All', matches: () => true },
  { value: 'FAVOURITES', label: 'Favourites', matches: (e) => e.favourite },
  { value: 'LIKED', label: 'Liked', matches: (e) => e.reaction === 'LIKE' },
  { value: 'DISLIKED', label: 'Disliked', matches: (e) => e.reaction === 'DISLIKE' },
]

// Local UI state: which tab is selected. Only this page needs it.
const filter = ref<Filter>('ALL')

const counts = computed(
  () =>
    Object.fromEntries(
      FILTERS.map((f) => [f.value, collection.entries.filter(f.matches).length]),
    ) as Record<Filter, number>,
)

// Derived state: recomputed when the store's entries or the selected tab change.
const visible = computed(() => {
  const matches = FILTERS.find((f) => f.value === filter.value)!.matches
  return collection.entries.filter(matches)
})
</script>

<template>
  <section>
    <h1 class="h3 mb-1"><i class="bi bi-collection text-primary me-2"></i>My collection</h1>
    <p class="text-body-secondary">
      {{ session.currentUser?.name ?? '…' }} · {{ collection.count }} item{{
        collection.count === 1 ? '' : 's'
      }}
    </p>

    <ul class="nav nav-pills mb-3">
      <li v-for="f in FILTERS" :key="f.value" class="nav-item">
        <button
          type="button"
          :class="['nav-link', { active: filter === f.value }]"
          @click="filter = f.value"
        >
          {{ f.label }} <span class="badge text-bg-light ms-1">{{ counts[f.value] }}</span>
        </button>
      </li>
    </ul>

    <ErrorAlert
      v-if="collection.error"
      :error="collection.error"
      retryable
      @retry="collection.load()"
    />
    <LoadingSpinner
      v-else-if="collection.loading && !collection.loaded"
      label="Loading collection…"
    />

    <div v-else-if="collection.count === 0" class="text-center py-5 text-body-secondary">
      <i class="bi bi-collection display-5 d-block mb-2"></i>
      Your collection is empty.
      <RouterLink :to="{ name: 'catalogue' }">Browse the catalogue</RouterLink> to add music.
    </div>

    <p v-else-if="visible.length === 0" class="text-body-secondary">Nothing here yet.</p>

    <!-- TransitionGroup: entries fade out when removed or filtered away. -->
    <TransitionGroup v-else name="list" tag="ul" class="list-group">
      <li
        v-for="entry in visible"
        :key="entry.musicItem.id"
        class="list-group-item d-flex flex-wrap align-items-center gap-3"
      >
        <MusicTypeBadge :type="entry.musicItem.type" />
        <div class="flex-grow-1">
          <RouterLink
            :to="{ name: 'item-detail', params: { id: entry.musicItem.id } }"
            class="fw-semibold text-decoration-none"
          >
            {{ entry.musicItem.title }}
          </RouterLink>
          <div class="small text-body-secondary">
            {{
              [entry.musicItem.artist ?? 'Various artists', ...itemFacts(entry.musicItem)].join(
                ' · ',
              )
            }}
            · added {{ formatDate(entry.addedAt) }}
          </div>
        </div>
        <ReactionControls
          :reaction="entry.reaction"
          :favourite="entry.favourite"
          @react="collection.setReaction(entry.musicItem.id, $event)"
          @toggle-favourite="collection.toggleFavourite(entry.musicItem.id)"
        />
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          title="Remove from collection"
          @click="collection.remove(entry.musicItem.id)"
        >
          <i class="bi bi-x-lg"></i><span class="visually-hidden">Remove</span>
        </button>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
/* Classes added by <TransitionGroup name="list"> while an entry enters or leaves. */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
