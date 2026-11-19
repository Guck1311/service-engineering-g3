<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Comment } from '@/api/types'
import { useAsync } from '@/composables/useAsync'
import { commentsService } from '@/services/comments.service'
import { useNotificationsStore } from '@/stores/notifications'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/format'
import ErrorAlert from './ErrorAlert.vue'

const props = defineProps<{ musicItemId: number }>()

const PAGE_SIZE = 10
const MAX_LENGTH = 2000 // same limit as the backend's CreateCommentDto

const session = useSessionStore()
const notifications = useNotificationsStore()

const comments = ref<Comment[]>([])
const total = ref(0)
const page = ref(1)
const { loading, error, run } = useAsync(commentsService.list)

async function loadFirstPage() {
  const result = await run(props.musicItemId, { page: 1, limit: PAGE_SIZE })
  if (result) {
    comments.value = result.data
    total.value = result.meta.total
    page.value = 1
  }
}

/** "Load more" appends the next page instead of replacing the list. */
async function loadMore() {
  const result = await run(props.musicItemId, { page: page.value + 1, limit: PAGE_SIZE })
  if (result) {
    comments.value = [...comments.value, ...result.data]
    total.value = result.meta.total
    page.value++
  }
}

watch(() => props.musicItemId, loadFirstPage, { immediate: true })

// --- New comment form ---
const text = ref('')
const posting = ref(false)
const canPost = computed(() => text.value.trim().length > 0 && text.value.length <= MAX_LENGTH)

async function submit() {
  if (!canPost.value) return
  posting.value = true
  try {
    const comment = await commentsService.create(props.musicItemId, text.value.trim())
    comments.value = [comment, ...comments.value] // newest first, like the API
    total.value++
    text.value = ''
    notifications.success('Comment posted.')
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <section class="card">
    <div class="card-body">
      <h2 class="h5 card-title">
        <i class="bi bi-chat-left-text me-2"></i>Comments
        <span class="badge text-bg-secondary ms-1">{{ total }}</span>
      </h2>

      <!-- .prevent: calls event.preventDefault(), so the form does not reload the page -->
      <form class="mb-3" @submit.prevent="submit">
        <label for="comment-text" class="visually-hidden">Your comment</label>
        <textarea
          id="comment-text"
          v-model="text"
          class="form-control mb-2"
          rows="2"
          :maxlength="MAX_LENGTH"
          :placeholder="`Comment as ${session.currentUser?.name ?? '…'}`"
        ></textarea>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-body-secondary">{{ text.length }} / {{ MAX_LENGTH }}</small>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="!canPost || posting">
            <span
              v-if="posting"
              class="spinner-border spinner-border-sm me-1"
              aria-hidden="true"
            ></span>
            Post comment
          </button>
        </div>
      </form>

      <ErrorAlert v-if="error" :error="error" retryable @retry="loadFirstPage" />

      <p v-if="!loading && !error && comments.length === 0" class="text-body-secondary mb-0">
        No comments yet. Be the first!
      </p>

      <ul class="list-unstyled mb-0">
        <li v-for="comment in comments" :key="comment.id" class="border-top py-2">
          <div class="d-flex justify-content-between small text-body-secondary">
            <strong class="text-body">{{ comment.user.name }}</strong>
            <time :datetime="comment.createdAt">{{ formatDateTime(comment.createdAt) }}</time>
          </div>
          <!-- Text interpolation is HTML-escaped: user input cannot inject markup (XSS). -->
          <p class="mb-0" style="white-space: pre-line">{{ comment.text }}</p>
        </li>
      </ul>

      <button
        v-if="comments.length < total"
        type="button"
        class="btn btn-link btn-sm px-0"
        :disabled="loading"
        @click="loadMore"
      >
        Load more ({{ total - comments.length }} left)
      </button>
    </div>
  </section>
</template>
