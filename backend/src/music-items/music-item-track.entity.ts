import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import {MusicItem} from './music-item.entity.js';

/**
 * Position of a track inside an album or playlist.
 *
 * The composite primary key (`containerId`, `position`) keeps the order;
 * the same track may appear at several positions. Deleting the album,
 * playlist or track removes the row (`ON DELETE CASCADE`).
 */
@Entity()
export class MusicItemTrack {
  /** Id of the album or playlist. */
  @PrimaryColumn()
  containerId: number;

  /** 1-based position in the track list. */
  @PrimaryColumn()
  position: number;

  /** Id of the track at this position. */
  @Column()
  trackId: number;

  /** The album or playlist that contains the track. */
  @ManyToOne(() => MusicItem, item => item.tracks, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'containerId'})
  container: Relation<MusicItem>;

  /** The track at this position. */
  @ManyToOne(() => MusicItem, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'trackId'})
  track: Relation<MusicItem>;
}
