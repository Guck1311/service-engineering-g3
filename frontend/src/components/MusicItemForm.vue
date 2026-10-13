<script setup lang="ts">
/**
 * Form to create or edit a music item, including the ordered track list of
 * albums and playlists. It only collects input and emits `submit`; the
 * parent view calls the service, so the form can be reused for both cases.
 */
import {computed, onMounted, reactive, ref} from 'vue';
import type {
  MusicItem,
  MusicItemDetail,
  MusicItemInput,
  MusicItemType,
} from '@/api/types';
import {musicItemsService} from '@/services/music-items.service';
import {useNotificationsStore} from '@/stores/notifications';
import {TYPE_INFO, formatDuration} from '@/utils/format';

const props = defineProps<{
  /** Item to edit; a new item is created if missing. */
  initial?: MusicItemDetail;
  /** Disables the form while the parent saves. */
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [input: MusicItemInput];
  cancel: [];
}>();

const notifications = useNotificationsStore();
const isEdit = computed(() => props.initial !== undefined);

/** Form fields; numbers are kept as strings so inputs can be empty. */
const form = reactive({
  type: props.initial?.type ?? ('TRACK' as MusicItemType),
  title: props.initial?.title ?? '',
  artist: props.initial?.artist ?? '',
  genre: props.initial?.genre ?? '',
  releaseYear: props.initial?.releaseYear?.toString() ?? '',
  minutes:
    props.initial?.type === 'TRACK' && props.initial.durationSeconds
      ? Math.floor(props.initial.durationSeconds / 60).toString()
      : '',
  seconds:
    props.initial?.type === 'TRACK' && props.initial.durationSeconds
      ? (props.initial.durationSeconds % 60).toString()
      : '',
  externalUrl: props.initial?.externalUrl ?? '',
});

/** Ordered track list of an album or playlist. */
const tracks = ref<MusicItem[]>(
  props.initial?.tracks.map(entry => entry.track) ?? [],
);
const availableTracks = ref<MusicItem[]>([]);
const trackToAdd = ref<number | ''>('');

const hasTracks = computed(() => form.type !== 'TRACK');
const totalDuration = computed(() =>
  tracks.value.reduce((sum, t) => sum + (t.durationSeconds ?? 0), 0),
);

onMounted(async () => {
  try {
    const page = await musicItemsService.list({type: 'TRACK', limit: 100});
    availableTracks.value = page.data;
  } catch (error) {
    notifications.error(error);
  }
});

function addTrack(): void {
  const track = availableTracks.value.find(t => t.id === trackToAdd.value);
  if (track) tracks.value.push(track);
  trackToAdd.value = '';
}

function moveTrack(index: number, offset: -1 | 1): void {
  const list = tracks.value;
  const target = index + offset;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target]!, list[index]!];
}

function removeTrack(index: number): void {
  tracks.value.splice(index, 1);
}

/** Builds the request body; empty optional fields are left out. */
function toInput(): MusicItemInput {
  const optional = (value: string) => value.trim() || undefined;
  const number = (value: string) =>
    value.trim() === '' ? undefined : Number(value);

  const input: MusicItemInput = {
    type: form.type,
    title: form.title.trim(),
    artist: optional(form.artist),
    genre: optional(form.genre),
    releaseYear: number(form.releaseYear),
    externalUrl: optional(form.externalUrl),
  };
  if (hasTracks.value) {
    input.trackIds = tracks.value.map(t => t.id);
  } else if (form.minutes !== '' || form.seconds !== '') {
    input.durationSeconds =
      (number(form.minutes) ?? 0) * 60 + (number(form.seconds) ?? 0);
  }
  return input;
}
</script>

<template>
  <form class="card" @submit.prevent="emit('submit', toInput())">
    <fieldset class="card-body" :disabled="submitting">
      <div class="mb-3">
        <span class="form-label d-block">Type</span>
        <div class="btn-group" role="group" aria-label="Type">
          <template v-for="(info, type) in TYPE_INFO" :key="type">
            <input
              :id="`type-${type}`"
              v-model="form.type"
              type="radio"
              class="btn-check"
              :value="type"
              :disabled="isEdit"
            />
            <label class="btn btn-outline-primary" :for="`type-${type}`">
              <i class="bi me-1" :class="info.icon" aria-hidden="true" />
              {{ info.label }}
            </label>
          </template>
        </div>
        <div v-if="isEdit" class="form-text">
          The type cannot be changed after creation.
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label for="title" class="form-label">Title *</label>
          <input
            id="title"
            v-model="form.title"
            class="form-control"
            required
            maxlength="200"
          />
        </div>
        <div class="col-md-6">
          <label for="artist" class="form-label">Artist</label>
          <input
            id="artist"
            v-model="form.artist"
            class="form-control"
            maxlength="200"
          />
        </div>
        <div class="col-md-4">
          <label for="genre" class="form-label">Genre</label>
          <input
            id="genre"
            v-model="form.genre"
            class="form-control"
            maxlength="100"
          />
        </div>
        <div class="col-md-4">
          <label for="year" class="form-label">Release year</label>
          <input
            id="year"
            v-model="form.releaseYear"
            type="number"
            class="form-control"
            min="1000"
            max="9999"
          />
        </div>
        <div v-if="!hasTracks" class="col-md-4">
          <span class="form-label d-block">Duration</span>
          <div class="input-group">
            <input
              v-model="form.minutes"
              type="number"
              class="form-control"
              min="0"
              aria-label="Minutes"
              placeholder="min"
            />
            <span class="input-group-text">:</span>
            <input
              v-model="form.seconds"
              type="number"
              class="form-control"
              min="0"
              max="59"
              aria-label="Seconds"
              placeholder="sec"
            />
          </div>
        </div>
        <div class="col-12">
          <label for="url" class="form-label">Link to the music</label>
          <input
            id="url"
            v-model="form.externalUrl"
            type="url"
            class="form-control"
            placeholder="https://open.spotify.com/…"
          />
        </div>
      </div>

      <div v-if="hasTracks" class="mt-4">
        <h2 class="h6">
          Tracks
          <small class="text-body-secondary fw-normal">
            ({{ tracks.length }}, {{ formatDuration(totalDuration) }})
          </small>
        </h2>
        <ol v-if="tracks.length" class="list-group list-group-numbered mb-2">
          <li
            v-for="(track, index) in tracks"
            :key="`${track.id}-${index}`"
            class="list-group-item d-flex align-items-center gap-2"
          >
            <span class="flex-grow-1">
              {{ track.title }}
              <small class="text-body-secondary">
                {{ track.artist }} · {{ formatDuration(track.durationSeconds) }}
              </small>
            </span>
            <div class="btn-group btn-group-sm">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="index === 0"
                aria-label="Move up"
                @click="moveTrack(index, -1)"
              >
                <i class="bi bi-arrow-up" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="index === tracks.length - 1"
                aria-label="Move down"
                @click="moveTrack(index, 1)"
              >
                <i class="bi bi-arrow-down" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                aria-label="Remove track"
                @click="removeTrack(index)"
              >
                <i class="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ol>
        <p v-else class="text-body-secondary">No tracks yet.</p>

        <div class="input-group">
          <select
            v-model="trackToAdd"
            class="form-select"
            aria-label="Track to add"
          >
            <option value="">Choose a track…</option>
            <option v-for="t in availableTracks" :key="t.id" :value="t.id">
              {{ t.title }} – {{ t.artist ?? 'unknown artist' }}
            </option>
          </select>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="trackToAdd === ''"
            @click="addTrack"
          >
            <i class="bi bi-plus-lg" aria-hidden="true" /> Add
          </button>
        </div>
      </div>
    </fieldset>

    <div class="card-footer d-flex justify-content-end gap-2">
      <button
        type="button"
        class="btn btn-outline-secondary"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        <span
          v-if="submitting"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ isEdit ? 'Save changes' : 'Create' }}
      </button>
    </div>
  </form>
</template>
