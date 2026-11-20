<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(defineProps<{ title?: string }>(), { title: 'Page not found' })
</script>

<template>
  <section class="text-center py-5">
    <i class="bi bi-question-circle display-3 text-primary"></i>
    <h1 class="h3 mt-3">{{ title }}</h1>
    <!-- Default slot: the page decides the explanation text. -->
    <p class="text-body-secondary"><slot /></p>
    <RouterLink :to="{ name: 'catalogue' }" class="btn btn-primary">Go to the catalogue</RouterLink>
  </section>
</template>
