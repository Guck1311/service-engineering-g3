import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

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
 * table; albums and playlists store their track count and total duration.
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

  /** Length of a track, or total length of an album or playlist, in seconds; set by the admin. */
  @Column({type: 'integer', nullable: true})
  durationSeconds: number | null;

  /** Link to the actual music, e.g. on Spotify or YouTube. */
  @Column({type: 'varchar', nullable: true})
  externalUrl: string | null;

  /** Number of tracks of an album or playlist; null for a track or if unknown. */
  @Column({type: 'integer', nullable: true})
  trackCount: number | null;

  /** Set by the database when the item is created. */
  @CreateDateColumn()
  createdAt: Date;

  /** Set by the database on every update. */
  @UpdateDateColumn()
  updatedAt: Date;
  
  /** Tracks of an album or playlist; empty for a track. */
  @ManyToMany(() => MusicItem, item => item.containers)
  @JoinTable({
    name: 'music_item_track',
    joinColumn: {name: 'containerId'},
    inverseJoinColumn: {name: 'trackId'},
  })
  tracks: Relation<MusicItem[]>;

  /** Albums and playlists that contain this track. */
  @ManyToMany(() => MusicItem, item => item.tracks)
  containers: Relation<MusicItem[]>;
}
