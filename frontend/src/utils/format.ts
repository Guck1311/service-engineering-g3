import type {MusicItemType} from '@/api/types';

/**
 * Formats a duration as `m:ss`, or `h:mm:ss` from one hour on.
 *
 * @param seconds - Duration in seconds.
 * @returns The formatted duration, or `–` if unknown.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '–';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Formats an ISO timestamp as a short local date.
 *
 * @param iso - Timestamp from the backend.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Display label and Bootstrap icon per music item type. */
export const TYPE_INFO: Record<MusicItemType, {label: string; icon: string}> = {
  TRACK: {label: 'Track', icon: 'bi-music-note'},
  ALBUM: {label: 'Album', icon: 'bi-disc'},
  PLAYLIST: {label: 'Playlist', icon: 'bi-music-note-list'},
};
