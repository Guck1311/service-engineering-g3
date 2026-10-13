<script setup lang="ts">
/**
 * Overview of the collections of all users or of one user, loaded page by
 * page from the backend with server-side filters.
 */
import {computed, ref, watch} from 'vue';
import type {Reaction} from '@/api/types';
import ErrorAlert from '@/components/ErrorAlert.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MusicTypeBadge from '@/components/MusicTypeBadge.vue';
import PaginationNav from '@/components/PaginationNav.vue';
import {useAsync} from '@/composables/useAsync';
import {
  collectionsService,
  type CollectionQuery,
} from '@/services/collections.service';
import {useSessionStore} from '@/stores/session';
import {formatDate} from '@/utils/format';

const PAGE_SIZE = 15;

const session = useSessionStore();
const userId = ref<number | ''>('');
const reaction = ref<Reaction | ''>('');
const favouritesOnly = ref(false);
const page = ref(1);

/** Only users with the USER role have collections. */
const collectors = computed(() =>
  session.users.filter(user => user.role === 'USER'),
);

const {data, loading, error, run} = useAsync(
  (owner: number | '', query: CollectionQuery) =>
    owner === ''
      ? collectionsService.listAll(query)
      : collectionsService.listForUser(owner, query),
);

const load = () =>
  run(userId.value, {
    reaction: reaction.value || undefined,
    favourite: favouritesOnly.value || undefined,
    page: page.value,
    limit: PAGE_SIZE,
  });

// Changing a filter starts again at page 1.
watch([userId, reaction, favouritesOnly], () => {
  if (page.value === 1) void load();
  else page.value = 1;
});
watch(page, load, {immediate: true});

const REACTION_BADGES: Record<Reaction, {class: string; icon: string}> = {
  LIKE: {class: 'text-bg-success', icon: 'bi-hand-thumbs-up-fill'},
  DISLIKE: {class: 'text-bg-danger', icon: 'bi-hand-thumbs-down-fill'},
  NONE: {class: 'text-bg-light', icon: 'bi-dash'},
};
</script>

<template>
  <div>
    <h1 class="h2 mb-1">All collections</h1>
    <p class="text-body-secondary mb-4">
      What everyone has in their collection.
    </p>

    <div class="row g-2 align-items-center mb-4">
      <div class="col-md-4">
        <select v-model="userId" class="form-select" aria-label="User">
          <option value="">All users</option>
          <option v-for="user in collectors" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <select v-model="reaction" class="form-select" aria-label="Reaction">
          <option value="">Any reaction</option>
          <option value="LIKE">Liked</option>
          <option value="DISLIKE">Disliked</option>
          <option value="NONE">Not marked</option>
        </select>
      </div>
      <div class="col-md-4">
        <div class="form-check form-switch">
          <input
            id="favourites-only"
            v-model="favouritesOnly"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="favourites-only">
            Favourites only
          </label>
        </div>
      </div>
    </div>

    <ErrorAlert v-if="error" :error="error" retryable @retry="load" />
    <LoadingSpinner v-else-if="loading && !data" />
    <template v-else-if="data">
      <div class="card mb-4" :class="{'opacity-50': loading}">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Music item</th>
                <th scope="col">Reaction</th>
                <th scope="col">Favourite</th>
                <th scope="col">Added</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.data.length === 0">
                <td colspan="5" class="text-center text-body-secondary py-4">
                  No entries match your filters.
                </td>
              </tr>
              <tr
                v-for="entry in data.data"
                :key="`${entry.user.id}-${entry.musicItem.id}`"
              >
                <td>{{ entry.user.name }}</td>
                <td>
                  <MusicTypeBadge :type="entry.musicItem.type" class="me-2" />
                  <RouterLink
                    :to="{name: 'item', params: {id: entry.musicItem.id}}"
                  >
                    {{ entry.musicItem.title }}
                  </RouterLink>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="REACTION_BADGES[entry.reaction].class"
                  >
                    <i
                      class="bi"
                      :class="REACTION_BADGES[entry.reaction].icon"
                      aria-hidden="true"
                    />
                    {{ entry.reaction.toLowerCase() }}
                  </span>
                </td>
                <td>
                  <i
                    v-if="entry.favourite"
                    class="bi bi-heart-fill text-warning"
                    aria-label="Favourite"
                  />
                </td>
                <td>{{ formatDate(entry.addedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <PaginationNav v-model="page" :meta="data.meta" />
    </template>
  </div>
</template>
