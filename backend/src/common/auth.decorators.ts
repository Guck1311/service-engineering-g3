import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import type {User} from '../users/user.entity.js';
import {Role} from './role.enum.js';

/** Metadata key under which {@link Roles} stores the allowed roles. */
export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint (or all endpoints of a controller) to the given roles.
 * Without it, any known user may call the endpoint.
 *
 * @param roles - Roles that are allowed to call the endpoint.
 *
 * @example
 * ```ts
 * @Post()
 * @Roles(Role.ADMIN)
 * create(@Body() dto: CreateMusicItemDto) { ... }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Parameter decorator that injects the caller, i.e. the user that
 * {@link AuthGuard} resolved from the `X-User-Id` header.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest().user,
);

/**
 * Ensures that users only act on resources that belong to them.
 *
 * @param caller - The user making the request.
 * @param userId - Owner of the resource, usually taken from the path.
 * @throws ForbiddenException if the caller is not the owner.
 */
export function assertOwner(caller: User, userId: number): void {
  if (caller.id !== userId) {
    throw new ForbiddenException('You can only modify your own data');
  }
}
