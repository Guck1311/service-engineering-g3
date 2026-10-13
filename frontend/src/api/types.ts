/**
 * TypeScript versions of the backend DTOs (see the Swagger UI at
 * `/api/docs`). Keeping them in one file gives every service and component
 * the same view of the API.
 */

/** Role of a user; decides which actions the UI offers. */
export type Role = 'ADMIN' | 'USER';

/** Kind of music item. */
export type MusicItemType = 'TRACK' | 'ALBUM' | 'PLAYLIST';

/** Like/dislike mark of a collection entry. */
export type Reaction = 'NONE' | 'LIKE' | 'DISLIKE';

/** A seeded user. */
export interface User {
  id: number;
  name: string;
  role: Role;
}

/** A catalogue item with computed duration and rating summary. */
export interface MusicItem {
  id: number;
  type: MusicItemType;
  title: string;
  artist: string | null;
  genre: string | null;
  releaseYear: number | null;
  durationSeconds: number | null;
  externalUrl: string | null;
  trackCount: number;
  averageRating: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One position in the track list of an album or playlist. */
export interface TrackEntry {
  position: number;
  track: MusicItem;
}

/** A music item including its ordered track list. */
export interface MusicItemDetail extends MusicItem {
  tracks: TrackEntry[];
}

/** Request body to create or replace a music item. */
export interface MusicItemInput {
  type: MusicItemType;
  title: string;
  artist?: string;
  genre?: string;
  releaseYear?: number;
  durationSeconds?: number;
  externalUrl?: string;
  trackIds?: number[];
}

/** One item in a user's collection. */
export interface CollectionEntry {
  user: User;
  musicItem: MusicItem;
  reaction: Reaction;
  favourite: boolean;
  addedAt: string;
}

/** Fields that can be changed on a collection entry. */
export interface CollectionEntryPatch {
  reaction?: Reaction;
  favourite?: boolean;
}

/** A comment including its author. */
export interface Comment {
  id: number;
  musicItemId: number;
  user: User;
  text: string;
  createdAt: string;
}

/** One user's rating. */
export interface Rating {
  musicItemId: number;
  user: User;
  stars: number;
  updatedAt: string;
}

/** Average, count and all ratings of an item. */
export interface RatingSummary {
  average: number | null;
  count: number;
  ratings: Rating[];
}

/** Pagination details of a list response. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

/** Envelope of every paginated list response. */
export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

/** Pagination query parameters. */
export interface PageQuery {
  page?: number;
  limit?: number;
}

/** Error body that the backend returns for every failed request. */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}
