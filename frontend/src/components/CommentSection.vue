<script setup lang="ts">
/** Comments on an item, newest first, with a form to add one. */
import {computed, ref, watch} from 'vue';
import {useAsync} from '@/composables/useAsync';
import {commentsService} from '@/services/comments.service';
import {useNotificationsStore} from '@/stores/notifications';
import {formatDate} from '@/utils/format';
import ErrorAlert from './ErrorAlert.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import PaginationNav from './PaginationNav.vue';

const MAX_LENGTH = 2000;

const props = defineProps<{musicItemId: number}>();

const notifications = useNotificationsStore();
const page = ref(1);
const text = ref('');
const posting = ref(false);
const {data, loading, error, run} = useAsync(commentsService.list);

const trimmed = computed(() => text.value.trim());
const load = () => run(props.musicItemId, {page: page.value, limit: 5});

async function submit(): Promise<void> {
  if (!trimmed.value) return;
  posting.value = true;
  try {
    await commentsService.create(props.musicItemId, trimmed.value);
    text.value = '';
    notifications.success('Comment posted');
    page.value = 1;
    await load();
  } catch (e) {
    notifications.error(e);
  } finally {
    posting.value = false;
  }
}

watch([() => props.musicItemId, page], load, {immediate: true});
</script>

<template>
  <section class="card">
    <div class="card-body">
      <h2 class="h5 card-title">
        Comments
        <span v-if="data" class="badge text-bg-secondary">{{
          data.meta.total
        }}</span>
      </h2>

      <form class="mb-4" @submit.prevent="submit">
        <label for="comment-text" class="form-label visually-hidden">
          Your comment
        </label>
        <textarea
          id="comment-text"
          v-model="text"
          class="form-control mb-2"
          rows="3"
          :maxlength="MAX_LENGTH"
          placeholder="What do you think about it?"
        />
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-body-secondary">
            {{ text.length }} / {{ MAX_LENGTH }}
          </small>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!trimmed || posting"
          >
            <span
              v-if="posting"
              class="spinner-border spinner-border-sm me-1"
              aria-hidden="true"
            />
            Post comment
          </button>
        </div>
      </form>

      <ErrorAlert v-if="error" :error="error" retryable @retry="load" />
      <LoadingSpinner v-else-if="loading && !data" />
      <template v-else-if="data">
        <p v-if="data.data.length === 0" class="text-body-secondary mb-0">
          No comments yet. Be the first!
        </p>
        <ul class="list-unstyled mb-3">
          <li
            v-for="comment in data.data"
            :key="comment.id"
            class="border-bottom py-2"
          >
            <div class="d-flex justify-content-between">
              <strong>{{ comment.user.name }}</strong>
              <small class="text-body-secondary">
                {{ formatDate(comment.createdAt) }}
              </small>
            </div>
            <p class="mb-0 comment-text">{{ comment.text }}</p>
          </li>
        </ul>
        <PaginationNav v-model="page" :meta="data.meta" />
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
.comment-text {
  white-space: pre-line;
}
</style>
