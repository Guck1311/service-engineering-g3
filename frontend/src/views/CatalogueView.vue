<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { MusicItemType } from '@/api/types'
import CollectionButton from '@/components/CollectionButton.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MusicItemCard from '@/components/MusicItemCard.vue'
import PaginationNav from '@/components/PaginationNav.vue'
import { useAsync } from '@/composables/useAsync'
import { musicItemsService } from '@/services/music-items.service'
import { useSessionStore } from '@/stores/session'

// The filters come from the URL query (see catalogueProps in the router).
const props = defineProps<{ search?: string; type?: MusicItemType; page: number }>()

const PAGE_SIZE = 12
const TYPE_FILTERS: { value: MusicItemType | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'TRACK', label: 'Tracks' },
  { value: 'ALBUM', label: 'Albums' },
  { value: 'PLAYLIST', label: 'Playlists' },
]

const session = useSessionStore()
const route = useRoute()
const router = useRouter()

const { data: result, loading, error, run } = useAsync(musicItemsService.list)

function load() {
  return run({ search: props.search, type: props.type, page: props.page, limit: PAGE_SIZE })
}

// Load on creation (immediate) and whenever a filter in the URL changes,
// including Back/Forward. The component instance is REUSED between
// /catalogue?page=1 and ?page=2, so onMounted alone would not be enough.
watch(() => [props.search, props.type, props.page], load, { immediate: true })

/** Changes the query; undefined removes a key. Filters reset to page 1. */
function setQuery(changes: LocationQueryRaw) {
  const query: LocationQueryRaw = { ...route.query, denied: undefined, ...changes }
  for (const key of Object.keys(query)) if (query[key] === undefined) delete query[key]
  void router.replace({ query })
}

// --- Search with debounce: wait until the user stops typing for 300 ms ---
const searchInput = ref(props.search ?? '')
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const search = value.trim() || undefined
    if (search !== props.search) setQuery({ search, page: undefined })
  }, 300)
})

// The URL can also change from outside (Back button): keep the input in sync.
watch(
  () => props.search,
  (search) => {
    if ((search ?? '') !== searchInput.value.trim()) searchInput.value = search ?? ''
  },
)

// Lifecycle: clean up the timer when the user leaves the page before it fired.
onBeforeUnmount(() => clearTimeout(debounceTimer))

// v-model:page on PaginationNav writes through this computed into the URL.
const currentPage = computed({
  get: () => props.page,
  set: (page: number) => setQuery({ page: page > 1 ? String(page) : undefined }),
})
</script>

<template>
  <section>
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h1 class="h3 mb-0"><i class="bi bi-music-note-list text-primary me-2"></i>Catalogue</h1>
      <!-- v-if: only rendered for the admin (the router guard protects the page itself). -->
      <RouterLink
        v-if="session.isAdmin"
        :to="{ name: 'item-create' }"
        class="btn btn-primary btn-sm"
      >
        <i class="bi bi-plus-lg me-1"></i>New item
      </RouterLink>
    </div>

    <!-- Set by the admin guard when it redirected here. -->
    <div v-if="route.query.denied" class="alert alert-warning" role="alert">
      <i class="bi bi-shield-lock me-1"></i>
      Only the admin can open <code>{{ route.query.denied }}</code
      >. Switch the user in the navbar.
    </div>

    <!-- Filters -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <div class="input-group" style="max-width: 22rem">
        <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
        <input
          v-model="searchInput"
          type="search"
          class="form-control"
          placeholder="Search title or artist"
          aria-label="Search title or artist"
        />
      </div>
      <div class="btn-group" role="group" aria-label="Filter by type">
        <button
          v-for="filter in TYPE_FILTERS"
          :key="filter.label"
          type="button"
          :class="['btn', filter.value === type ? 'btn-primary' : 'btn-outline-primary']"
          :aria-pressed="filter.value === type"
          @click="setQuery({ type: filter.value, page: undefined })"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Content: one of four states -->
    <ErrorAlert v-if="error" :error="error" retryable @retry="load" />
    <LoadingSpinner v-else-if="loading && !result" label="Loading catalogue…" />
    <p v-else-if="result && result.data.length === 0" class="text-body-secondary py-4 text-center">
      <i class="bi bi-inbox me-1"></i>No music items match your filters.
    </p>
    <template v-else-if="result">
      <p class="small text-body-secondary">
        {{ result.meta.total }} item{{ result.meta.total === 1 ? '' : 's' }}
        <span
          v-if="loading"
          class="spinner-border spinner-border-sm ms-1"
          aria-hidden="true"
        ></span>
      </p>
      <div class="row g-3 mb-4" :class="{ 'opacity-50': loading }">
        <div v-for="item in result.data" :key="item.id" class="col-sm-6 col-lg-4">
          <MusicItemCard :item="item">
            <!-- Scoped slot: the card renders this inside its footer and passes `item` back. -->
            <template #actions="{ item: cardItem }">
              <CollectionButton :music-item-id="cardItem.id" />
            </template>
          </MusicItemCard>
        </div>
      </div>
      <PaginationNav v-model:page="currentPage" :total="result.meta.total" :limit="PAGE_SIZE" />
    </template>
  </section>
</template>
