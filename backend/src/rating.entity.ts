import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { UserEntity } from './user.entity.js';
import { MusicItemEntity } from './music-item.entity.js';

@Entity('ratings')
export class RatingEntity {

  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  musicItemId!: number;

  @Column()
  stars!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => MusicItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'musicItemId' })
  musicItem!: MusicItemEntity;
}