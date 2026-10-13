<script setup lang="ts">
/**
 * The shared catalogue as a card grid. Filters and page are kept in the URL
 * query (`?type=ALBUM&search=road&page=2`), so a filtered view can be
 * bookmarked and the browser's back button works.
 */
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {useRoute, useRouter, type LocationQueryRaw} from 'vue-router';
import type {MusicItem, MusicItemType} from '@/api/types';
import CollectionButton from '@/components/CollectionButton.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MusicItemCard from '@/components/MusicItemCard.vue';
import PaginationNav from '@/components/PaginationNav.vue';
import {useAsync} from '@/composables/useAsync';
import {musicItemsService} from '@/services/music-items.service';
import {useCollectionStore} from '@/stores/collection';
import {useNotificationsStore} from '@/stores/notifications';
import {useSessionStore} from '@/stores/session';
import {TYPE_INFO} from '@/utils/format';

const PAGE_SIZE = 12;
const SEARCH_DELAY_MS = 300;

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const collection = useCollectionStore();
const notifications = useNotificationsStore();
const {data, loading, error, run} = useAsync(musicItemsService.list);

/** Filters as read from the URL. */
const filters = computed(() => ({
  type: (route.query.type as MusicItemType | undefined) || undefined,
  search: (route.query.search as string | undefined) ?? '',
  page: Number(route.query.page) || 1,
}));

const page = computed({
  get: () => filters.value.page,
  set: value => updateQuery({page: value > 1 ? value : undefined}),
});

/** Updates the URL query; the watcher below then reloads the list. */
function updateQuery(patch: LocationQueryRaw): void {
  const query: LocationQueryRaw = {...route.query, ...patch};
  for (const key of Object.keys(query)) {
    if (query[key] === undefined || query[key] === '') delete query[key];
  }
  void router.replace({query});
}

// The search box updates the URL after a short pause in typing.
const searchInput = ref(filters.value.search);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchInput, value => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(
    () => updateQuery({search: value.trim(), page: undefined}),
    SEARCH_DELAY_MS,
  );
});
onBeforeUnmount(() => clearTimeout(searchTimer));

const load = () =>
  run({
    type: filters.value.type,
    search: filters.value.search || undefined,
    page: filters.value.page,
    limit: PAGE_SIZE,
  });
watch(filters, load, {immediate: true});

async function remove(item: MusicItem): Promise<void> {
  if (
    !confirm(`Delete "${item.title}" from the catalogue and all collections?`)
  ) {
    return;
  }
  try {
    await musicItemsService.remove(item.id);
    collection.forget(item.id);
    notifications.success(`Deleted "${item.title}"`);
    await load();
  } catch (e) {
    notifications.error(e);
  }
}
</script>

<template>
  <div>
    <div
      class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"
    >
      <div>
        <h1 class="h2 mb-1">Catalogue</h1>
        <p class="text-body-secondary mb-0">
          All tracks, albums and playlists.
          <template v-if="session.isUser"
            >Add them to your collection.</template
          >
        </p>
      </div>
      <RouterLink
        v-if="session.isAdmin"
        :to="{name: 'item-create'}"
        class="btn btn-primary"
      >
        <i class="bi bi-plus-lg me-1" aria-hidden="true" />New item
      </RouterLink>
    </div>

    <div class="row g-2 mb-4">
      <div class="col-md-8">
        <div class="input-group">
          <span class="input-group-text">
            <i class="bi bi-search" aria-hidden="true" />
          </span>
          <input
            v-model="searchInput"
            type="search"
            class="form-control"
            placeholder="Search title or artist"
            aria-label="Search title or artist"
          />
        </div>
      </div>
      <div class="col-md-4">
        <select
          class="form-select"
          aria-label="Filter by type"
          :value="filters.type ?? ''"
          @change="
            updateQuery({
              type: ($event.target as HTMLSelectElement).value,
              page: undefined,
            })
          "
        >
          <option value="">All types</option>
          <option v-for="(info, type) in TYPE_INFO" :key="type" :value="type">
            {{ info.label }}s
          </option>
        </select>
      </div>
    </div>

    <ErrorAlert v-if="error" :error="error" retryable @retry="load" />
    <LoadingSpinner v-else-if="loading && !data" />
    <template v-else-if="data">
      <p
        v-if="data.data.length === 0"
        class="text-center text-body-secondary py-5"
      >
        No music items match your filters.
      </p>
      <div
        class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4 mb-4"
        :class="{'opacity-50': loading}"
      >
        <div v-for="item in data.data" :key="item.id" class="col">
          <MusicItemCard :item="item">
            <template v-if="session.isUser || session.isAdmin" #actions>
              <CollectionButton
                v-if="session.isUser"
                :music-item-id="item.id"
                :title="item.title"
              />
              <div v-else class="d-flex gap-2">
                <RouterLink
                  :to="{name: 'item-edit', params: {id: item.id}}"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="bi bi-pencil me-1" aria-hidden="true" />Edit
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  @click="remove(item)"
                >
                  <i class="bi bi-trash me-1" aria-hidden="true" />Delete
                </button>
              </div>
            </template>
          </MusicItemCard>
        </div>
      </div>
      <PaginationNav v-model="page" :meta="data.meta" />
    </template>
  </div>
</template>
