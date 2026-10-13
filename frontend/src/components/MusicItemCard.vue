<script setup lang="ts">
/**
 * Card for one catalogue item in a grid. The `actions` slot lets the parent
 * add role-specific buttons (add to collection, edit, delete).
 */
import type {MusicItem} from '@/api/types';
import {formatDuration} from '@/utils/format';
import MusicTypeBadge from './MusicTypeBadge.vue';
import StarRating from './StarRating.vue';

defineProps<{item: MusicItem}>();
</script>

<template>
  <article class="card card-hover h-100">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <MusicTypeBadge :type="item.type" />
        <small class="text-body-secondary">{{ item.releaseYear }}</small>
      </div>

      <h2 class="h5 card-title mb-1">
        <RouterLink
          :to="{name: 'item', params: {id: item.id}}"
          class="stretched-link text-decoration-none text-body"
        >
          {{ item.title }}
        </RouterLink>
      </h2>
      <p class="card-subtitle text-body-secondary mb-3">
        {{ item.artist ?? 'Various artists' }}
      </p>

      <ul class="list-inline small text-body-secondary mt-auto mb-2">
        <li class="list-inline-item">
          <i class="bi bi-clock me-1" aria-hidden="true" />
          {{ formatDuration(item.durationSeconds) }}
        </li>
        <li v-if="item.type !== 'TRACK'" class="list-inline-item">
          <i class="bi bi-list-ol me-1" aria-hidden="true" />
          {{ item.trackCount }} tracks
        </li>
        <li v-if="item.genre" class="list-inline-item">
          <i class="bi bi-tag me-1" aria-hidden="true" />{{ item.genre }}
        </li>
      </ul>

      <div class="d-flex align-items-center gap-2">
        <StarRating :model-value="item.averageRating" readonly />
        <small class="text-body-secondary">({{ item.ratingCount }})</small>
      </div>
    </div>

    <!-- Above the stretched link, so the buttons stay clickable. -->
    <div v-if="$slots.actions" class="card-footer bg-transparent actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped lang="scss">
.actions {
  position: relative;
  z-index: 2;
}
</style>
