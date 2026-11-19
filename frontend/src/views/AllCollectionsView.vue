<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Reaction } from '@/api/types'
import ErrorAlert from '@/components/ErrorAlert.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MusicTypeBadge from '@/components/MusicTypeBadge.vue'
import PaginationNav from '@/components/PaginationNav.vue'
import { useAsync } from '@/composables/useAsync'
import { collectionsService } from '@/services/collections.service'
import { useSessionStore } from '@/stores/session'
import { formatDate } from '@/utils/format'

// `?userId=2` arrives as a prop (see the route table); undefined = all users.
const props = defineProps<{ userId?: number }>()

const PAGE_SIZE = 20
const REACTION_ICONS: Record<Reaction, string | null> = {
  NONE: null,
  LIKE: 'bi-hand-thumbs-up-fill text-success',
  DISLIKE: 'bi-hand-thumbs-down-fill text-secondary',
}

const router = useRouter()
const session = useSessionStore()
const users = computed(() => session.users)
const selectedUser = computed(() => users.value.find((u) => u.id === props.userId))

// One composable, two possible service calls.
const {
  data: result,
  loading,
  error,
  run,
} = useAsync((userId: number | undefined, page: number) =>
  userId === undefined
    ? collectionsService.listAll({ page, limit: PAGE_SIZE })
    : collectionsService.listOfUser(userId, { page, limit: PAGE_SIZE }),
)

const page = ref(1)

function load() {
  return run(props.userId, page.value)
}

// Another user selected: start again at page 1 (the page watcher below does not
// fire if the page was already 1, so load explicitly).
watch(
  () => props.userId,
  () => {
    page.value = 1
    void load()
  },
  { immediate: true },
)
watch(page, load)

/** The filter is written into the URL (bookmarkable, Back restores it). */
function onFilterChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  void router.replace({ query: value ? { userId: value } : {} })
}
</script>

<template>
  <section>
    <h1 class="h3 mb-3"><i class="bi bi-people text-primary me-2"></i>All collections</h1>

    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <label class="form-label mb-0" for="user-filter">Show collection of</label>
      <select
        id="user-filter"
        class="form-select"
        style="max-width: 14rem"
        :value="props.userId ?? ''"
        @change="onFilterChange"
      >
        <option value="">All users</option>
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
    </div>

    <ErrorAlert v-if="error" :error="error" retryable @retry="load" />
    <LoadingSpinner v-else-if="loading && !result" />
    <p v-else-if="result && result.meta.total === 0" class="text-body-secondary">
      {{ selectedUser ? `${selectedUser.name}'s collection is empty.` : 'No collections yet.' }}
    </p>

    <template v-else-if="result">
      <div class="table-responsive mb-3" :class="{ 'opacity-50': loading }">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th v-if="!userId" scope="col">User</th>
              <th scope="col">Music item</th>
              <th scope="col">Type</th>
              <th scope="col" class="text-center">Reaction</th>
              <th scope="col">Added</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in result.data" :key="`${entry.user.id}-${entry.musicItem.id}`">
              <td v-if="!userId">
                <RouterLink
                  :to="{ query: { userId: entry.user.id } }"
                  class="text-decoration-none"
                  :title="`Show only ${entry.user.name}`"
                >
                  {{ entry.user.name }}
                </RouterLink>
              </td>
              <td>
                <RouterLink
                  :to="{ name: 'item-detail', params: { id: entry.musicItem.id } }"
                  class="text-decoration-none"
                >
                  {{ entry.musicItem.title }}
                </RouterLink>
                <div class="small text-body-secondary">
                  {{ entry.musicItem.artist ?? 'Various artists' }}
                </div>
              </td>
              <td><MusicTypeBadge :type="entry.musicItem.type" /></td>
              <td class="text-center">
                <i
                  v-if="REACTION_ICONS[entry.reaction]"
                  :class="['bi', REACTION_ICONS[entry.reaction]]"
                ></i>
                <i v-if="entry.favourite" class="bi bi-heart-fill text-danger ms-1"></i>
              </td>
              <td class="small">{{ formatDate(entry.addedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationNav v-model:page="page" :total="result.meta.total" :limit="PAGE_SIZE" />
    </template>
  </section>
</template>
