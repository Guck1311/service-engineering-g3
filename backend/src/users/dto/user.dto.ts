import {ApiProperty} from '@nestjs/swagger';
import {Role} from '../../common/role.enum.js';
import type {User} from '../user.entity.js';

/** Public view of a user, also nested in collection entries, comments and ratings. */
export class UserDto {
  /** User id. */
  @ApiProperty({example: 2})
  id: number;

  /** Display name. */
  @ApiProperty({example: 'Anna'})
  name: string;

  /** Role of the user. */
  @ApiProperty({enum: Role, enumName: 'Role', example: Role.USER})
  role: Role;

  /**
   * Maps a user entity to its DTO.
   *
   * @param user - The entity to map.
   * @returns The DTO.
   */
  static from(user: User): UserDto {
    return {id: user.id, name: user.name, role: user.role};
  }
}
