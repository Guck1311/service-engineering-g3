<script setup lang="ts">
/** Small badge with icon that shows whether an item is a track, album or playlist. */
import type {MusicItemType} from '@/api/types';
import {TYPE_INFO} from '@/utils/format';

defineProps<{type: MusicItemType}>();
</script>

<template>
  <span class="badge rounded-pill" :class="`type-${type.toLowerCase()}`">
    <i class="bi me-1" :class="TYPE_INFO[type].icon" aria-hidden="true" />
    {{ TYPE_INFO[type].label }}
  </span>
</template>

<style scoped lang="scss">
// One colour per type, based on Bootstrap's CSS variables.
$types: (
  track: var(--bs-info),
  album: var(--bs-primary),
  playlist: var(--bs-success),
);

@each $name, $color in $types {
  .type-#{$name} {
    background-color: $color;
  }
}
</style>
