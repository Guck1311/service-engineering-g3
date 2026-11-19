<script setup lang="ts">
import { computed } from 'vue'
import type { MusicItemType } from '@/api/types'

// Props: input from the parent, read-only inside the component.
const props = defineProps<{ type: MusicItemType }>()

const STYLES: Record<MusicItemType, { label: string; icon: string; variant: string }> = {
  TRACK: { label: 'Track', icon: 'music-note', variant: 'info' },
  ALBUM: { label: 'Album', icon: 'disc', variant: 'primary' },
  PLAYLIST: { label: 'Playlist', icon: 'list-ul', variant: 'success' },
}

// Derived from the prop; recomputed when the parent passes another type.
const style = computed(() => STYLES[props.type])
</script>

<template>
  <span :class="['badge', `text-bg-${style.variant}`]">
    <i :class="['bi', `bi-${style.icon}`, 'me-1']" aria-hidden="true"></i>{{ style.label }}
  </span>
</template>
