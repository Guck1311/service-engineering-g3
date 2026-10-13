<script setup lang="ts">
/**
 * One music item with its track list, the current user's marks, ratings
 * and comments. The item id comes from the route (`/items/:id`) as a prop.
 */
import {computed, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import type {CollectionEntryPatch} from '@/api/types';
import CollectionButton from '@/components/CollectionButton.vue';
import CommentSection from '@/components/CommentSection.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MusicTypeBadge from '@/components/MusicTypeBadge.vue';
import RatingPanel from '@/components/RatingPanel.vue';
import ReactionControls from '@/components/ReactionControls.vue';
import {useAsync} from '@/composables/useAsync';
import {ApiError} from '@/api/http';
import {musicItemsService} from '@/services/music-items.service';
import {useCollectionStore} from '@/stores/collection';
import {useNotificationsStore} from '@/stores/notifications';
import {useSessionStore} from '@/stores/session';
import {formatDate, formatDuration} from '@/utils/format';

const props = defineProps<{id: number}>();

const router = useRouter();
const session = useSessionStore();
const collection = useCollectionStore();
const notifications = useNotificationsStore();
const {data: item, loading, error, run} = useAsync(musicItemsService.get);
const marking = ref(false);

const entry = computed(() => collection.entryFor(props.id));
const notFound = computed(
  () => error.value instanceof ApiError && error.value.isNotFound,
);

const load = () => run(props.id);
watch(() => props.id, load, {immediate: true});

async function mark(patch: CollectionEntryPatch): Promise<void> {
  marking.value = true;
  try {
    await collection.update(props.id, patch);
  } catch (e) {
    notifications.error(e);
  } finally {
    marking.value = false;
  }
}

async function remove(): Promise<void> {
  if (!item.value) return;
  const {title} = item.value;
  if (!confirm(`Delete "${title}" from the catalogue and all collections?`)) {
    return;
  }
  try {
    await musicItemsService.remove(props.id);
    collection.forget(props.id);
    notifications.success(`Deleted "${title}"`);
    await router.push({name: 'catalogue'});
  } catch (e) {
    notifications.error(e);
  }
}
</script>

<template>
  <div>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <RouterLink :to="{name: 'catalogue'}">Catalogue</RouterLink>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ item?.title ?? 'Music item' }}
        </li>
      </ol>
    </nav>

    <div v-if="notFound" class="text-center py-5">
      <h1 class="h3">Music item not found</h1>
      <p class="text-body-secondary">It may have been deleted.</p>
      <RouterLink :to="{name: 'catalogue'}" class="btn btn-primary">
        Back to the catalogue
      </RouterLink>
    </div>
    <ErrorAlert v-else-if="error" :error="error" retryable @retry="load" />
    <LoadingSpinner v-else-if="loading && !item" />

    <div v-else-if="item" class="row g-4">
      <div class="col-lg-8 d-flex flex-column gap-4">
        <section class="card">
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <MusicTypeBadge :type="item.type" />
              <div v-if="session.isAdmin" class="d-flex gap-2">
                <RouterLink
                  :to="{name: 'item-edit', params: {id: item.id}}"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="bi bi-pencil me-1" aria-hidden="true" />Edit
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  @click="remove"
                >
                  <i class="bi bi-trash me-1" aria-hidden="true" />Delete
                </button>
              </div>
            </div>
            <h1 class="h2 mb-1">{{ item.title }}</h1>
            <p class="lead text-body-secondary">
              {{ item.artist ?? 'Various artists' }}
            </p>

            <dl class="row mb-0">
              <dt class="col-sm-3">Genre</dt>
              <dd class="col-sm-9">{{ item.genre ?? '–' }}</dd>
              <dt class="col-sm-3">Released</dt>
              <dd class="col-sm-9">{{ item.releaseYear ?? '–' }}</dd>
              <dt class="col-sm-3">Duration</dt>
              <dd class="col-sm-9">
                {{ formatDuration(item.durationSeconds) }}
              </dd>
              <dt class="col-sm-3">Added</dt>
              <dd class="col-sm-9">{{ formatDate(item.createdAt) }}</dd>
              <template v-if="item.externalUrl">
                <dt class="col-sm-3">Listen</dt>
                <dd class="col-sm-9">
                  <a :href="item.externalUrl" target="_blank" rel="noopener">
                    Open externally
                    <i
                      class="bi bi-box-arrow-up-right ms-1"
                      aria-hidden="true"
                    />
                  </a>
                </dd>
              </template>
            </dl>
          </div>

          <div
            v-if="session.isUser"
            class="card-footer bg-transparent d-flex flex-wrap align-items-center gap-3"
          >
            <CollectionButton :music-item-id="item.id" :title="item.title" />
            <ReactionControls
              v-if="entry"
              :reaction="entry.reaction"
              :favourite="entry.favourite"
              :disabled="marking"
              @change="mark"
            />
          </div>
        </section>

        <section v-if="item.type !== 'TRACK'" class="card">
          <div class="card-body">
            <h2 class="h5 card-title">Tracks ({{ item.trackCount }})</h2>
            <p v-if="item.tracks.length === 0" class="text-body-secondary mb-0">
              This {{ item.type.toLowerCase() }} has no tracks yet.
            </p>
            <table v-else class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Title</th>
                  <th scope="col">Artist</th>
                  <th scope="col" class="text-end">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in item.tracks" :key="entry.position">
                  <td>{{ entry.position }}</td>
                  <td>
                    <RouterLink
                      :to="{name: 'item', params: {id: entry.track.id}}"
                    >
                      {{ entry.track.title }}
                    </RouterLink>
                  </td>
                  <td>{{ entry.track.artist ?? '–' }}</td>
                  <td class="text-end">
                    {{ formatDuration(entry.track.durationSeconds) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <CommentSection :music-item-id="item.id" />
      </div>

      <div class="col-lg-4">
        <RatingPanel :music-item-id="item.id" @rated="load" />
      </div>
    </div>
  </div>
</template>
