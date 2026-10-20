import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import {MusicItemTrack} from './music-item-track.entity.js';

/** Kind of music item. */
export enum MusicItemType {
  /** A single song. */
  TRACK = 'TRACK',
  /** An ordered list of tracks released together. */
  ALBUM = 'ALBUM',
  /** An ordered list of tracks of arbitrary length. */
  PLAYLIST = 'PLAYLIST',
}

/**
 * One entry of the shared catalogue. Tracks, albums and playlists share a
 * table; albums and playlists list their tracks via {@link MusicItemTrack}.
 * Only metadata is stored: `externalUrl` references the actual audio.
 */
@Entity()
export class MusicItem {
  /** Primary key. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Track, album or playlist; cannot change after creation. */
  @Column({type: 'simple-enum', enum: MusicItemType})
  type: MusicItemType;

  /** Title of the song, album or playlist. */
  @Column()
  title: string;

  /** Performing artist, if known. */
  @Column({type: 'varchar', nullable: true})
  artist: string | null;

  /** Genre, if known. */
  @Column({type: 'varchar', nullable: true})
  genre: string | null;

  /** Year of release, if known. */
  @Column({type: 'integer', nullable: true})
  releaseYear: number | null;

  /** Set for tracks only; computed from the tracks for albums and playlists. */
  @Column({type: 'integer', nullable: true})
  durationSeconds: number | null;

  /** Link to the actual music, e.g. on Spotify or YouTube. */
  @Column({type: 'varchar', nullable: true})
  externalUrl: string | null;

  /** Ordered track list of an album or playlist (empty for tracks). */
  @OneToMany(() => MusicItemTrack, entry => entry.container)
  tracks: Relation<MusicItemTrack[]>;

  /** Set by the database when the item is created. */
  @CreateDateColumn()
  createdAt: Date;

  /** Set by the database on every update. */
  @UpdateDateColumn()
  updatedAt: Date;
}
