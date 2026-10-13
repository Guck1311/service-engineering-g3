import {request} from '@/api/http';
import type {User} from '@/api/types';

/** REST calls for the seeded users (`/users`). */
export const usersService = {
  /**
   * Lists all users. This endpoint is public, so the user switcher can load
   * it before a user is selected.
   *
   * @returns All users.
   */
  list(): Promise<User[]> {
    return request('GET', '/users');
  },
};
