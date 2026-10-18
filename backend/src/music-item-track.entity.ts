import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { MusicItemEntity } from './music-item.entity.js';

@Entity('music_item_tracks')
@Unique(['containerId', 'position'])
export class MusicItemTrackEntity {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  containerId!: number;

  @Column()
  trackId!: number;

  @Column()
  position!: number;

  @ManyToOne(() => MusicItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'containerId' })
  container!: MusicItemEntity;

  @ManyToOne(() => MusicItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trackId' })
  track!: MusicItemEntity;
}