<script setup lang="ts">
/** Shown for every URL that matches no route. */
</script>

<template>
  <div class="text-center py-5">
    <p class="display-1 text-primary fw-bold mb-0">404</p>
    <h1 class="h3">Page not found</h1>
    <p class="text-body-secondary">This page does not exist.</p>
    <RouterLink :to="{name: 'catalogue'}" class="btn btn-primary">
      Back to the catalogue
    </RouterLink>
  </div>
</template>
