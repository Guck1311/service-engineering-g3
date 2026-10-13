<script setup lang="ts">
/**
 * The current user's collection with like/dislike/favourite controls.
 * Data comes from the shared collection store; the filters work on the
 * loaded entries with computed properties, without extra requests.
 */
import {computed, ref} from 'vue';
import type {
  CollectionEntry,
  CollectionEntryPatch,
  Reaction,
} from '@/api/types';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MusicTypeBadge from '@/components/MusicTypeBadge.vue';
import ReactionControls from '@/components/ReactionControls.vue';
import StarRating from '@/components/StarRating.vue';
import {useCollectionStore} from '@/stores/collection';
import {useNotificationsStore} from '@/stores/notifications';
import {useSessionStore} from '@/stores/session';
import {formatDate, formatDuration} from '@/utils/format';

type Filter = 'ALL' | Exclude<Reaction, 'NONE'> | 'FAVOURITE';

const FILTERS: {value: Filter; label: string; icon: string}[] = [
  {value: 'ALL', label: 'All', icon: 'bi-collection'},
  {value: 'FAVOURITE', label: 'Favourites', icon: 'bi-heart'},
  {value: 'LIKE', label: 'Liked', icon: 'bi-hand-thumbs-up'},
  {value: 'DISLIKE', label: 'Disliked', icon: 'bi-hand-thumbs-down'},
];

const session = useSessionStore();
const collection = useCollectionStore();
const notifications = useNotificationsStore();
const filter = ref<Filter>('ALL');
/** Music item ids with a request in progress. */
const busy = ref(new Set<number>());

const visible = computed(() =>
  collection.list.filter(entry => {
    if (filter.value === 'ALL') return true;
    if (filter.value === 'FAVOURITE') return entry.favourite;
    return entry.reaction === filter.value;
  }),
);

/** Runs a store action for one entry with busy state and error toast. */
async function withBusy(
  entry: CollectionEntry,
  action: () => Promise<void>,
): Promise<void> {
  busy.value.add(entry.musicItem.id);
  try {
    await action();
  } catch (e) {
    notifications.error(e);
  } finally {
    busy.value.delete(entry.musicItem.id);
  }
}

function mark(entry: CollectionEntry, patch: CollectionEntryPatch) {
  return withBusy(entry, () => collection.update(entry.musicItem.id, patch));
}

function remove(entry: CollectionEntry) {
  return withBusy(entry, async () => {
    await collection.remove(entry.musicItem.id);
    notifications.success(`Removed "${entry.musicItem.title}"`);
  });
}
</script>

<template>
  <div>
    <h1 class="h2 mb-1">My collection</h1>
    <p class="text-body-secondary mb-4">
      {{ session.currentUser?.name }}'s music ·
      {{ collection.list.length }} items
    </p>

    <ul class="nav nav-pills mb-4">
      <li v-for="option in FILTERS" :key="option.value" class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{active: filter === option.value}"
          @click="filter = option.value"
        >
          <i class="bi me-1" :class="option.icon" aria-hidden="true" />
          {{ option.label }}
        </button>
      </li>
    </ul>

    <LoadingSpinner v-if="!collection.loaded" />
    <div v-else-if="collection.list.length === 0" class="text-center py-5">
      <i class="bi bi-music-note-beamed display-4 text-body-secondary" />
      <p class="mt-3">Your collection is empty.</p>
      <RouterLink :to="{name: 'catalogue'}" class="btn btn-primary">
        Browse the catalogue
      </RouterLink>
    </div>
    <p v-else-if="visible.length === 0" class="text-body-secondary">
      No items match this filter.
    </p>

    <div v-else class="list-group shadow-sm">
      <div
        v-for="entry in visible"
        :key="entry.musicItem.id"
        class="list-group-item d-flex flex-wrap align-items-center gap-3 py-3"
        :class="{'opacity-50': busy.has(entry.musicItem.id)}"
      >
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-1">
            <MusicTypeBadge :type="entry.musicItem.type" />
            <RouterLink
              :to="{name: 'item', params: {id: entry.musicItem.id}}"
              class="fw-semibold text-decoration-none"
            >
              {{ entry.musicItem.title }}
            </RouterLink>
          </div>
          <small class="text-body-secondary">
            {{ entry.musicItem.artist ?? 'Various artists' }} ·
            {{ formatDuration(entry.musicItem.durationSeconds) }} · added
            {{ formatDate(entry.addedAt) }}
          </small>
        </div>
        <StarRating :model-value="entry.musicItem.averageRating" readonly />
        <ReactionControls
          :reaction="entry.reaction"
          :favourite="entry.favourite"
          :disabled="busy.has(entry.musicItem.id)"
          @change="patch => mark(entry, patch)"
        />
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          :disabled="busy.has(entry.musicItem.id)"
          @click="remove(entry)"
        >
          <i class="bi bi-trash" aria-hidden="true" />
          <span class="visually-hidden">Remove</span>
        </button>
      </div>
    </div>
  </div>
</template>
