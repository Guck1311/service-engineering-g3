<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import CollectionButton from '@/components/CollectionButton.vue'
import CommentSection from '@/components/CommentSection.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MusicTypeBadge from '@/components/MusicTypeBadge.vue'
import NotFoundState from '@/components/NotFoundState.vue'
import RatingPanel from '@/components/RatingPanel.vue'
import ReactionControls from '@/components/ReactionControls.vue'
import { useAsync } from '@/composables/useAsync'
import { musicItemsService } from '@/services/music-items.service'
import { useCollectionStore } from '@/stores/collection'
import { useNotificationsStore } from '@/stores/notifications'
import { useSessionStore } from '@/stores/session'
import { formatDate, formatDuration } from '@/utils/format'

// The router passes the path parameter as a prop (see `props: idProp` in the route table).
const props = defineProps<{ id: number }>()

const router = useRouter()
const session = useSessionStore()
const collection = useCollectionStore()
const notifications = useNotificationsStore()

const { data: item, loading, error, run } = useAsync(musicItemsService.get)

// From /catalogue/6 to /catalogue/7 Vue REUSES this component and only changes
// the prop, so loading in onMounted would show the old item. watch + immediate
// covers both: the first load and every later id change.
watch(
  () => props.id,
  (id) => run(id),
  { immediate: true },
)

/** This item's entry in the current user's collection (shared store), if any. */
const entry = computed(() => collection.entryFor(props.id))

const deleting = ref(false)

async function remove() {
  const title = item.value?.title
  if (!title || !confirm(`Delete "${title}" from the catalogue?`)) return
  deleting.value = true
  try {
    await musicItemsService.remove(props.id)
    await collection.load() // the item disappears from all collections
    await router.replace({ name: 'catalogue' })
    notifications.success(`"${title}" was deleted.`)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section>
    <button type="button" class="btn btn-link px-0 mb-3" @click="router.back()">
      <i class="bi bi-arrow-left me-1"></i>Back
    </button>

    <!-- 404: the item does not exist (anymore), e.g. an old link or deleted by the admin -->
    <NotFoundState v-if="error?.isNotFound" title="Music item not found">
      There is no music item #{{ id }}. It may have been deleted.
    </NotFoundState>
    <ErrorAlert v-else-if="error" :error="error" retryable @retry="run(id)" />
    <LoadingSpinner v-else-if="loading && !item" label="Loading music item…" />

    <template v-else-if="item">
      <header class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <MusicTypeBadge :type="item.type" class="mb-2" />
          <h1 class="h2 mb-1">{{ item.title }}</h1>
          <p class="lead text-body-secondary mb-0">{{ item.artist ?? 'Various artists' }}</p>
        </div>
        <div v-if="session.isAdmin" class="d-flex gap-2">
          <RouterLink
            :to="{ name: 'item-edit', params: { id: item.id } }"
            class="btn btn-outline-primary btn-sm"
          >
            <i class="bi bi-pencil me-1"></i>Edit
          </RouterLink>
          <button
            type="button"
            class="btn btn-outline-danger btn-sm"
            :disabled="deleting"
            @click="remove"
          >
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      </header>

      <div class="row g-4">
        <div class="col-lg-7 d-flex flex-column gap-4">
          <section class="card">
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4">Genre</dt>
                <dd class="col-sm-8">{{ item.genre ?? '-' }}</dd>
                <dt class="col-sm-4">Released</dt>
                <dd class="col-sm-8">{{ item.releaseYear ?? '-' }}</dd>
                <template v-if="item.type !== 'TRACK'">
                  <dt class="col-sm-4">Tracks</dt>
                  <dd class="col-sm-8">{{ item.trackCount ?? '-' }}</dd>
                </template>
                <dt class="col-sm-4">{{ item.type === 'TRACK' ? 'Length' : 'Total length' }}</dt>
                <dd class="col-sm-8">{{ formatDuration(item.durationSeconds) }}</dd>
                <dt class="col-sm-4">Listen</dt>
                <dd class="col-sm-8">
                  <a
                    v-if="item.externalUrl"
                    :href="item.externalUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open link <i class="bi bi-box-arrow-up-right small"></i>
                  </a>
                  <span v-else>-</span>
                </dd>
                <dt class="col-sm-4">In catalogue since</dt>
                <dd class="col-sm-8 mb-0">{{ formatDate(item.createdAt) }}</dd>
              </dl>
            </div>
            <div class="card-footer bg-transparent d-flex flex-wrap align-items-center gap-2">
              <CollectionButton :music-item-id="item.id" />
              <!-- Only in the collection can an item be liked/disliked/favourited.
                   The component emits events; the store does the work. -->
              <ReactionControls
                v-if="entry"
                :reaction="entry.reaction"
                :favourite="entry.favourite"
                @react="collection.setReaction(item.id, $event)"
                @toggle-favourite="collection.toggleFavourite(item.id)"
              />
            </div>
          </section>

          <CommentSection :music-item-id="item.id" />
        </div>

        <div class="col-lg-5">
          <!-- @rated: reload the item so the average in the header data is fresh. -->
          <RatingPanel :music-item-id="item.id" @rated="run(id)" />
        </div>
      </div>
    </template>
  </section>
</template>
