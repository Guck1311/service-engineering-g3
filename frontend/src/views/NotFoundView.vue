<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section class="text-center py-5">
    <i class="bi bi-question-circle display-3 text-primary"></i>
    <h1 class="h3 mt-3">Page not found</h1>
    <p class="text-body-secondary">
      There is no page at <code>{{ route.fullPath }}</code
      >.
    </p>
    <RouterLink :to="{ name: 'catalogue' }" class="btn btn-primary">Go to the catalogue</RouterLink>
  </section>
</template>
