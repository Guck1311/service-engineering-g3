<script setup lang="ts">
/**
 * Like / dislike / favourite buttons for a collection entry.
 *
 * Clicking the active reaction resets it to `NONE`. Favourite is disabled
 * while the item is disliked, and disliking a favourite also removes the
 * favourite, matching the backend rule that rejects DISLIKE + favourite.
 */
import type {CollectionEntryPatch, Reaction} from '@/api/types';

const props = defineProps<{
  reaction: Reaction;
  favourite: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** The user changed the marks; the parent saves them. */
  change: [patch: CollectionEntryPatch];
}>();

function toggleReaction(reaction: Exclude<Reaction, 'NONE'>): void {
  const next = props.reaction === reaction ? 'NONE' : reaction;
  emit(
    'change',
    next === 'DISLIKE' && props.favourite
      ? {reaction: next, favourite: false}
      : {reaction: next},
  );
}

function toggleFavourite(): void {
  emit('change', {favourite: !props.favourite});
}
</script>

<template>
  <div class="btn-group btn-group-sm" role="group" aria-label="Mark item">
    <button
      type="button"
      class="btn"
      :class="reaction === 'LIKE' ? 'btn-success' : 'btn-outline-success'"
      :aria-pressed="reaction === 'LIKE'"
      :disabled="disabled"
      title="Like"
      @click="toggleReaction('LIKE')"
    >
      <i class="bi bi-hand-thumbs-up" aria-hidden="true" />
      <span class="visually-hidden">Like</span>
    </button>
    <button
      type="button"
      class="btn"
      :class="reaction === 'DISLIKE' ? 'btn-danger' : 'btn-outline-danger'"
      :aria-pressed="reaction === 'DISLIKE'"
      :disabled="disabled"
      title="Dislike"
      @click="toggleReaction('DISLIKE')"
    >
      <i class="bi bi-hand-thumbs-down" aria-hidden="true" />
      <span class="visually-hidden">Dislike</span>
    </button>
    <button
      type="button"
      class="btn"
      :class="favourite ? 'btn-warning' : 'btn-outline-warning'"
      :aria-pressed="favourite"
      :disabled="disabled || reaction === 'DISLIKE'"
      :title="
        reaction === 'DISLIKE'
          ? 'Disliked items cannot be favourites'
          : 'Favourite'
      "
      @click="toggleFavourite"
    >
      <i
        class="bi"
        :class="favourite ? 'bi-heart-fill' : 'bi-heart'"
        aria-hidden="true"
      />
      <span class="visually-hidden">Favourite</span>
    </button>
  </div>
</template>
