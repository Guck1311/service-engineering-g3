<script setup lang="ts">
import { RouterLink } from 'vue-router'

// Placeholder data; loaded from the backend in step 7.
const items = [
  { id: 1, type: 'TRACK', title: 'Come Together', artist: 'The Beatles' },
  { id: 6, type: 'ALBUM', title: 'Abbey Road', artist: 'The Beatles' },
  { id: 7, type: 'PLAYLIST', title: 'Road Trip', artist: null },
]
</script>

<template>
  <section>
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h3 mb-0"><i class="bi bi-music-note-list text-primary me-2"></i>Catalogue</h1>
      <!-- Navigation by route NAME: the path can change without touching this link. -->
      <RouterLink :to="{ name: 'item-create' }" class="btn btn-primary btn-sm">
        <i class="bi bi-plus-lg me-1"></i>New item
      </RouterLink>
    </div>

    <div class="row g-3">
      <div v-for="item in items" :key="item.id" class="col-sm-6 col-lg-4">
        <div class="card card-hover h-100">
          <div class="card-body">
            <span class="badge text-bg-primary mb-2">{{ item.type }}</span>
            <h2 class="h5 card-title mb-1">
              <!-- Named route with a parameter -> /catalogue/6 -->
              <RouterLink
                :to="{ name: 'item-detail', params: { id: item.id } }"
                class="stretched-link text-decoration-none"
              >
                {{ item.title }}
              </RouterLink>
            </h2>
            <p class="card-text text-body-secondary">{{ item.artist ?? 'Various artists' }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
