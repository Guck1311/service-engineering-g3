import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { UserEntity } from './user.entity.js';
import { MusicItemEntity } from './music-item.entity.js';

@Entity('comments')
export class CommentEntity {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  musicItemId!: number;

  @Column({ type: 'text' })
  text!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => MusicItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'musicItemId' })
  musicItem!: MusicItemEntity;
}