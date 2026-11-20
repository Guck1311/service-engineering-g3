<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * defineModel(): the component supports `v-model` itself.
 *   <StarRating v-model="stars" />
 * is short for
 *   <StarRating :model-value="stars" @update:model-value="stars = $event" />
 * Assigning `stars.value` here emits `update:modelValue` to the parent.
 */
const stars = defineModel<number | null>({ default: null })

const props = withDefaults(
  defineProps<{
    /** Display only (e.g. the average); fractions are shown as half stars. */
    readonly?: boolean
    label?: string
  }>(),
  { readonly: false, label: 'Rating' },
)

// Local UI state: the star under the mouse pointer.
const hovered = ref<number | null>(null)
const shown = computed(() => hovered.value ?? stars.value ?? 0)

function icon(n: number): string {
  if (shown.value >= n) return 'bi-star-fill'
  if (shown.value >= n - 0.5) return 'bi-star-half'
  return 'bi-star'
}

function select(n: number) {
  if (!props.readonly) stars.value = n
}

function hover(n: number | null) {
  if (!props.readonly) hovered.value = n
}
</script>

<template>
  <span v-if="readonly" class="star-rating" role="img" :aria-label="`${label}: ${stars ?? 'none'}`">
    <i v-for="n in 5" :key="n" :class="['bi', icon(n), 'star']" aria-hidden="true"></i>
  </span>
  <span v-else class="star-rating" role="radiogroup" :aria-label="label" @mouseleave="hover(null)">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="btn btn-link p-0 star"
      role="radio"
      :aria-checked="stars === n"
      :aria-label="`${n} star${n > 1 ? 's' : ''}`"
      @mouseenter="hover(n)"
      @focus="hover(n)"
      @blur="hover(null)"
      @click="select(n)"
    >
      <i :class="['bi', icon(n)]" aria-hidden="true"></i>
    </button>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 0.15rem;
  line-height: 1;
}

.star {
  color: var(--bs-warning);
  font-size: 1.15em;
  text-decoration: none;
}
</style>
