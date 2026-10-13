import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Role} from '../common/role.enum.js';

/**
 * A user of the application. Users are seeded, because registration and
 * user management are out of scope for exercise 1.
 */
@Entity()
export class User {
  /** Primary key; sent by clients in the `X-User-Id` header. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Display name. */
  @Column()
  name: string;

  /** Decides which endpoints the user may call. */
  @Column({type: 'simple-enum', enum: Role, default: Role.USER})
  role: Role;
}
