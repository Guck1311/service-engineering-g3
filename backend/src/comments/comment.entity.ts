import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import {MusicItem} from '../music-items/music-item.entity.js';
import {User} from '../users/user.entity.js';

/** A user's comment on a music item. */
@Entity()
export class Comment {
  /** Primary key. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Author of the comment. */
  @Column()
  userId: number;

  /** The commented item. */
  @Column()
  musicItemId: number;

  /** Comment text, up to 2000 characters. */
  @Column({type: 'text'})
  text: string;

  /** When the comment was written. */
  @CreateDateColumn()
  createdAt: Date;

  /** Author; deleting the user removes their comments. */
  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: Relation<User>;

  /** The commented item; deleting the item removes its comments. */
  @ManyToOne(() => MusicItem, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'musicItemId'})
  musicItem: Relation<MusicItem>;
}
