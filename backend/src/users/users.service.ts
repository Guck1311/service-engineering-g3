import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {User} from './user.entity.js';

/** Read access to the seeded users; also used by `AuthGuard` to resolve the caller. */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /**
   * Lists all users.
   *
   * @returns All users, ordered by id.
   */
  findAll(): Promise<User[]> {
    return this.users.find({order: {id: 'ASC'}});
  }

  /**
   * Looks up a user without failing.
   *
   * @param id - User id.
   * @returns The user, or `null` if no user has this id.
   */
  findById(id: number): Promise<User | null> {
    return this.users.findOneBy({id});
  }

  /**
   * Loads a user that must exist.
   *
   * @param id - User id.
   * @returns The user.
   * @throws NotFoundException if no user has this id.
   */
  async getById(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
