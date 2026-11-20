<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { MusicItem } from '@/api/types'
import { itemFacts } from '@/utils/format'
import MusicTypeBadge from './MusicTypeBadge.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{ item: MusicItem }>()

/**
 * Slots: the parent decides what appears in the card's footer.
 * It is a SCOPED slot: the card passes `item` back, so the parent can use it:
 *   <MusicItemCard :item="i"><template #actions="{ item }">…</template></MusicItemCard>
 */
defineSlots<{ actions?(props: { item: MusicItem }): unknown }>()

const facts = computed(() => itemFacts(props.item))
</script>

<template>
  <article class="card card-hover h-100">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <MusicTypeBadge :type="item.type" />
        <small v-if="item.ratingCount > 0" class="text-body-secondary">
          <StarRating :model-value="item.averageRating" readonly label="Average rating" />
          <span class="ms-1">{{ item.averageRating }}</span>
        </small>
      </div>

      <h2 class="h5 card-title mb-1">
        <RouterLink
          :to="{ name: 'item-detail', params: { id: item.id } }"
          class="text-decoration-none link-body-emphasis"
        >
          {{ item.title }}
        </RouterLink>
      </h2>
      <p class="card-text text-body-secondary mb-2">{{ item.artist ?? 'Various artists' }}</p>
      <p v-if="facts.length" class="card-text small text-body-secondary mb-3">
        {{ facts.join(' · ') }}
      </p>

      <div v-if="$slots.actions" class="mt-auto">
        <slot name="actions" :item="item" />
      </div>
    </div>
  </article>
</template>
