<script setup lang="ts">
/** Bootstrap pagination for a paginated list; `v-model` is the page number. */
import {computed} from 'vue';
import type {PageMeta} from '@/api/types';

const props = defineProps<{meta: PageMeta}>();
const page = defineModel<number>({required: true});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.meta.total / props.meta.limit)),
);
const pages = computed(() =>
  Array.from({length: pageCount.value}, (_, i) => i + 1),
);
</script>

<template>
  <nav v-if="pageCount > 1" aria-label="Pages">
    <ul class="pagination justify-content-center mb-0">
      <li class="page-item" :class="{disabled: page <= 1}">
        <button type="button" class="page-link" @click="page = page - 1">
          <i class="bi bi-chevron-left" aria-hidden="true" />
          <span class="visually-hidden">Previous</span>
        </button>
      </li>
      <li
        v-for="number in pages"
        :key="number"
        class="page-item"
        :class="{active: number === page}"
      >
        <button type="button" class="page-link" @click="page = number">
          {{ number }}
        </button>
      </li>
      <li class="page-item" :class="{disabled: page >= pageCount}">
        <button type="button" class="page-link" @click="page = page + 1">
          <i class="bi bi-chevron-right" aria-hidden="true" />
          <span class="visually-hidden">Next</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
