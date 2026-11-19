import { http } from '@/api/http'
import type { User } from '@/api/types'

/** Seeded users (read-only; there is no user management). */
export const usersService = {
  /** GET /users */
  async list(): Promise<User[]> {
    const { data } = await http.get<User[]>('/users')
    return data
  },

  /** GET /users/{id} */
  async get(id: number): Promise<User> {
    const { data } = await http.get<User>(`/users/${id}`)
    return data
  },
}
