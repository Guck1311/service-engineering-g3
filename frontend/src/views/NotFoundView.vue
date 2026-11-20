<script setup lang="ts">
import { useRoute } from 'vue-router'
import NotFoundState from '@/components/NotFoundState.vue'

const route = useRoute()
</script>

<template>
  <NotFoundState>
    There is no page at <code>{{ route.fullPath }}</code
    >.
  </NotFoundState>
</template>
