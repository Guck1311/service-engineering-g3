<script setup lang="ts">
import { computed } from 'vue'

/** Named v-model: used as <PaginationNav v-model:page="page" :total="..." :limit="..." /> */
const page = defineModel<number>('page', { required: true })

const props = defineProps<{ total: number; limit: number }>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))

function go(target: number) {
  if (target >= 1 && target <= pageCount.value && target !== page.value) page.value = target
}
</script>

<template>
  <nav v-if="pageCount > 1" aria-label="Pages">
    <ul class="pagination justify-content-center mb-0">
      <li :class="['page-item', { disabled: page <= 1 }]">
        <button type="button" class="page-link" aria-label="Previous page" @click="go(page - 1)">
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
      </li>
      <li v-for="n in pageCount" :key="n" :class="['page-item', { active: n === page }]">
        <button
          type="button"
          class="page-link"
          :aria-current="n === page ? 'page' : undefined"
          @click="go(n)"
        >
          {{ n }}
        </button>
      </li>
      <li :class="['page-item', { disabled: page >= pageCount }]">
        <button type="button" class="page-link" aria-label="Next page" @click="go(page + 1)">
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </li>
    </ul>
  </nav>
</template>
