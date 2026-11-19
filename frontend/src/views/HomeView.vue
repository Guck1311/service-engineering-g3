<script setup lang="ts">
// Temporary start page to check the theme. Replaced by the catalogue in step 7.
const swatches = ['primary', 'secondary', 'success', 'danger', 'warning', 'info']
</script>

<template>
  <section>
    <h1 class="h3 mb-3"><i class="bi bi-music-note-beamed text-primary me-2"></i>Catalogue</h1>
    <p class="text-body-secondary">
      Bootstrap is themed via SCSS variables; icons come from bootstrap-icons.
    </p>

    <div class="card card-hover mb-4" style="max-width: 24rem">
      <div class="card-body">
        <span class="badge text-bg-primary mb-2">ALBUM</span>
        <h2 class="h5 card-title mb-1">Abbey Road</h2>
        <p class="card-text text-body-secondary mb-3">The Beatles · 1969 · 17 tracks</p>
        <button type="button" class="btn btn-primary btn-sm me-2">
          <i class="bi bi-plus-lg me-1"></i>Add to collection
        </button>
        <button type="button" class="btn btn-outline-danger btn-sm" aria-label="Favourite">
          <i class="bi bi-heart"></i>
        </button>
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2">
      <button v-for="color in swatches" :key="color" type="button" :class="`btn btn-${color}`">
        {{ color }}
      </button>
    </div>
  </section>
</template>
