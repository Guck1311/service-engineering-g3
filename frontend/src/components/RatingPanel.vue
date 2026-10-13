<script setup lang="ts">
/**
 * Average rating of an item plus the current user's own rating, which can
 * be set by clicking a star.
 */
import {computed, ref, watch} from 'vue';
import {useAsync} from '@/composables/useAsync';
import {ratingsService} from '@/services/ratings.service';
import {useNotificationsStore} from '@/stores/notifications';
import {useSessionStore} from '@/stores/session';
import ErrorAlert from './ErrorAlert.vue';
import StarRating from './StarRating.vue';

const props = defineProps<{musicItemId: number}>();
const emit = defineEmits<{
  /** The user's rating was saved; the parent may refresh the averages. */
  rated: [];
}>();

const session = useSessionStore();
const notifications = useNotificationsStore();
const {data: summary, error, run: load} = useAsync(ratingsService.get);
const saving = ref(false);

const ownStars = computed(
  () =>
    summary.value?.ratings.find(r => r.user.id === session.currentUserId)
      ?.stars ?? null,
);

async function rate(stars: number): Promise<void> {
  if (session.currentUserId === null) return;
  saving.value = true;
  try {
    await ratingsService.rate(props.musicItemId, session.currentUserId, stars);
    notifications.success(`Rated ${stars} of 5 stars`);
    await load(props.musicItemId);
    emit('rated');
  } catch (e) {
    notifications.error(e);
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.musicItemId,
  id => load(id),
  {immediate: true},
);
</script>

<template>
  <section class="card">
    <div class="card-body">
      <h2 class="h5 card-title">Ratings</h2>
      <ErrorAlert
        v-if="error"
        :error="error"
        retryable
        @retry="load(musicItemId)"
      />
      <template v-else-if="summary">
        <div class="d-flex align-items-baseline gap-2 mb-3">
          <span class="display-6">{{ summary.average ?? '–' }}</span>
          <StarRating :model-value="summary.average" readonly size="fs-5" />
          <span class="text-body-secondary">{{ summary.count }} ratings</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span>Your rating:</span>
          <StarRating
            :model-value="ownStars"
            :readonly="saving"
            size="fs-4"
            @update:model-value="rate"
          />
        </div>
      </template>
    </div>
  </section>
</template>
