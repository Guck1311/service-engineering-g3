import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import {MusicItem} from '../music-items/music-item.entity.js';
import {User} from '../users/user.entity.js';

/** A user's like or dislike of an item; independent of the favourite flag. */
export enum Reaction {
  /** Not marked yet (default). */
  NONE = 'NONE',
  /** The user likes the item. */
  LIKE = 'LIKE',
  /** The user dislikes the item; cannot be combined with favourite. */
  DISLIKE = 'DISLIKE',
}

/**
 * A catalogue item in one user's personal collection.
 * Each item can be in a user's collection only once.
 */
@Entity()
@Unique(['userId', 'musicItemId'])
export class CollectionEntry {
  /** Primary key; internal only, the API addresses entries by music item id. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Owner of the collection. */
  @Column()
  userId: number;

  /** The collected catalogue item. */
  @Column()
  musicItemId: number;

  /** Like, dislike or none. */
  @Column({type: 'simple-enum', enum: Reaction, default: Reaction.NONE})
  reaction: Reaction;

  /** Whether the user marked the item as a favourite. */
  @Column({default: false})
  favourite: boolean;

  /** When the item was added to the collection. */
  @CreateDateColumn()
  addedAt: Date;

  /** Owner of the collection; deleting the user removes the entry. */
  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: Relation<User>;

  /** The collected item; deleting the item removes the entry. */
  @ManyToOne(() => MusicItem, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'musicItemId'})
  musicItem: Relation<MusicItem>;
}
