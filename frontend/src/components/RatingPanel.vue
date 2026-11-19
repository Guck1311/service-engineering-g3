<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAsync } from '@/composables/useAsync'
import { ratingsService } from '@/services/ratings.service'
import { useNotificationsStore } from '@/stores/notifications'
import { useSessionStore } from '@/stores/session'
import ErrorAlert from './ErrorAlert.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{ musicItemId: number }>()

/** Tells the parent that the average changed (the detail page reloads the item). */
const emit = defineEmits<{ rated: [] }>()

const session = useSessionStore()
const notifications = useNotificationsStore()
const { data: summary, error, run } = useAsync(ratingsService.summary)

// Load now and again when the parent shows another item.
watch(
  () => props.musicItemId,
  (id) => run(id),
  { immediate: true },
)

/** The current user's own rating; changes when another user is selected. */
const myStars = computed(
  () => summary.value?.ratings.find((r) => r.user.id === session.currentUserId)?.stars ?? null,
)

const saving = ref(false)

async function rate(stars: number | null) {
  if (stars === null) return
  saving.value = true
  try {
    await ratingsService.rate(props.musicItemId, session.currentUserId, stars)
    await run(props.musicItemId)
    emit('rated')
    notifications.success(`You rated this item ${stars} star${stars === 1 ? '' : 's'}.`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="card">
    <div class="card-body">
      <h2 class="h5 card-title"><i class="bi bi-star me-2"></i>Ratings</h2>
      <ErrorAlert v-if="error" :error="error" retryable @retry="run(musicItemId)" />
      <template v-else-if="summary">
        <p class="mb-3">
          <StarRating :model-value="summary.average" readonly label="Average rating" />
          <span class="ms-2">
            <strong>{{ summary.average ?? '-' }}</strong>
            <span class="text-body-secondary">
              ({{ summary.count }} rating{{ summary.count === 1 ? '' : 's' }})</span
            >
          </span>
        </p>

        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="text-body-secondary small">Your rating:</span>
          <!-- v-model split into its two halves: show myStars, save on change. -->
          <StarRating
            :model-value="myStars"
            label="Your rating"
            :class="{ 'opacity-50 pe-none': saving }"
            @update:model-value="rate"
          />
        </div>

        <ul v-if="summary.ratings.length" class="list-unstyled small mb-0">
          <li v-for="rating in summary.ratings" :key="rating.user.id">
            <StarRating
              :model-value="rating.stars"
              readonly
              :label="`${rating.user.name}'s rating`"
            />
            <span class="ms-2">{{ rating.user.name }}</span>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>
