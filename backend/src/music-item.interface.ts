export type MusicItem = Track | Album | Playlist; 

export interface BaseMusicItem {
  id: number;
  title: string;
}
export interface Track extends BaseMusicItem {
  type: 'TRACK';
  artist: string;
}
export interface Album extends BaseMusicItem {
  type: 'ALBUM';
  artist: string;
  trackIds: number[];
}
export interface Playlist extends BaseMusicItem {
  type: 'PLAYLIST';
  trackIds: number[];
}
export type CreateMusicItem =
  | Omit<Track, 'id'>
  | Omit<Album, 'id'>
  | Omit<Playlist, 'id'>;