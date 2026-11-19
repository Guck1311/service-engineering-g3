<script setup lang="ts">
import type { Reaction } from '@/api/types'

/**
 * Presentational component: shows the state it gets as props and REPORTS clicks
 * as events. It does not change any data itself, so it can be used anywhere
 * (detail page, collection list) and tested without a store or backend.
 */
const props = defineProps<{
  reaction: Reaction
  favourite: boolean
  disabled?: boolean
}>()

// Typed events: the parent listens with @react="..." and @toggle-favourite="...".
const emit = defineEmits<{
  react: [reaction: Reaction]
  toggleFavourite: []
}>()

/** Clicking the active reaction again resets it to NONE. */
function toggle(reaction: Exclude<Reaction, 'NONE'>) {
  emit('react', props.reaction === reaction ? 'NONE' : reaction)
}
</script>

<template>
  <div class="btn-group btn-group-sm" role="group" aria-label="Your reaction">
    <button
      type="button"
      :class="['btn', reaction === 'LIKE' ? 'btn-success' : 'btn-outline-success']"
      :aria-pressed="reaction === 'LIKE'"
      :disabled="disabled"
      title="Like"
      @click="toggle('LIKE')"
    >
      <i :class="['bi', reaction === 'LIKE' ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up']"></i>
      <span class="visually-hidden">Like</span>
    </button>
    <button
      type="button"
      :class="['btn', reaction === 'DISLIKE' ? 'btn-secondary' : 'btn-outline-secondary']"
      :aria-pressed="reaction === 'DISLIKE'"
      :disabled="disabled"
      title="Dislike"
      @click="toggle('DISLIKE')"
    >
      <i
        :class="['bi', reaction === 'DISLIKE' ? 'bi-hand-thumbs-down-fill' : 'bi-hand-thumbs-down']"
      ></i>
      <span class="visually-hidden">Dislike</span>
    </button>
    <button
      type="button"
      :class="['btn', favourite ? 'btn-danger' : 'btn-outline-danger']"
      :aria-pressed="favourite"
      :disabled="disabled"
      title="Favourite"
      @click="emit('toggleFavourite')"
    >
      <i :class="['bi', favourite ? 'bi-heart-fill' : 'bi-heart']"></i>
      <span class="visually-hidden">Favourite</span>
    </button>
  </div>
</template>
