<script setup lang="ts">
/**
 * Five stars to show or pick a rating.
 *
 * Read-only mode shows a (possibly fractional) average; editable mode works
 * with `v-model` and emits the chosen number of stars.
 */
import {computed, ref} from 'vue';

const props = withDefaults(
  defineProps<{
    /** Shown value; may be fractional in read-only mode. */
    modelValue: number | null;
    /** Disables picking. */
    readonly?: boolean;
    /** Bootstrap font-size class, e.g. `fs-5`. */
    size?: string;
  }>(),
  {readonly: false, size: ''},
);

const emit = defineEmits<{
  /** A star was picked (editable mode only). */
  'update:modelValue': [stars: number];
}>();

/** Star under the mouse pointer, to preview the rating before clicking. */
const hovered = ref<number | null>(null);
const shown = computed(() => hovered.value ?? props.modelValue ?? 0);

/** Bootstrap icon class for star 1 to 5: full, half or empty. */
function iconFor(star: number): string {
  if (shown.value >= star) return 'bi-star-fill';
  if (shown.value >= star - 0.5) return 'bi-star-half';
  return 'bi-star';
}

function pick(star: number): void {
  if (!props.readonly) emit('update:modelValue', star);
}
</script>

<template>
  <span
    class="star-rating"
    :class="[size, {editable: !readonly}]"
    :role="readonly ? 'img' : 'radiogroup'"
    :aria-label="
      readonly ? `${modelValue ?? 0} of 5 stars` : 'Rate from 1 to 5 stars'
    "
    @mouseleave="hovered = null"
  >
    <template v-for="star in 5" :key="star">
      <i v-if="readonly" class="bi" :class="iconFor(star)" aria-hidden="true" />
      <button
        v-else
        type="button"
        class="btn btn-link p-0 border-0"
        role="radio"
        :aria-checked="modelValue === star"
        :aria-label="`${star} star${star > 1 ? 's' : ''}`"
        @mouseenter="hovered = star"
        @click="pick(star)"
      >
        <i class="bi" :class="iconFor(star)" aria-hidden="true" />
      </button>
    </template>
  </span>
</template>

<style scoped lang="scss">
.star-rating {
  color: var(--bs-warning);
  white-space: nowrap;

  .btn {
    color: inherit;
    font-size: inherit;
    line-height: 1;
  }

  &.editable .btn:hover {
    transform: scale(1.15);
  }
}
</style>
