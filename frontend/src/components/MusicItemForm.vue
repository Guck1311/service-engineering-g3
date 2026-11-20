<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { CreateMusicItem, MusicItem, MusicItemType } from '@/api/types'
import {
  formFromItem,
  toPayload,
  validateForm,
  type MusicItemFormState,
} from '@/utils/music-item-form'

const props = defineProps<{
  /** Item to edit; missing = create a new one. */
  initial?: MusicItem
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [item: CreateMusicItem]
  cancel: []
}>()

const TYPES: { value: MusicItemType; label: string; icon: string }[] = [
  { value: 'TRACK', label: 'Track', icon: 'music-note' },
  { value: 'ALBUM', label: 'Album', icon: 'disc' },
  { value: 'PLAYLIST', label: 'Playlist', icon: 'list-ul' },
]

// reactive(): one object whose properties are bound with v-model.
const form = reactive<MusicItemFormState>(formFromItem(props.initial))
// The saved state, as JSON. Must be a ref: a plain `let` variable is not reactive,
// so `isDirty` below would never notice markSaved() and stay `true`.
const pristine = ref(JSON.stringify(form))

// The item for editing may arrive after the form was created.
watch(
  () => props.initial,
  (item) => {
    Object.assign(form, formFromItem(item))
    pristine.value = JSON.stringify(form)
  },
)

const errors = computed(() => validateForm(form))
const hasErrors = computed(() => Object.keys(errors.value).length > 0)

// Show errors only after the first submit attempt, not while typing the first letters.
const submitted = ref(false)

function fieldClass(field: keyof typeof errors.value) {
  return { 'is-invalid': submitted.value && !!errors.value[field] }
}

function onSubmit() {
  submitted.value = true
  if (!hasErrors.value) emit('submit', toPayload(form))
}

/** Whether the user changed anything (used by the page to warn before leaving). */
const isDirty = computed(() => JSON.stringify(form) !== pristine.value)

/** Mark the current values as saved (no "unsaved changes" warning afterwards). */
function markSaved() {
  pristine.value = JSON.stringify(form)
}

// Normally a parent cannot see inside a <script setup> component. defineExpose
// makes these two members available through a template ref in the parent.
defineExpose({ isDirty, markSaved })
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <fieldset :disabled="submitting">
      <div class="mb-3">
        <span class="form-label d-block">Type</span>
        <div class="btn-group" role="group" aria-label="Type">
          <template v-for="t in TYPES" :key="t.value">
            <!-- v-model on radio buttons: form.type gets the value of the checked one -->
            <input
              :id="`type-${t.value}`"
              v-model="form.type"
              type="radio"
              class="btn-check"
              name="type"
              :value="t.value"
              :disabled="!!initial"
            />
            <label class="btn btn-outline-primary" :for="`type-${t.value}`">
              <i :class="['bi', `bi-${t.icon}`, 'me-1']"></i>{{ t.label }}
            </label>
          </template>
        </div>
        <div v-if="initial" class="form-text">The type of an existing item cannot change.</div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label for="title" class="form-label">Title *</label>
          <!-- v-model: two-way binding between the input and form.title -->
          <input
            id="title"
            v-model="form.title"
            class="form-control"
            :class="fieldClass('title')"
          />
          <div class="invalid-feedback">{{ errors.title }}</div>
        </div>
        <div class="col-md-6">
          <label for="artist" class="form-label">Artist</label>
          <input
            id="artist"
            v-model="form.artist"
            class="form-control"
            :class="fieldClass('artist')"
            :placeholder="form.type === 'PLAYLIST' ? 'Various artists' : ''"
          />
          <div class="invalid-feedback">{{ errors.artist }}</div>
        </div>

        <div class="col-md-4">
          <label for="genre" class="form-label">Genre</label>
          <input
            id="genre"
            v-model="form.genre"
            class="form-control"
            :class="fieldClass('genre')"
          />
          <div class="invalid-feedback">{{ errors.genre }}</div>
        </div>
        <div class="col-md-4">
          <label for="year" class="form-label">Release year</label>
          <!-- .number: the value is converted to a number ('' when empty) -->
          <input
            id="year"
            v-model.number="form.releaseYear"
            type="number"
            class="form-control"
            :class="fieldClass('releaseYear')"
            min="1000"
            max="9999"
          />
          <div class="invalid-feedback">{{ errors.releaseYear }}</div>
        </div>
        <div class="col-md-4">
          <span class="form-label d-block">
            {{ form.type === 'TRACK' ? 'Length' : 'Total length' }} (min : sec)
          </span>
          <div class="input-group has-validation">
            <input
              v-model.number="form.minutes"
              type="number"
              min="0"
              class="form-control"
              :class="fieldClass('duration')"
              aria-label="Minutes"
            />
            <span class="input-group-text">:</span>
            <input
              v-model.number="form.seconds"
              type="number"
              min="0"
              max="59"
              class="form-control"
              :class="fieldClass('duration')"
              aria-label="Seconds"
            />
            <div class="invalid-feedback">{{ errors.duration }}</div>
          </div>
        </div>

        <!-- v-if: the field only exists for albums and playlists -->
        <div v-if="form.type !== 'TRACK'" class="col-md-4">
          <label for="tracks" class="form-label">Number of tracks</label>
          <input
            id="tracks"
            v-model.number="form.trackCount"
            type="number"
            min="0"
            class="form-control"
            :class="fieldClass('trackCount')"
          />
          <div class="invalid-feedback">{{ errors.trackCount }}</div>
        </div>
        <div :class="form.type !== 'TRACK' ? 'col-md-8' : 'col-12'">
          <label for="url" class="form-label">Link (Spotify, YouTube, …)</label>
          <input
            id="url"
            v-model="form.externalUrl"
            type="url"
            class="form-control"
            :class="fieldClass('externalUrl')"
            placeholder="https://"
          />
          <div class="invalid-feedback">{{ errors.externalUrl }}</div>
        </div>
      </div>

      <div class="d-flex gap-2 mt-4">
        <button type="submit" class="btn btn-primary">
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          ></span>
          {{ initial ? 'Save changes' : 'Create item' }}
        </button>
        <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">
          Cancel
        </button>
      </div>
    </fieldset>
  </form>
</template>
