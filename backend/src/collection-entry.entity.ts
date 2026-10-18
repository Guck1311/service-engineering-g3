import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { UserEntity } from './user.entity.js';
import { MusicItemEntity } from './music-item.entity.js';

@Entity('collection_entries')
@Unique(['userId', 'musicItemId'])
export class CollectionEntryEntity {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  musicItemId!: number;

  @Column({ type: 'text', default: 'NONE' })
  reaction!: 'NONE' | 'LIKE' | 'DISLIKE';

  @Column({ default: false })
  favourite!: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => MusicItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'musicItemId' })
  musicItem!: MusicItemEntity;

}