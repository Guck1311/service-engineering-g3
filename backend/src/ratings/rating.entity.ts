import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import {MusicItem} from '../music-items/music-item.entity.js';
import {User} from '../users/user.entity.js';

/**
 * A 1-5 star rating of a music item. The composite primary key
 * (`userId`, `musicItemId`) allows one rating per user and item.
 */
@Entity()
export class Rating {
  /** The user who rated. */
  @PrimaryColumn()
  userId: number;

  /** The rated item. */
  @PrimaryColumn()
  musicItemId: number;

  /** Number of stars, 1 to 5. */
  @Column({type: 'integer'})
  stars: number;

  /** When the rating was last set. */
  @UpdateDateColumn()
  updatedAt: Date;

  /** The user who rated; deleting the user removes their ratings. */
  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: Relation<User>;

  /** The rated item; deleting the item removes its ratings. */
  @ManyToOne(() => MusicItem, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'musicItemId'})
  musicItem: Relation<MusicItem>;
}
